"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import {
  buildMatchdayStandings,
  buildSeasonStandings,
  type MatchdayStandingRow,
  type SeasonStandingRow,
} from "@/lib/league-standings";
import { matchdayUnitLabel } from "@/lib/matchday";
import { getTeam } from "@/lib/tournament";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

export interface LeaderboardRow {
  member_id: string;
  display_name: string;
  total_points: number;
  exact_scores: number;
  matches_scored: number;
  total_predictions: number;
}

export interface MemberPredictionRow {
  matchId: string;
  matchCode: string;
  kickoffUtc: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  groupLetter: string | null;
  status: string;
  actual: { home: number; away: number } | null;
  predicted: { home: number; away: number } | null;
  pointsEarned: number | null;
}

/** Authorize the caller for a league: must be a member or the org owner. */
async function resolveAccess(code: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("id, name, organization_id, season_id, start_matchday")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) return null;

  const { data: org } = await admin
    .from("organizations")
    .select("owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  const isOwner = !!org?.owner_email && org.owner_email === user.email;

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!member && !isOwner) return null;
  return { admin, league, isOwner };
}

export async function getLeaderboard(
  code: string,
): Promise<ActionResult<{ rows: LeaderboardRow[]; liveCount: number }>> {
  const ctx = await resolveAccess(code);
  if (!ctx) {
    return { ok: false, error: "Not allowed.", code: "forbidden" };
  }
  const { admin, league } = ctx;

  const { data: rows } = await admin
    .from("leaderboard")
    .select(
      "member_id, display_name, total_points, exact_scores, matches_scored, total_predictions",
    )
    .eq("league_id", league.id)
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false });

  const { count: liveCount } = await admin
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  const clean: LeaderboardRow[] = (rows ?? []).map((r) => ({
    member_id: r.member_id ?? "",
    display_name: r.display_name ?? "—",
    total_points: r.total_points ?? 0,
    exact_scores: r.exact_scores ?? 0,
    matches_scored: r.matches_scored ?? 0,
    total_predictions: r.total_predictions ?? 0,
  }));

  return { ok: true, data: { rows: clean, liveCount: liveCount ?? 0 } };
}

export interface SeasonLeaderboardData {
  competitionName: string;
  seasonLabel: string;
  unitLabel: string;
  matchday: number;
  matchdays: number[];
  startMatchday: number | null;
  /** Whether this matchday has been scored — drives "winner" vs "not yet". */
  scored: boolean;
  season: SeasonStandingRow[];
  thisMatchday: MatchdayStandingRow[];
}

/**
 * Season-to-date and this-matchday standings for a league bound to a season
 * with matchdays. Returns `null` data for a World Cup league, whose caller
 * falls back to the flat all-time leaderboard above.
 *
 * `matchday` defaults to the latest one that has been scored — a leaderboard
 * should open on the last completed round, not on a round nobody has played
 * yet, which would show a table of zeroes.
 */
