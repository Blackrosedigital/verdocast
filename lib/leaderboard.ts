"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

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
    .select("id, name, organization_id")
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
        "id, match_code, kickoff_utc, home_team, away_team, status, home_score, away_score",
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
