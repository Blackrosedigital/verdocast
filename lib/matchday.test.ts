import { afterEach, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import { loadMatchdayView, matchdayUnitLabel } from "@/lib/matchday";

/**
 * Integration tests for the matchday predict view.
 *
 * Hits a REAL database via the service-role client, against the seeded
 * Premier League and Champions League 2026/27 seasons, so it exercises the
 * whole path the page depends on: season detection, matchday resolution,
 * fixture loading, club colours and prediction attachment.
 *
 * Isolation follows lib/db.test.ts: every row is created under a throwaway
 * organization, and deleting that organization cascades to its license,
 * league, members and predictions.
 */

const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const dbDescribe = hasDbEnv ? describe : describe.skip;

let counter = 0;
function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

dbDescribe("loadMatchdayView", () => {
  const admin = createAdminClient();
  const orgIds: string[] = [];

  afterEach(async () => {
    if (orgIds.length) {
      await admin.from("organizations").delete().in("id", orgIds);
      orgIds.length = 0;
    }
  });

  async function seasonIdFor(slug: string): Promise<string> {
    const { data } = await admin
      .from("seasons")
      .select("id, competitions!inner(slug)")
      .eq("competitions.slug", slug)
      .maybeSingle();
    if (!data) throw new Error(`No season seeded for ${slug}`);
    return data.id;
  }

  async function makeLeague(opts: {
    seasonId: string | null;
    startMatchday: number | null;
  }) {
    const token = uid();
    const { data: org } = await admin
      .from("organizations")
      .insert({ name: `MD Test ${token}`, owner_email: `md-${token}@example.com` })
      .select()
      .single();
    orgIds.push(org!.id);

    const { data: license } = await admin
      .from("licenses")
      .insert({
        organization_id: org!.id,
        tier: "starter",
        max_members: 50,
        amount_paid_pence: 0,
        expires_at: "2027-12-31T00:00:00Z",
      })
      .select()
      .single();

    const { data: league } = await admin
      .from("leagues")
      .insert({
        organization_id: org!.id,
        license_id: license!.id,
        name: `MD League ${token}`,
        slug: `md-league-${token}`,
        join_code: `MDTEST-${token}`.toUpperCase(),
        created_by_email: `md-${token}@example.com`,
        season_id: opts.seasonId,
        start_matchday: opts.startMatchday,
      })
      .select()
      .single();

    const { data: member } = await admin
      .from("members")
      .insert({
        league_id: league!.id,
        email: `member-${token}@example.com`,
        display_name: "Tester",
      })
      .select()
      .single();

    return { league: league!, member: member! };
  }

  it("loads a Champions League matchday with club colours", async () => {
    const seasonId = await seasonIdFor("champions-league");
    const { league, member } = await makeLeague({ seasonId, startMatchday: 2 });

    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId,
      startMatchday: 2,
      memberId: member.id,
      requestedMatchday: "2",
    });

    expect(view.isMatchdaySeason).toBe(true);
    expect(view.season?.competitionName).toBe("UEFA Champions League");
    expect(view.current?.matchday).toBe(2);
    // The Swiss league phase plays 18 ties per matchday.
    expect(view.fixtures).toHaveLength(18);
    expect(view.season?.totalMatchdays).toBe(8);

    // Clubs are identified by colour, not crests.
    for (const f of view.fixtures) {
      expect(f.homeColor).toBeTruthy();
      expect(f.awayColor).toBeTruthy();
      expect(f.homeFlag).toBe("");
      expect(f.homeTeam).not.toBe("TBD");
    }
  });

  it("uses Gameweek for a domestic league and Matchday for the UCL", async () => {
    expect(matchdayUnitLabel("league")).toBe("Gameweek");
    expect(matchdayUnitLabel("cup")).toBe("Matchday");
  });

  it("loads a Premier League gameweek of ten fixtures", async () => {
    const seasonId = await seasonIdFor("premier-league");
    const { league, member } = await makeLeague({ seasonId, startMatchday: 5 });

    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId,
      startMatchday: 5,
      memberId: member.id,
      requestedMatchday: "5",
    });

    expect(view.current?.matchday).toBe(5);
    expect(view.fixtures).toHaveLength(10);
    expect(view.season?.totalMatchdays).toBe(38);
    expect(view.matchdays).toHaveLength(38);
    expect(view.prevMatchday).toBe(4);
    expect(view.nextMatchday).toBe(6);
  });

  it("flags a matchday before the league's window and marks it played", async () => {
    const seasonId = await seasonIdFor("champions-league");
    const { league, member } = await makeLeague({ seasonId, startMatchday: 2 });

    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId,
      startMatchday: 2,
      memberId: member.id,
      requestedMatchday: "1", // MD1 was played 8-10 Sep 2026
    });

    expect(view.current?.matchday).toBe(1);
    expect(view.state?.beforeLeagueStart).toBe(true);
    expect(view.state?.complete).toBe(true);
    // Played fixtures are locked, and carry their real result.
    expect(view.fixtures.every((f) => f.locked)).toBe(true);
    expect(view.fixtures.every((f) => f.status === "finished")).toBe(true);
    expect(view.fixtures.every((f) => f.homeScore != null)).toBe(true);
  });

  it("attaches the member's own prediction to a fixture", async () => {
    const seasonId = await seasonIdFor("champions-league");
    const { league, member } = await makeLeague({ seasonId, startMatchday: 2 });

    const { data: fixtures } = await admin
      .from("fixtures")
      .select("id")
      .eq("season_id", seasonId)
      .eq("matchday", 2)
      .order("kickoff_utc")
      .limit(1);
    const fixtureId = fixtures![0]!.id;

    await admin.from("predictions").insert({
      member_id: member.id,
      match_id: fixtureId,
      home_score: 2,
      away_score: 1,
    });

    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId,
      startMatchday: 2,
      memberId: member.id,
      requestedMatchday: "2",
    });

    const predicted = view.fixtures.filter((f) => f.prediction);
    expect(predicted).toHaveLength(1);
    expect(predicted[0]!.id).toBe(fixtureId);
    expect(predicted[0]!.prediction).toMatchObject({ homeScore: 2, awayScore: 1 });
    // Unscored until the fixture finishes.
    expect(predicted[0]!.prediction?.pointsEarned).toBeNull();
  });

  // A World Cup league must keep the original all-fixtures view: every WC
  // fixture has a null matchday, so there is no matchday rhythm to show.
  it("reports a World Cup league as not matchday-shaped", async () => {
    const seasonId = await seasonIdFor("fifa-world-cup");
    const { league, member } = await makeLeague({ seasonId, startMatchday: null });

    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId,
      startMatchday: null,
      memberId: member.id,
    });

    expect(view.isMatchdaySeason).toBe(false);
    expect(view.current).toBeNull();
  });

  it("reports a league with no season as not matchday-shaped", async () => {
    const { league, member } = await makeLeague({ seasonId: null, startMatchday: null });
    const view = await loadMatchdayView({
      leagueId: league.id,
      seasonId: null,
      startMatchday: null,
      memberId: member.id,
    });
    expect(view.isMatchdaySeason).toBe(false);
  });
});
