import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import type { Database } from "@/types/db";

/**
 * RLS integration test. Creates two isolated leagues and verifies that a member
 * authenticated with the ANON key (subject to RLS) can only read their own
 * league's data — not the other league's. Requires migrations 0001–0003 applied
 * and SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY set; skips otherwise.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);
const dbDescribe = hasEnv ? describe : describe.skip;

const FUTURE_EXPIRY = "2026-10-19T00:00:00Z";
let counter = 0;
const uid = () => `${Date.now().toString(36)}-${++counter}`;

dbDescribe("RLS policies", () => {
  const admin = hasEnv ? createAdminClient() : (null as never);
  const orgIds: string[] = [];
  const matchIds: string[] = [];
  const authUserIds: string[] = [];
  const ctx: {
    leagueAId?: string;
    leagueBId?: string;
    aliceClient?: ReturnType<typeof createSupabaseClient<Database>>;
  } = {};

  async function seedLeague(ownerEmail: string, memberEmail: string) {
    const token = uid();
    const { data: org } = await admin
      .from("organizations")
      .insert({ name: `Org ${token}`, owner_email: ownerEmail })
      .select()
      .single();
    orgIds.push(org!.id);
    const { data: license } = await admin
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
    const { data: league } = await admin
      .from("leagues")
      .insert({
        organization_id: org!.id,
        license_id: license!.id,
        name: `League ${token}`,
        slug: `lg-${token}`,
        join_code: `CODE-${token}`,
        created_by_email: ownerEmail,
      })
      .select()
      .single();
    const { data: member } = await admin
      .from("members")
      .insert({ league_id: league!.id, email: memberEmail, display_name: "M" })
      .select()
      .single();
    const { data: match } = await admin
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
    await admin.from("predictions").insert({
      member_id: member!.id,
      match_id: match!.id,
      home_score: 1,
      away_score: 0,
    });
    return league!.id;
  }

  beforeAll(async () => {
    const run = uid();
    const aliceEmail = `alice-${run}@example.com`;
    const bobEmail = `bob-${run}@example.com`;

    ctx.leagueAId = await seedLeague(`ownerA-${run}@example.com`, aliceEmail);
    ctx.leagueBId = await seedLeague(`ownerB-${run}@example.com`, bobEmail);

    // Create auth users so they can sign in.
    for (const email of [aliceEmail, bobEmail]) {
      const { data } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (data.user) authUserIds.push(data.user.id);
    }

    // Sign Alice in via the anon client and pin her JWT.
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: aliceEmail,
    });
    const bootstrap = createSupabaseClient<Database>(URL!, ANON!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: otp } = await bootstrap.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.data.properties!.hashed_token,
    });
    const token = otp.session!.access_token;
    ctx.aliceClient = createSupabaseClient<Database>(URL!, ANON!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }, 30_000);

  afterAll(async () => {
    if (!hasEnv) return;
    if (orgIds.length) await admin.from("organizations").delete().in("id", orgIds);
    if (matchIds.length) await admin.from("matches").delete().in("id", matchIds);
    for (const id of authUserIds) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 30_000);

  it("a member sees their own league but not another", async () => {
    const alice = ctx.aliceClient!;
    const { data: leagues } = await alice.from("leagues").select("id");
    const ids = (leagues ?? []).map((l) => l.id);
    expect(ids).toContain(ctx.leagueAId);
    expect(ids).not.toContain(ctx.leagueBId);
  });

  it("a member sees only their league's members", async () => {
    const alice = ctx.aliceClient!;
    const { data: members } = await alice.from("members").select("league_id");
    expect(members && members.length).toBeGreaterThan(0);
    expect((members ?? []).every((m) => m.league_id === ctx.leagueAId)).toBe(true);
  });

  it("a member cannot read another league's predictions", async () => {
    const alice = ctx.aliceClient!;
    // All visible predictions belong to members of league A.
    const { data: preds } = await alice
      .from("predictions")
      .select("member_id, members(league_id)");
    for (const p of preds ?? []) {
      const rel = p.members as unknown as { league_id: string } | null;
      if (rel) expect(rel.league_id).toBe(ctx.leagueAId);
    }
  });
});
