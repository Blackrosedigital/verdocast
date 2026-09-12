import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_RULES, scorePrediction, type ScoringRules } from "@/lib/scoring";
import type { Database, Enums } from "@/types/db";

type Admin = SupabaseClient<Database>;

const RulesSchema = z.object({
  exact: z.number(),
  goal_diff: z.number(),
  result: z.number(),
});

function parseRules(raw: unknown): ScoringRules {
  const parsed = RulesSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_RULES;
}

function resultChar(home: number, away: number): "H" | "D" | "A" {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

/**
 * Score every prediction on a finished fixture, using each member's league
 * scoring rules. Writes points_earned. Returns how many were scored.
 *
 * Respects each league's mid-season start: a league whose `start_matchday` is
 * later than this fixture's matchday does not score it, and the prediction is
 * left unscored (null) rather than zeroed, because "outside your league's
 * window" is not the same fact as "you scored nothing". Leagues with no
 * start_matchday — every World Cup league, where a tournament has no
 * matchdays — score everything, as they always did.
 */
async function scorePredictionsForMatch(
  admin: Admin,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<number> {
  const { data: preds } = await admin
    .from("predictions")
    .select("id, home_score, away_score, member_id")
    .eq("match_id", matchId);
  if (!preds || preds.length === 0) return 0;

  const { data: fixture } = await admin
    .from("fixtures")
    .select("matchday")
    .eq("id", matchId)
    .maybeSingle();
  const matchday = fixture?.matchday ?? null;

  const memberIds = [...new Set(preds.map((p) => p.member_id))];
  const { data: members } = await admin
    .from("members")
    .select("id, league_id")
    .in("id", memberIds);
  const leagueByMember = new Map((members ?? []).map((m) => [m.id, m.league_id]));

  const leagueIds = [...new Set((members ?? []).map((m) => m.league_id))];
  const { data: leagues } = await admin
    .from("leagues")
    .select("id, scoring_rules, start_matchday")
    .in("id", leagueIds);
  const rulesByLeague = new Map(
    (leagues ?? []).map((l) => [l.id, parseRules(l.scoring_rules)]),
  );
  const startByLeague = new Map(
    (leagues ?? []).map((l) => [l.id, l.start_matchday]),
  );

  let scored = 0;
  for (const p of preds) {
    const leagueId = leagueByMember.get(p.member_id);

    const start = leagueId ? startByLeague.get(leagueId) : null;
    if (start != null && matchday != null && matchday < start) continue;

    const rules = (leagueId && rulesByLeague.get(leagueId)) || DEFAULT_RULES;
    const points = scorePrediction({
      predicted: { h: p.home_score, a: p.away_score },
      actual: { h: homeScore, a: awayScore },
      rules,
    });
    const { error } = await admin
      .from("predictions")
      .update({ points_earned: points })
      .eq("id", p.id);
    if (!error) scored += 1;
  }
  return scored;
}

export interface ApplyResultInput {
  /** A fixture id. Named for the column it settles (`predictions.match_id`),
   *  which kept its name through migration 0007. */
  matchId: string;
  status: Enums<"match_status">;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Provider fixture id, stored on first sighting so later polls can pin
   *  this row directly. */
  externalId?: string | null;
}

export interface ApplyResultOutcome {
  updated: boolean;
  newlyFinished: boolean;
  scored: number;
}

/**
 * Update a fixture's status/score and, when it transitions to "finished" for
 * the first time, score every prediction on it — exactly once (CLAUDE.md).
 *
 * Safe to re-run: an already-finished fixture is not re-scored, so a poll that
 * sees the same final score ten times still pays out once.
 */
export async function applyFixtureResult(
  admin: Admin,
  input: ApplyResultInput,
): Promise<ApplyResultOutcome> {
  const { matchId, status, homeScore, awayScore, externalId } = input;

  const { data: current } = await admin
    .from("fixtures")
    .select("status, home_score, away_score")
    .eq("id", matchId)
    .maybeSingle();
  if (!current) return { updated: false, newlyFinished: false, scored: 0 };

  const wasFinished = current.status === "finished";

  // Nothing changed — skip the write entirely. Polling every 30s across two
  // active seasons is overwhelmingly no-ops (476 of 524 fixtures are unplayed
  // at launch), and a write per fixture per poll would be pure churn on the
  // table the predict view reads.
  //
  // Note what this does NOT do: it will not retroactively score a fixture
  // that finished but whose predictions were never scored. Such a fixture is
  // "unchanged" and returns here. That is not an oversight — the World Cup has
  // exactly one of these (GROUP_J_2, finished 3-1 with three unscored
  // predictions), and quietly paying it out on some future poll would change a
  // published leaderboard with no record of why. Repairing those is an
  // explicit, deliberate operation, not a side effect of polling.
  const unchanged =
    current.status === status &&
    (homeScore == null || current.home_score === homeScore) &&
    (awayScore == null || current.away_score === awayScore);
  if (unchanged) {
    return { updated: false, newlyFinished: false, scored: 0 };
  }

  const now = new Date().toISOString();
  const patch: Database["public"]["Tables"]["fixtures"]["Update"] = {
    status,
    updated_at: now,
  };
  if (homeScore != null) patch.home_score = homeScore;
  if (awayScore != null) patch.away_score = awayScore;
  if (externalId) patch.provider_fixture_id = externalId;
  if (status === "finished" && homeScore != null && awayScore != null) {
    patch.result = resultChar(homeScore, awayScore);
    if (!wasFinished) patch.finalised_at = now;
  }

  await admin.from("fixtures").update(patch).eq("id", matchId);

  let scored = 0;
  const newlyFinished =
    status === "finished" &&
    !wasFinished &&
    homeScore != null &&
    awayScore != null;
  if (newlyFinished) {
    scored = await scorePredictionsForMatch(admin, matchId, homeScore, awayScore);
  }

  return { updated: true, newlyFinished, scored };
}

/**
 * @deprecated Use {@link applyFixtureResult}. Retained under its old name for
 * the World Cup call sites; identical behaviour, since fixture ids were
 * preserved from match ids in 0007.
 */
export const applyMatchResult = applyFixtureResult;
