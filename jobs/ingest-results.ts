import { createAdminClient } from "@/lib/db";
import { applyMatchResult } from "@/lib/results";
import type { Enums } from "@/types/db";

/**
 * Polls API-Football for World Cup 2026 fixtures and updates our matches:
 * status, scores, and (on first transition to finished) prediction scoring.
 *
 * Matching is resilient: pin by external_id once known; otherwise match by the
 * unordered team pair (+ date when available). Scores are oriented to OUR
 * home/away (the API's home/away can differ from our seed) so a swapped fixture
 * never records reversed scores.
 */

const API_BASE = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = 1; // FIFA World Cup
const SEASON = 2026;

export interface IngestSummary {
  ok: boolean;
  reason?: string;
  fixtures: number;
  updated: number;
  finished: number;
  scored: number;
  unmatched: number;
}

function mapStatus(short: string): Enums<"match_status"> {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"].includes(short))
    return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "scheduled";
}

// API team name -> our canonical (normalised) team name, for spelling diffs.
const NAME_ALIASES: Record<string, string> = {
  usa: "unitedstates",
  turkey: "turkiye",
  cotedivoire: "ivorycoast",
  republicofireland: "ireland",
  korearepublic: "southkorea",
  congodr: "drcongo",
  czechrepublic: "czechia",
  bosniaherzegovina: "bosniaandherzegovina",
  capeverdeislands: "capeverde",
};

function normalizeTeam(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return NAME_ALIASES[base] ?? base;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("~");
}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

interface Target {
  id: string;
  homeNorm: string | null;
}

export async function ingestResults(): Promise<IngestSummary> {
  const empty = { fixtures: 0, updated: 0, finished: 0, scored: 0, unmatched: 0 };
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return { ok: false, reason: "API_FOOTBALL_KEY not set", ...empty };

  let fixtures: ApiFixture[];
  try {
    const res = await fetch(
      `${API_BASE}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`,
      { headers: { "x-apisports-key": key } },
    );
    const json = (await res.json()) as { response?: ApiFixture[] };
    fixtures = json.response ?? [];
  } catch {
    return { ok: false, reason: "fetch_failed", ...empty };
  }

  const admin = createAdminClient();
  const { data: matches } = await admin
    .from("matches")
    .select("id, kickoff_utc, home_team, away_team, external_id");

  const byExternalId = new Map<string, Target>();
  const byDatePair = new Map<string, Target>();
  const byPair = new Map<string, Target>();
  for (const m of matches ?? []) {
    const homeNorm = m.home_team ? normalizeTeam(m.home_team) : null;
    const awayNorm = m.away_team ? normalizeTeam(m.away_team) : null;
    const target: Target = { id: m.id, homeNorm };
    if (m.external_id) byExternalId.set(m.external_id, target);
    if (homeNorm && awayNorm) {
      const pair = pairKey(homeNorm, awayNorm);
      byDatePair.set(`${m.kickoff_utc.slice(0, 10)}|${pair}`, target);
      byPair.set(pair, target);
    }
  }

  let updated = 0;
  let finished = 0;
  let scored = 0;
  let unmatched = 0;

  for (const fx of fixtures) {
    const extId = String(fx.fixture.id);
    const apiHomeNorm = normalizeTeam(fx.teams.home.name);
    const apiAwayNorm = normalizeTeam(fx.teams.away.name);
    const pair = pairKey(apiHomeNorm, apiAwayNorm);

    const target =
      byExternalId.get(extId) ??
      byDatePair.get(`${fx.fixture.date.slice(0, 10)}|${pair}`) ??
      byPair.get(pair);
    if (!target) {
      unmatched += 1;
      continue;
    }

    // Orient API goals to our home/away.
    const swapped =
      target.homeNorm !== null && target.homeNorm !== apiHomeNorm;
    const homeScore = swapped ? fx.goals.away : fx.goals.home;
    const awayScore = swapped ? fx.goals.home : fx.goals.away;

    const outcome = await applyMatchResult(admin, {
      matchId: target.id,
      status: mapStatus(fx.fixture.status.short),
      homeScore,
      awayScore,
      externalId: extId,
    });
    if (outcome.updated) updated += 1;
    if (outcome.newlyFinished) {
      finished += 1;
      scored += outcome.scored;
    }
  }

  return { ok: true, fixtures: fixtures.length, updated, finished, scored, unmatched };
}
