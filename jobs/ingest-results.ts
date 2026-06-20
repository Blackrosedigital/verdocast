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
  resolved: number; // knockout fixtures whose teams were filled in this run
}

function mapStatus(short: string): Enums<"match_status"> {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"].includes(short))
    return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "scheduled";
}

/**
 * Map API-Football's `league.round` to our knockout stage. Group rounds and
 * unknowns return null. Order matters: "Quarter-finals" / "Semi-finals" /
 * "3rd Place Final" all contain "final", so they're checked before plain Final.
 */
function stageFromRound(round: string): Enums<"match_stage"> | null {
  const r = round.toLowerCase();
  if (r.includes("round of 32")) return "r32";
  if (r.includes("round of 16")) return "r16";
  if (r.includes("quarter")) return "qf";
  if (r.includes("semi")) return "sf";
  if (r.includes("3rd place") || r.includes("third place")) return "third";
  if (r.includes("final")) return "final";
  return null;
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
  league: { round: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
  // Score at 90 minutes; we score knockout predictions on this (extra time /
  // penalties don't count). Equals `goals` for matches that don't go to ET.
  score: { fulltime: { home: number | null; away: number | null } };
}

interface Target {
  id: string;
  homeNorm: string | null;
}

export async function ingestResults(): Promise<IngestSummary> {
  const empty = {
    fixtures: 0,
    updated: 0,
    finished: 0,
    scored: 0,
    unmatched: 0,
    resolved: 0,
  };
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
    .select("id, kickoff_utc, home_team, away_team, external_id, stage");

  const byExternalId = new Map<string, Target>();
  const byDatePair = new Map<string, Target>();
  const byPair = new Map<string, Target>();
  // Canonical display name keyed by normalised name — used to translate API team
  // names (e.g. "Turkey") to our spelling (e.g. "Türkiye") when resolving the
  // knockout bracket.
  const canonicalByNorm = new Map<string, string>();
  for (const m of matches ?? []) {
    const homeNorm = m.home_team ? normalizeTeam(m.home_team) : null;
    const awayNorm = m.away_team ? normalizeTeam(m.away_team) : null;
    const target: Target = { id: m.id, homeNorm };
    if (m.external_id) byExternalId.set(m.external_id, target);
    if (m.home_team && homeNorm) canonicalByNorm.set(homeNorm, m.home_team);
    if (m.away_team && awayNorm) canonicalByNorm.set(awayNorm, m.away_team);
    if (homeNorm && awayNorm) {
      const pair = pairKey(homeNorm, awayNorm);
      byDatePair.set(`${m.kickoff_utc.slice(0, 10)}|${pair}`, target);
      byPair.set(pair, target);
    }
  }

  // ---- Resolve the knockout bracket -------------------------------------
  // Fill teams on our knockout rows (seeded with null teams) as the API fills in
  // each round. Idempotent: skips rows already pinned by external_id, and once a
  // row is resolved its external_id excludes it next run. Group rows are never
  // touched (they already have teams). Scoring of resolved fixtures happens on a
  // subsequent run via the external_id match below.
  let resolved = 0;
  const ourKoByStage = new Map<string, { id: string; kickoff: string }[]>();
  for (const m of matches ?? []) {
    if (m.stage !== "group" && !m.home_team && !m.external_id) {
      const arr = ourKoByStage.get(m.stage) ?? [];
      arr.push({ id: m.id, kickoff: m.kickoff_utc });
      ourKoByStage.set(m.stage, arr);
    }
  }
  if (ourKoByStage.size > 0) {
    const apiKoByStage = new Map<
      string,
      { extId: string; date: string; home: string; away: string }[]
    >();
    for (const fx of fixtures) {
      const stage = stageFromRound(fx.league.round);
      if (!stage) continue;
      const extId = String(fx.fixture.id);
      if (byExternalId.has(extId)) continue; // already pinned to a row
      const home = canonicalByNorm.get(normalizeTeam(fx.teams.home.name));
      const away = canonicalByNorm.get(normalizeTeam(fx.teams.away.name));
      if (!home || !away) continue; // teams not drawn / not recognised yet
      const arr = apiKoByStage.get(stage) ?? [];
      arr.push({ extId, date: fx.fixture.date, home, away });
      apiKoByStage.set(stage, arr);
    }
    for (const [stage, rows] of ourKoByStage) {
      const apiRows = (apiKoByStage.get(stage) ?? []).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const slots = rows.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
      const n = Math.min(slots.length, apiRows.length);
      for (let i = 0; i < n; i++) {
        const { error } = await admin
          .from("matches")
          .update({
            home_team: apiRows[i]!.home,
            away_team: apiRows[i]!.away,
            kickoff_utc: apiRows[i]!.date,
            external_id: apiRows[i]!.extId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", slots[i]!.id);
        if (!error) resolved += 1;
      }
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

    // Score on the 90-minute result: prefer score.fulltime for finished games
    // (extra time / penalties don't count); fall back to live goals otherwise.
    const status = mapStatus(fx.fixture.status.short);
    const ft = fx.score?.fulltime;
    const srcHome =
      status === "finished" && ft && ft.home != null ? ft.home : fx.goals.home;
    const srcAway =
      status === "finished" && ft && ft.away != null ? ft.away : fx.goals.away;

    // Orient to our home/away (the API's can differ from our seed).
    const swapped =
      target.homeNorm !== null && target.homeNorm !== apiHomeNorm;
    const homeScore = swapped ? srcAway : srcHome;
    const awayScore = swapped ? srcHome : srcAway;

    const outcome = await applyMatchResult(admin, {
      matchId: target.id,
      status,
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

  return {
    ok: true,
    fixtures: fixtures.length,
    updated,
    finished,
    scored,
    unmatched,
    resolved,
  };
}
