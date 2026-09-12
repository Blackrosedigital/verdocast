import { afterEach, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import { buildMatchdayStandings, buildSeasonStandings } from "@/lib/league-standings";
import { applyFixtureResult } from "@/lib/results";

/**
 * Integration tests for the `matchday_points` view (0009) and the
 * mid-season scoring rule, against a REAL database.
 *
 * Builds a throwaway competition/season/teams/fixtures rather than using the
 * seeded Premier League or Champions League: the test needs to control kickoff
 * times (predictions are rejected after kickoff by a DB trigger) and to move
 * fixtures to finished, neither of which should be done to shared season data.
 */

const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const dbDescribe = hasDbEnv ? describe : describe.skip;

const HOUR = 60 * 60 * 1000;

let counter = 0;
function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

dbDescribe("matchday_points", () => {
  const admin = createAdminClient();
  const created = { competitions: [] as string[], teams: [] as string[], orgs: [] as string[] };

  // Teardown order is explicit, not incidental. `fixtures.home_team_id` is ON
  // DELETE RESTRICT, so teams cannot go until the fixtures referencing them
  // are gone — which happens via competition -> season -> fixtures cascade.
  // A generic reverse-order cleanup stack got this backwards and silently
  // leaked team rows, because the failed delete returns an error rather than
  // throwing.
  afterEach(async () => {
    if (created.orgs.length) {
      await admin.from("organizations").delete().in("id", created.orgs);
    }
    if (created.competitions.length) {
      await admin.from("competitions").delete().in("id", created.competitions);
    }
    if (created.teams.length) {
      const { error } = await admin.from("teams").delete().in("id", created.teams);
      if (error) throw new Error(`Team cleanup failed: ${error.message}`);
    }
    created.competitions.length = 0;
    created.teams.length = 0;
    created.orgs.length = 0;
  });

  /** An isolated competition + season + two teams + fixtures on two matchdays. */
  async function makeSeason() {
    const token = uid();

    const { data: competition } = await admin
      .from("competitions")
      .insert({
        name: `Test Cup ${token}`,
        slug: `test-cup-${token}`,
        kind: "league",
      })
      .select()
      .single();
    created.competitions.push(competition!.id);

    const { data: season } = await admin
      .from("seasons")
      .insert({ competition_id: competition!.id, label: "2026/27", status: "active" })
      .select()
      .single();

    const { data: teams } = await admin
      .from("teams")
      .insert([
        { name: `Home FC ${token}`, slug: `home-fc-${token}` },
        { name: `Away FC ${token}`, slug: `away-fc-${token}` },
      ])
      .select();
    created.teams.push(...teams!.map((t) => t.id));

    // Kickoffs in the future so predictions are accepted; the test moves them
    // to finished explicitly.
    const kickoff = new Date(Date.now() + 4 * HOUR).toISOString();
    const { data: fixtures } = await admin
      .from("fixtures")
      .insert([1, 1, 2].map((matchday) => ({
        season_id: season!.id,
        stage: "regular",
        matchday,
        home_team_id: teams![0]!.id,
        away_team_id: teams![1]!.id,
        kickoff_utc: kickoff,
      })))
      .select();

    return { season: season!, fixtures: fixtures! };
  }

  async function makeLeague(seasonId: string, startMatchday: number | null) {
    const token = uid();
    const { data: org } = await admin
      .from("organizations")
      .insert({ name: `MP ${token}`, owner_email: `mp-${token}@example.com` })
      .select()
      .single();
    created.orgs.push(org!.id);

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
        name: `MP League ${token}`,
        slug: `mp-league-${token}`,
        join_code: `MP-${token}`.toUpperCase(),
        created_by_email: `mp-${token}@example.com`,
        season_id: seasonId,
        start_matchday: startMatchday,
      })
      .select()
      .single();

    const { data: members } = await admin
      .from("members")
      .insert([
        { league_id: league!.id, email: `a-${token}@example.com`, display_name: "Ana" },
        { league_id: league!.id, email: `b-${token}@example.com`, display_name: "Ben" },
      ])
      .select();

    return { league: league!, members: members! };
  }

  async function pointsFor(leagueId: string) {
    const { data } = await admin
      .from("matchday_points")
      .select("member_id, display_name, matchday, points, scored, exact_scores, predictions")
      .eq("league_id", leagueId);
    return (data ?? []).map((r) => ({
      member_id: r.member_id ?? "",
      display_name: r.display_name ?? "",
      matchday: r.matchday ?? 0,
      points: r.points ?? 0,
      scored: r.scored ?? 0,
      exact_scores: r.exact_scores ?? 0,
      predictions: r.predictions ?? 0,
    }));
  }

  it("aggregates points per member per matchday", async () => {
    const { season, fixtures } = await makeSeason();
    const { league, members } = await makeLeague(season.id, 1);
    const [ana, ben] = members;
    const [md1a, md1b, md2] = fixtures;

    // Ana: exact on md1a (5), result-only on md1b (2). Ben: nothing on MD1.
    await admin.from("predictions").insert([
      { member_id: ana!.id, match_id: md1a!.id, home_score: 2, away_score: 0 },
      { member_id: ana!.id, match_id: md1b!.id, home_score: 3, away_score: 0 },
      { member_id: ben!.id, match_id: md2!.id, home_score: 1, away_score: 1 },
    ]);

    // Settle both MD1 fixtures 2-0: Ana gets 5 (exact) + 2 (right result).
    for (const f of [md1a!, md1b!]) {
      await applyFixtureResult(admin, {
        matchId: f.id, status: "finished", homeScore: 2, awayScore: 0,
      });
    }

    const rows = await pointsFor(league.id);
    const anaMd1 = rows.find((r) => r.member_id === ana!.id && r.matchday === 1);
    expect(anaMd1).toMatchObject({
      points: 7, scored: 2, exact_scores: 1, predictions: 2,
    });

    // Ben predicted matchday 2, which has not been settled: present, unscored.
    const benMd2 = rows.find((r) => r.member_id === ben!.id && r.matchday === 2);
    expect(benMd2).toMatchObject({ points: 0, scored: 0, predictions: 1 });

    // Feeding the view into the pure ranker gives the season table.
    const roster = members.map((m) => ({ id: m.id, display_name: m.display_name }));
    const table = buildSeasonStandings({
      rows, roster, throughMatchday: 1, startMatchday: 1,
    });
    expect(table[0]).toMatchObject({ displayName: "Ana", totalPoints: 7, rank: 1 });
    expect(table[1]).toMatchObject({ displayName: "Ben", totalPoints: 0, rank: 2 });

    const md = buildMatchdayStandings({ rows, roster, matchday: 1 });
    expect(md[0]).toMatchObject({ displayName: "Ana", points: 7, isMatchdayWinner: true });
  });

  // The mid-season rule, enforced where points are written: a league starting
  // at matchday 2 earns nothing from matchday 1, even with a prediction on it.
  it("does not score fixtures from before the league's start matchday", async () => {
    const { season, fixtures } = await makeSeason();
    const { league, members } = await makeLeague(season.id, 2);
    const [ana] = members;
    const [md1a, , md2] = fixtures;

    await admin.from("predictions").insert([
      { member_id: ana!.id, match_id: md1a!.id, home_score: 2, away_score: 0 },
      { member_id: ana!.id, match_id: md2!.id, home_score: 2, away_score: 0 },
    ]);

    for (const f of [md1a!, md2!]) {
      await applyFixtureResult(admin, {
        matchId: f.id, status: "finished", homeScore: 2, awayScore: 0,
      });
    }

    const { data: preds } = await admin
      .from("predictions")
      .select("match_id, points_earned")
      .eq("member_id", ana!.id);

    const md1Pred = preds!.find((p) => p.match_id === md1a!.id);
    const md2Pred = preds!.find((p) => p.match_id === md2!.id);

    // Left null, not zeroed: "outside your window" is a different fact from
    // "you scored nothing".
    expect(md1Pred!.points_earned).toBeNull();
    expect(md2Pred!.points_earned).toBe(5);

    const rows = await pointsFor(league.id);
    const roster = members.map((m) => ({ id: m.id, display_name: m.display_name }));
    const table = buildSeasonStandings({
      rows, roster, throughMatchday: 2, startMatchday: 2,
    });
    expect(table.find((r) => r.displayName === "Ana")!.totalPoints).toBe(5);
  });

  it("scores a fixture exactly once across repeated settles", async () => {
    const { season, fixtures } = await makeSeason();
    const { league, members } = await makeLeague(season.id, 1);
    const [ana] = members;
    const [md1a] = fixtures;

    await admin.from("predictions").insert({
      member_id: ana!.id, match_id: md1a!.id, home_score: 1, away_score: 0,
    });

    const first = await applyFixtureResult(admin, {
      matchId: md1a!.id, status: "finished", homeScore: 1, awayScore: 0,
    });
    const second = await applyFixtureResult(admin, {
      matchId: md1a!.id, status: "finished", homeScore: 1, awayScore: 0,
    });

    expect(first).toMatchObject({ newlyFinished: true, scored: 1 });
    expect(second).toMatchObject({ updated: false, newlyFinished: false, scored: 0 });

    const rows = await pointsFor(league.id);
    expect(rows.find((r) => r.matchday === 1)!.points).toBe(5);
  });
});
