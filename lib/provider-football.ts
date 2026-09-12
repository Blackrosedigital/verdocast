// Translation layer for API-Football payloads.
//
// Shared by the season seeder (scripts/seed-season.ts) and the live ingestion
// job (jobs/ingest-results.ts) so the two can never disagree about what a
// round means. Pure functions only — no I/O, no database, trivially testable.

import type { Enums } from "@/types/db";

/** `fixtures.stage` values. Text rather than an enum: one column has to carry
 *  league seasons, the UCL Swiss league phase and knockout rounds alike. */
export type FixtureStage =
  | "regular"
  | "league_phase"
  | "group"
  | "playoff"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export interface MappedRound {
  stage: FixtureStage;
  /** Gameweek (PL 1..38) or league-phase matchday (UCL 1..8); null for knockouts. */
  matchday: number | null;
}

/**
 * Rounds played BEFORE the competition proper, which this product never
 * predicts: the UCL's July/August qualifying ladder, contested by clubs that
 * mostly don't reach the league phase.
 *
 * The `^play-?offs$` anchor is load-bearing. The provider labels the August
 * qualifying play-off exactly "Play-offs", while February's knockout play-off
 * arrives as "Knockout Round Play-offs". Matching loosely on "play-off" pulls
 * 14 qualifying fixtures into the season; anchoring keeps them out while
 * letting the February round through to `playoff` below.
 */
const QUALIFYING = /qualifying round|^play-?offs$/i;

/**
 * Provider round label -> our stage + matchday, or null when the fixture is
 * not part of this product's season.
 *
 *   "Regular Season - 7"        -> { stage: "regular",      matchday: 7 }
 *   "League Stage - 2"          -> { stage: "league_phase", matchday: 2 }
 *   "Knockout Round Play-offs"  -> { stage: "playoff",      matchday: null }
 *   "1st Qualifying Round"      -> null
 */
export function mapRound(round: string): MappedRound | null {
  const trimmed = round.trim();
  if (QUALIFYING.test(trimmed)) return null;

  const league = trimmed.match(/^(Regular Season|League Stage)\s*-\s*(\d+)$/i);
  if (league) {
    const matchday = Number(league[2]);
    if (!Number.isInteger(matchday) || matchday < 1) return null;
    return {
      stage: /regular season/i.test(league[1]!) ? "regular" : "league_phase",
      matchday,
    };
  }

  // Order matters: "Quarter-finals", "Semi-finals" and "3rd Place Final" all
  // contain "final", so they must be tested before the bare Final.
  const r = trimmed.toLowerCase();
  if (r.includes("knockout") && r.includes("play")) return { stage: "playoff", matchday: null };
  if (r.includes("group")) return { stage: "group", matchday: null };
  if (r.includes("round of 32")) return { stage: "r32", matchday: null };
  if (r.includes("round of 16")) return { stage: "r16", matchday: null };
  if (r.includes("quarter")) return { stage: "qf", matchday: null };
  if (r.includes("semi")) return { stage: "sf", matchday: null };
  if (r.includes("3rd place") || r.includes("third place")) return { stage: "third", matchday: null };
  if (r.includes("final")) return { stage: "final", matchday: null };
  return null;
}

/** Provider status short code -> our `match_status`. Unknown codes are
 *  treated as scheduled, which is the safe default: it keeps the prediction
 *  window governed by kickoff time rather than by a code we don't recognise. */
export function mapProviderStatus(short: string): Enums<"match_status"> {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"].includes(short)) return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "scheduled";
}

export interface ProviderScores {
  goals: { home: number | null; away: number | null };
  score?: { fulltime?: { home: number | null; away: number | null } | null } | null;
}

/**
 * The score predictions are settled on: the result after 90 minutes.
 *
 * Extra time and penalties never count — a knockout tie won on penalties is a
 * draw for prediction purposes. `goals` includes extra time, so a finished
 * fixture prefers `score.fulltime`; live fixtures have no fulltime yet and
 * fall back to `goals`.
 */
export function ninetyMinuteScore(
  fx: ProviderScores,
  status: Enums<"match_status">,
): { home: number | null; away: number | null } {
  const ft = fx.score?.fulltime;
  if (status === "finished" && ft && ft.home != null && ft.away != null) {
    return { home: ft.home, away: ft.away };
  }
  return { home: fx.goals.home, away: fx.goals.away };
}

/** 'H' | 'D' | 'A' for a settled fixture, else null. */
export function resultChar(
  home: number | null,
  away: number | null,
): "H" | "D" | "A" | null {
  if (home == null || away == null) return null;
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}
