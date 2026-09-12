"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

const Schema = z.object({
  leagueCode: z.string().min(1),
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

/**
 * Save (insert or update) the signed-in member's prediction for a match.
 * The member is resolved server-side from the session + league (the client
 * never passes a member id). Kickoff lockdown is enforced here and by the DB
 * trigger as a backstop.
 */
export async function submitPrediction(input: {
  leagueCode: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
}): Promise<ActionResult<{ matchId: string }>> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid prediction.",
      code: "invalid_input",
    };
  }
  const { leagueCode, matchId, homeScore, awayScore } = parsed.data;

  const user = await requireUser();
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("id, season_id, start_matchday")
    .eq("join_code", leagueCode)
    .maybeSingle();
  if (!league) {
    return { ok: false, error: "League not found.", code: "not_found" };
  }

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();
  if (!member) {
    return {
      ok: false,
      error: "You’re not a member of this league.",
      code: "forbidden",
    };
  }

  // Read from `fixtures`, not the `matches` view: that view is filtered to the
  // World Cup season, so a Premier League or Champions League fixture is not
  // in it at all.
  const { data: fixture } = await admin
    .from("fixtures")
    .select("kickoff_utc, season_id, matchday")
    .eq("id", matchId)
    .maybeSingle();
  if (!fixture) {
    return { ok: false, error: "Match not found.", code: "not_found" };
  }

  // The fixture must belong to the season this league is playing. Without this
  // a crafted request could attach a prediction from another competition
  // entirely — the client picks the fixture id, so it cannot be trusted.
  if (league.season_id && fixture.season_id !== league.season_id) {
    return {
      ok: false,
      error: "That match isn’t part of this league’s season.",
      code: "wrong_season",
    };
  }

  // Fixtures before the league's window are shown read-only and score nothing,
  // so a prediction on one is meaningless — reject it rather than store a row
  // that can never earn a point.
  if (
    league.start_matchday != null &&
    fixture.matchday != null &&
    fixture.matchday < league.start_matchday
  ) {
    return {
      ok: false,
      error: "That match is from before your league started.",
      code: "before_league_start",
    };
  }

  if (new Date(fixture.kickoff_utc).getTime() <= Date.now()) {
    return {
      ok: false,
      error: "Predictions are locked — this match has kicked off.",
      code: "locked",
    };
  }

  const { error } = await admin
    .from("predictions")
    .upsert(
      {
        member_id: member.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
      },
      { onConflict: "member_id,match_id" },
    );

  if (error) {
    // The lockdown trigger is the source of truth if app-time and DB-time differ.
    if (/locked/i.test(error.message)) {
      return {
        ok: false,
        error: "Predictions are locked — this match has kicked off.",
        code: "locked",
      };
    }
    return {
      ok: false,
      error: "Could not save your prediction. Please try again.",
      code: "save_failed",
    };
  }

  return { ok: true, data: { matchId } };
}
