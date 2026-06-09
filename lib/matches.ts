import { createAdminClient } from "@/lib/db";

/** Matches currently in progress (status = 'live'). Drives leaderboard polling cadence. */
export async function getMatchesLive() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("matches")
    .select("id, match_code, home_team, away_team, kickoff_utc, status")
    .eq("status", "live");
  return data ?? [];
}
