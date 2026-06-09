import { createAdminClient } from "@/lib/db";
import { applyMatchResult } from "@/lib/results";
import type { Enums } from "@/types/db";

/**
 * Polls API-Football for World Cup 2026 fixtures and updates our matches:
 * status, scores, and (on first transition to finished) prediction scoring.
 *
 * Matching: pin by external_id once known; otherwise match by UTC date + team
 * names (normalised, with a small alias map). Team-name matching should be
 * re-verified against live API data before the tournament.
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
}

function mapStatus(short: string): Enums<"match_status"> {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"].includes(short))
    return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "scheduled";
}

// API team name -> our canonical team name, for known spelling differences.
const NAME_ALIASES: Record<string, string> = {
  usa: "unitedstates",
  turkey: "turkiye",
  "ivorycoast": "ivorycoast",
  "cotedivoire": "ivorycoast",
  "republicofireland": "ireland",
  "korearepublic": "southkorea",
  "drcongo": "drcongo",
  "congodr": "drcongo",
};

function normalizeTeam(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return NAME_ALIASES[base] ?? base;
}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

export async function ingestResults(): Promise<IngestSummary> {
  const empty = { fixtures: 0, updated: 0, finished: 0, scored: 0 };
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

  const byExternalId = new Map<string, string>();
  const byDateTeams = new Map<string, string>();
  for (const m of matches ?? []) {
    if (m.external_id) byExternalId.set(m.external_id, m.id);
    if (m.home_team && m.away_team) {
      const date = m.kickoff_utc.slice(0, 10);
      const key = `${date}|${normalizeTeam(m.home_team)}|${normalizeTeam(m.away_team)}`;
      byDateTeams.set(key, m.id);
    }
  }

  let updated = 0;
  let finished = 0;
  let scored = 0;

  for (const fx of fixtures) {
    const extId = String(fx.fixture.id);
    let matchId = byExternalId.get(extId);
    if (!matchId) {
      const date = fx.fixture.date.slice(0, 10);
      const key = `${date}|${normalizeTeam(fx.teams.home.name)}|${normalizeTeam(fx.teams.away.name)}`;
      matchId = byDateTeams.get(key);
    }
    if (!matchId) continue;

    const outcome = await applyMatchResult(admin, {
      matchId,
      status: mapStatus(fx.fixture.status.short),
      homeScore: fx.goals.home,
      awayScore: fx.goals.away,
      externalId: extId,
    });
    if (outcome.updated) updated += 1;
    if (outcome.newlyFinished) {
      finished += 1;
      scored += outcome.scored;
    }
  }

  return { ok: true, fixtures: fixtures.length, updated, finished, scored };
}
