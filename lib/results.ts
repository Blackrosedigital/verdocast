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
 * Score every prediction on a finished match, using each member's league
 * scoring rules. Writes points_earned. Returns how many were scored.
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

  const memberIds = [...new Set(preds.map((p) => p.member_id))];
  const { data: members } = await admin
    .from("members")
    .select("id, league_id")
    .in("id", memberIds);
  const leagueByMember = new Map((members ?? []).map((m) => [m.id, m.league_id]));

  const leagueIds = [...new Set((members ?? []).map((m) => m.league_id))];
  const { data: leagues } = await admin
    .from("leagues")
    .select("id, scoring_rules")
    .in("id", leagueIds);
  const rulesByLeague = new Map(
    (leagues ?? []).map((l) => [l.id, parseRules(l.scoring_rules)]),
  );

  let scored = 0;
  for (const p of preds) {
    const leagueId = leagueByMember.get(p.member_id);
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
  matchId: string;
  status: Enums<"match_status">;
  homeScore?: number | null;
  awayScore?: number | null;
  externalId?: string | null;
}

export interface ApplyResultOutcome {
  updated: boolean;
  newlyFinished: boolean;
  scored: number;
}

/**
 * Update a match's status/score and, when it transitions to "finished" for the
 * first time, score every prediction on it — exactly once (CLAUDE.md). Safe to
 * re-run: an already-finished match is not re-scored.
 */
export async function applyMatchResult(
  admin: Admin,
  input: ApplyResultInput,
): Promise<ApplyResultOutcome> {
  const { matchId, status, homeScore, awayScore, externalId } = input;

  const { data: current } = await admin
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle();
  if (!current) return { updated: false, newlyFinished: false, scored: 0 };

  const wasFinished = current.status === "finished";
  const now = new Date().toISOString();

  const patch: Database["public"]["Tables"]["matches"]["Update"] = {
    status,
    updated_at: now,
  };
  if (homeScore != null) patch.home_score = homeScore;
  if (awayScore != null) patch.away_score = awayScore;
  if (externalId) patch.external_id = externalId;
  if (status === "finished" && homeScore != null && awayScore != null) {
    patch.result = resultChar(homeScore, awayScore);
    patch.finalised_at = now;
  }

  await admin.from("matches").update(patch).eq("id", matchId);

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