export async function getSeasonLeaderboard(
  code: string,
  requestedMatchday?: number | null,
): Promise<ActionResult<SeasonLeaderboardData | null>> {
  const ctx = await resolveAccess(code);
  if (!ctx) return { ok: false, error: "Not allowed.", code: "forbidden" };
  const { admin, league } = ctx;

  if (!league.season_id) return { ok: true, data: null };

  const { data: season } = await admin
    .from("seasons")
    .select("label, competitions!inner(name, kind)")
    .eq("id", league.season_id)
    .maybeSingle();
  if (!season) return { ok: true, data: null };
  const competition = Array.isArray(season.competitions)
    ? season.competitions[0]
    : season.competitions;

  const [pointsRes, rosterRes, scoredRes] = await Promise.all([
    admin
      .from("matchday_points")
      .select("member_id, display_name, matchday, points, scored, exact_scores, predictions")
      .eq("league_id", league.id),
    admin.from("members").select("id, display_name").eq("league_id", league.id),
    // Matchdays with at least one finished fixture — the ones worth ranking.
    admin
      .from("fixtures")
      .select("matchday")
      .eq("season_id", league.season_id)
      .eq("status", "finished")
      .not("matchday", "is", null),
  ]);

  const start = league.start_matchday;
  const scoredMatchdays = [
    ...new Set((scoredRes.data ?? []).map((f) => f.matchday as number)),
  ]
    .filter((md) => start == null || md >= start)
    .sort((a, b) => a - b);

  // Nothing in this league's window has been played yet.
  if (scoredMatchdays.length === 0) {
    return {
      ok: true,
      data: {
        competitionName: competition?.name ?? "",
        seasonLabel: season.label,
        unitLabel: matchdayUnitLabel(competition?.kind ?? "league"),
        matchday: start ?? 1,
        matchdays: [],
        startMatchday: start,
        scored: false,
        season: [],
        thisMatchday: [],
      },
    };
  }

  const latest = scoredMatchdays[scoredMatchdays.length - 1]!;
  const matchday =
    requestedMatchday != null && scoredMatchdays.includes(requestedMatchday)
      ? requestedMatchday
      : latest;

  const rows = (pointsRes.data ?? []).map((r) => ({
    member_id: r.member_id ?? "",
    display_name: r.display_name ?? "—",
    matchday: r.matchday ?? 0,
    points: r.points ?? 0,
    scored: r.scored ?? 0,
    exact_scores: r.exact_scores ?? 0,
    predictions: r.predictions ?? 0,
  }));
  const roster = (rosterRes.data ?? []).map((m) => ({
    id: m.id,
    display_name: m.display_name,
  }));

  return {
    ok: true,
    data: {
      competitionName: competition?.name ?? "",
      seasonLabel: season.label,
      unitLabel: matchdayUnitLabel(competition?.kind ?? "league"),
      matchday,
      matchdays: scoredMatchdays,
      startMatchday: start,
      scored: true,
      season: buildSeasonStandings({
        rows,
        roster,
        throughMatchday: matchday,
        startMatchday: start,
      }),
      thisMatchday: buildMatchdayStandings({ rows, roster, matchday }),
    },
  };
}

export async function getMemberPredictions(
  code: string,
  memberId: string,
): Promise<
  ActionResult<{ displayName: string; rows: MemberPredictionRow[] }>
> {
  const ctx = await resolveAccess(code);
  if (!ctx) {
    return { ok: false, error: "Not allowed.", code: "forbidden" };
  }
  const { admin, league } = ctx;

  const { data: member } = await admin
    .from("members")
    .select("id, display_name")
    .eq("id", memberId)
    .eq("league_id", league.id)
    .maybeSingle();
  if (!member) {
    return { ok: false, error: "Member not found.", code: "not_found" };
  }

  const [matchesRes, predsRes] = await Promise.all([
    admin
      .from("matches")
      .select(
        "id, match_code, kickoff_utc, home_team, away_team, group_letter, status, home_score, away_score",
      )
      .eq("stage", "group")
      .order("kickoff_utc", { ascending: true }),
    admin
      .from("predictions")
      .select("match_id, home_score, away_score, points_earned")
      .eq("member_id", memberId),
  ]);

  const predByMatch = new Map(
    (predsRes.data ?? []).map((p) => [p.match_id, p]),
  );

  const rows: MemberPredictionRow[] = (matchesRes.data ?? []).map((m) => {
    const pred = predByMatch.get(m.id);
    return {
      matchId: m.id,
      matchCode: m.match_code,
      kickoffUtc: m.kickoff_utc,
      homeTeam: m.home_team ?? "TBD",
      awayTeam: m.away_team ?? "TBD",
      homeFlag: getTeam(m.home_team)?.flag ?? "",
      awayFlag: getTeam(m.away_team)?.flag ?? "",
      groupLetter: m.group_letter,
      status: m.status,
      actual:
        m.home_score != null && m.away_score != null
          ? { home: m.home_score, away: m.away_score }
          : null,
      predicted: pred
        ? { home: pred.home_score, away: pred.away_score }
        : null,
      pointsEarned: pred?.points_earned ?? null,
    };
  });

  return { ok: true, data: { displayName: member.display_name, rows } };
}
