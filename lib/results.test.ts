import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import { applyMatchResult } from "@/lib/results";

/**
 * Integration test for applyMatchResult against a real Postgres (local
 * Supabase). Requires migrations 0001 + 0002 applied and the service-role env
 * vars set; skips otherwise. Verifies that finishing a match scores its
 * predictions exactly once.
 */
const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const dbDescribe = hasDbEnv ? describe : describe.skip;

const FUTURE_EXPIRY = "2026-10-19T00:00:00Z";
let counter = 0;
const uid = () => `${Date.now().toString(36)}-${++counter}`;

dbDescribe("applyMatchResult", () => {
  let supabase!: ReturnType<typeof createAdminClient>;
  const orgIds: string[] = [];
  const matchIds: string[] = [];

  beforeAll(() => {
    supabase = createAdminClient();
  });

  afterEach(async () => {
    if (orgIds.length) {
      await supabase.from("organizations").delete().in("id", orgIds);
      orgIds.length = 0;
    }
    if (matchIds.length) {
      await supabase.from("matches").delete().in("id", matchIds);
      matchIds.length = 0;
    }
  }, 20_000);

  it("scores predictions when a match transitions to finished, exactly once", async () => {
    const token = uid();
    const { data: org } = await supabase
      .from("organizations")
      .insert({ name: "Test Co", owner_email: `o-${token}@example.com` })
      .select()
      .single();
    orgIds.push(org!.id);

    const { data: license } = await supabase
      .from("licenses")
      .insert({
        organization_id: org!.id,
        tier: "pro",
        max_members: 50,
        amount_paid_pence: 49900,
        stripe_session_id: `cs_${token}`,
        expires_at: FUTURE_EXPIRY,
      })
      .select()
      .single();

    const { data: league } = await supabase
      .from("leagues")
      .insert({
        organization_id: org!.id,
        license_id: license!.id,
        name: "L",
        slug: `l-${token}`,
        join_code: `CODE-${token}`,
        created_by_email: `o-${token}@example.com`,
      })
      .select()
      .single();

    const { data: member } = await supabase
      .from("members")
      .insert({ league_id: league!.id, email: `m-${token}@example.com`, display_name: "M" })
      .select()
      .single();

    // Future kickoff so the prediction insert is allowed.
    const { data: match } = await supabase
      .from("matches")
      .insert({
        match_code: `TEST_${token}`,
        kickoff_utc: new Date(Date.now() + 3_600_000).toISOString(),
        stage: "group",
        venue: "V",
        venue_city: "C",
      })
      .select()
      .single();
    matchIds.push(match!.id);

    // Exact-score prediction (2-1).
    await supabase.from("predictions").insert({
      member_id: member!.id,
      match_id: match!.id,
      home_score: 2,
      away_score: 1,
    });

    // Simulate kickoff having passed (no trigger on matches).
    await supabase
      .from("matches")
      .update({ kickoff_utc: new Date(Date.now() - 3_600_000).toISOString() })
      .eq("id", match!.id);

    // Finish 2-1 → exact → 5 points.
    const first = await applyMatchResult(supabase, {
      matchId: match!.id,
      status: "finished",
      homeScore: 2,
      awayScore: 1,
    });
    expect(first.newlyFinished).toBe(true);
    expect(first.scored).toBe(1);

    const { data: scored } = await supabase
      .from("predictions")
      .select("points_earned")
      .eq("member_id", member!.id)
      .eq("match_id", match!.id)
      .single();
    expect(scored!.points_earned).toBe(5);

    // Re-running does not re-score (already finished).
    const second = await applyMatchResult(supabase, {
      matchId: match!.id,
      status: "finished",
      homeScore: 2,
      awayScore: 1,
    });
    expect(second.newlyFinished).toBe(false);
    expect(second.scored).toBe(0);
  }, 30_000);
});
