import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import type { Tables } from "@/types/db";

/**
 * Integration tests for supabase/migrations/0001_initial.sql.
 *
 * These hit a REAL Postgres (local Supabase) via the service-role client, so
 * they exercise the actual triggers. They require migrations applied and the
 * env vars below set (e.g. via `.env.local` + `supabase start`). When those
 * are absent the whole suite skips, keeping `pnpm test` green on machines that
 * haven't started a local DB.
 *
 * Isolation strategy ("test schema"): every row is tagged with a per-run unique
 * suffix and torn down in afterEach. Deleting the root organization cascades to
 * its licenses → leagues → members → predictions; matches are global so they're
 * tracked and deleted explicitly.
 */
const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const dbDescribe = hasDbEnv ? describe : describe.skip;

if (!hasDbEnv) {
  // eslint-disable-next-line no-console
  console.warn(
    "[lib/db.test] Skipping DB tests: set NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY (and run `supabase start`) to enable them.",
  );
}

const HOUR_MS = 60 * 60 * 1000;
const FUTURE_EXPIRY = "2026-10-19T00:00:00Z"; // tournament end + 90d grace

let counter = 0;
/** Unique-per-call token so parallel/repeat runs never collide. */
function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

dbDescribe("0001_initial schema + triggers", () => {
  let supabase!: ReturnType<typeof createAdminClient>;
  const createdOrgIds: string[] = [];
  const createdMatchIds: string[] = [];

  beforeAll(() => {
    supabase = createAdminClient();
  });

  afterEach(async () => {
    if (createdOrgIds.length > 0) {
      await supabase.from("organizations").delete().in("id", createdOrgIds);
      createdOrgIds.length = 0;
    }
    if (createdMatchIds.length > 0) {
      await supabase.from("matches").delete().in("id", createdMatchIds);
      createdMatchIds.length = 0;
    }
  }, 20_000);

  // ---- fixture helpers ----

  async function insertOrg(): Promise<Tables<"organizations">> {
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: "Test Co", owner_email: `owner-${uid()}@example.com` })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdOrgIds.push(data!.id);
    return data!;
  }

  async function insertLicense(
    organizationId: string,
    maxMembers: number,
  ): Promise<Tables<"licenses">> {
    const { data, error } = await supabase
      .from("licenses")
      .insert({
        organization_id: organizationId,
        tier: "pro",
        max_members: maxMembers,
        amount_paid_pence: 49900,
        stripe_session_id: `cs_test_${uid()}`,
        expires_at: FUTURE_EXPIRY,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    return data!;
  }

  async function insertLeague(
    organizationId: string,
    licenseId: string,
  ): Promise<Tables<"leagues">> {
    const token = uid();
    const { data, error } = await supabase
      .from("leagues")
      .insert({
        organization_id: organizationId,
        license_id: licenseId,
        name: "Test League",
        slug: `test-league-${token}`,
        join_code: `MIGHTY-LIONS-${token}`,
        created_by_email: `owner-${token}@example.com`,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    return data!;
  }

  async function insertMember(
    leagueId: string,
    email = `member-${uid()}@example.com`,
  ) {
    return supabase
      .from("members")
      .insert({ league_id: leagueId, email, display_name: "Test Member" })
      .select()
      .single();
  }

  async function insertMatch(kickoffUtc: string): Promise<Tables<"matches">> {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        match_code: `TEST_${uid()}`,
        kickoff_utc: kickoffUtc,
        stage: "group",
        group_letter: "A",
        home_team: "Testland",
        away_team: "Mockovia",
        venue: "Test Stadium",
        venue_city: "Testville",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    createdMatchIds.push(data!.id);
    return data!;
  }

  // ---- (a) basic inserts across the chain ----

  it("inserts an organization, license, league, member, and match", async () => {
    const org = await insertOrg();
    const license = await insertLicense(org.id, 50);
    const league = await insertLeague(org.id, license.id);
    const future = new Date(Date.now() + 24 * HOUR_MS).toISOString();
    const match = await insertMatch(future);

    const { data: member, error: memberError } = await insertMember(league.id);
    expect(memberError).toBeNull();
    expect(member).not.toBeNull();

    expect(org.id).toBeTruthy();
    expect(license.organization_id).toBe(org.id);
    expect(league.license_id).toBe(license.id);
    expect(member!.league_id).toBe(league.id);
    expect(match.status).toBe("scheduled");
  }, 20_000);

  // ---- (b) enforce_prediction_lockdown ----

  it("blocks a prediction once the match has kicked off", async () => {
    const org = await insertOrg();
    const license = await insertLicense(org.id, 50);
    const league = await insertLeague(org.id, license.id);
    const { data: member } = await insertMember(league.id);

    const pastKickoff = new Date(Date.now() - HOUR_MS).toISOString();
    const match = await insertMatch(pastKickoff);

    const { error } = await supabase.from("predictions").insert({
      member_id: member!.id,
      match_id: match.id,
      home_score: 2,
      away_score: 1,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/locked/i);
  }, 20_000);

  it("allows a prediction before kickoff (lockdown control case)", async () => {
    const org = await insertOrg();
    const license = await insertLicense(org.id, 50);
    const league = await insertLeague(org.id, license.id);
    const { data: member } = await insertMember(league.id);

    const future = new Date(Date.now() + 24 * HOUR_MS).toISOString();
    const match = await insertMatch(future);

    const { error } = await supabase.from("predictions").insert({
      member_id: member!.id,
      match_id: match.id,
      home_score: 2,
      away_score: 1,
    });

    expect(error).toBeNull();
  }, 20_000);

  // ---- (c) enforce_member_cap ----

  it("blocks a member that exceeds the license max_members cap", async () => {
    const org = await insertOrg();
    const license = await insertLicense(org.id, 1); // cap of one
    const league = await insertLeague(org.id, license.id);

    const { error: firstError } = await insertMember(league.id);
    expect(firstError).toBeNull();

    const { error: secondError } = await insertMember(league.id);
    expect(secondError).not.toBeNull();
    expect(secondError?.message).toMatch(/cap/i);
  }, 20_000);
});
