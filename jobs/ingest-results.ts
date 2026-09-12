import { createAdminClient } from "@/lib/db";
import {
  mapProviderStatus,
  mapRound,
  ninetyMinuteScore,
} from "@/lib/provider-football";
import { applyFixtureResult } from "@/lib/results";

/**
 * Poll API-Football for every ACTIVE season and update our fixtures: status,
 * scores, kickoff changes, and — on a fixture's first transition to finished —
 * prediction scoring.
 *
 * Season-driven, not tournament-driven: adding a competition is a row in
 * `seasons`, not a code change. A season with `status = 'complete'` (the World
 * Cup) is never polled again.
 *
 * Fixtures are matched by `provider_fixture_id` alone. That is a deliberate
 * simplification over the World Cup version of this job, which had to match on
 * normalised team-name pairs and resolve the bracket by kickoff ordering —
 * necessary only because the WC was seeded from static JSON with no provider
 * ids. Everything seeded by scripts/seed-season.ts carries its provider id
 * from the start, so name matching, alias tables and ordering heuristics are
 * all gone.
 *
 * Fixtures the provider knows about but we don't are INSERTED when they belong
 * to a stage we track. That is how the Champions League knockout bracket
 * arrives: those ties don't exist until the January draw, and this job picks
 * them up on the next poll without anyone re-running the seeder.
 */

const API_BASE = "https://v3.football.api-sports.io";

export interface SeasonIngestSummary {
  competition: string;
  season: string;
  fixtures: number;
  updated: number;
  inserted: number;
  finished: number;
  scored: number;
  skipped: number;
}

export interface IngestSummary {
  ok: boolean;
  reason?: string;
  seasons: SeasonIngestSummary[];
  fixtures: number;
  updated: number;
  finished: number;
  scored: number;
  unmatched: number;
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue?: { name: string | null; city: string | null } | null;
  };
  league: { round: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } | null };
}

const EMPTY = { seasons: [], fixtures: 0, updated: 0, finished: 0, scored: 0, unmatched: 0 };

export async function ingestResults(): Promise<IngestSummary> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return { ok: false, reason: "API_FOOTBALL_KEY not set", ...EMPTY };

  const admin = createAdminClient();

  const { data: seasons } = await admin
    .from("seasons")
    .select(
      "id, label, provider_season_id, competitions!inner(name, provider_competition_id)",
    )
    .eq("status", "active");

  if (!seasons || seasons.length === 0) {
    return { ok: true, reason: "no active seasons", ...EMPTY };
  }

  const perSeason: SeasonIngestSummary[] = [];
  let unmatched = 0;

  for (const season of seasons) {
    // The embed is typed as an array by the client even though !inner on a
    // to-one relation yields a single row.
    const competition = Array.isArray(season.competitions)
      ? season.competitions[0]
      : season.competitions;
    const leagueId = competition?.provider_competition_id;
    const providerSeason = season.provider_season_id;
    const name = competition?.name ?? "unknown";

    if (!leagueId || !providerSeason) {
      perSeason.push({
        competition: name, season: season.label,
        fixtures: 0, updated: 0, inserted: 0, finished: 0, scored: 0, skipped: 0,
      });
      continue;
    }

    let apiFixtures: ApiFixture[];
    try {
      const res = await fetch(
        `${API_BASE}/fixtures?league=${leagueId}&season=${providerSeason}`,
        { headers: { "x-apisports-key": key }, cache: "no-store" },
      );
      const json = (await res.json()) as { response?: ApiFixture[] };
      apiFixtures = json.response ?? [];
    } catch {
      // One provider hiccup must not abandon the other active seasons.
      perSeason.push({
        competition: name, season: season.label,
        fixtures: 0, updated: 0, inserted: 0, finished: 0, scored: 0, skipped: 0,
      });
      continue;
    }

    const { data: ours } = await admin
      .from("fixtures")
      .select("id, provider_fixture_id, status")
      .eq("season_id", season.id);
    const byProviderId = new Map(
      (ours ?? [])
        .filter((f) => f.provider_fixture_id)
        .map((f) => [f.provider_fixture_id as string, f]),
    );

    // Team ids for this season, so a newly drawn knockout tie can be inserted
    // without another provider call.
    const { data: teamRows } = await admin
      .from("teams")
      .select("id, provider_team_id")
      .not("provider_team_id", "is", null);
    const teamByProviderId = new Map(
      (teamRows ?? []).map((t) => [t.provider_team_id as string, t.id]),
    );

    const summary: SeasonIngestSummary = {
      competition: name, season: season.label,
      fixtures: 0, updated: 0, inserted: 0, finished: 0, scored: 0, skipped: 0,
    };

    for (const fx of apiFixtures) {
      const mapped = mapRound(fx.league.round);
      if (!mapped) {
        summary.skipped += 1;
        continue;
      }
      summary.fixtures += 1;

      const providerId = String(fx.fixture.id);
      const status = mapProviderStatus(fx.fixture.status.short);
      const { home, away } = ninetyMinuteScore(fx, status);
      const existing = byProviderId.get(providerId);

      if (!existing) {
        // New to us — a knockout tie created by a draw, or a fixture added
        // after the season was seeded.
        const homeTeamId = teamByProviderId.get(String(fx.teams.home.id)) ?? null;
        const awayTeamId = teamByProviderId.get(String(fx.teams.away.id)) ?? null;
        const { error } = await admin.from("fixtures").insert({
          season_id: season.id,
          stage: mapped.stage,
          matchday: mapped.matchday,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          kickoff_utc: fx.fixture.date,
          venue: fx.fixture.venue?.name ?? null,
          venue_city: fx.fixture.venue?.city ?? null,
          status,
          home_score: home,
          away_score: away,
          provider_fixture_id: providerId,
        });
        if (error) unmatched += 1;
        else summary.inserted += 1;
        continue;
      }

      // A postponement moves the kickoff, which re-opens the prediction window
      // through the existing lockdown trigger. Written separately from the
      // result because applyFixtureResult deliberately owns only status/score.
      await admin
        .from("fixtures")
        .update({ kickoff_utc: fx.fixture.date })
        .eq("id", existing.id)
        .neq("kickoff_utc", fx.fixture.date);

      const outcome = await applyFixtureResult(admin, {
        matchId: existing.id,
        status,
        homeScore: home,
        awayScore: away,
        externalId: providerId,
      });
      if (outcome.updated) summary.updated += 1;
      if (outcome.newlyFinished) {
        summary.finished += 1;
        summary.scored += outcome.scored;
      }
    }

    perSeason.push(summary);
  }

  return {
    ok: true,
    seasons: perSeason,
    fixtures: perSeason.reduce((n, s) => n + s.fixtures, 0),
    updated: perSeason.reduce((n, s) => n + s.updated, 0),
    finished: perSeason.reduce((n, s) => n + s.finished, 0),
    scored: perSeason.reduce((n, s) => n + s.scored, 0),
    unmatched,
  };
}
