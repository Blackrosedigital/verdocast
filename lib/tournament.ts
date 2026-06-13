import type { Enums } from "@/types/db";
import tournament from "@/data/tournament-2026.json";

/**
 * Pure tournament-data helpers. No I/O — the data is a static JSON import
 * generated from reference/wc2026.html (see scripts/extract-tournament.mjs).
 * CLAUDE.md requires 100% test coverage on this module.
 */

export type Stage = Enums<"match_stage">;

export interface TournamentMatch {
  match_code: string;
  kickoff_utc: string;
  stage: Stage;
  group_letter: string | null;
  home_team: string | null;
  away_team: string | null;
  venue: string;
  venue_city: string;
  /** Bracket placeholder for knockouts (e.g. "2A vs 2B"); null for group games. */
  matchup: string | null;
}

export interface TournamentTeam {
  name: string;
  slug: string;
  code: string | null;
  flag: string | null;
  confederation: string | null;
  route: string | null;
  coach: string | null;
  group_letter: string | null;
}

// The JSON shape is guaranteed by the generator's assertions and the seed's
// Zod validation; narrow `stage` from string to the Stage union here.
const matches = tournament.matches as TournamentMatch[];
const teams = tournament.teams as TournamentTeam[];
const teamByName = new Map(teams.map((t) => [t.name, t]));
const teamBySlug = new Map(teams.map((t) => [t.slug, t]));

/** All 104 matches in canonical order (group stage first, then knockouts). */
export function getAllMatches(): TournamentMatch[] {
  return matches;
}

/** Matches in a given stage, e.g. "group", "r32", "final". */
export function getMatchesByStage(stage: Stage): TournamentMatch[] {
  return matches.filter((m) => m.stage === stage);
}

/** Group-stage matches for a group letter (case-insensitive), e.g. "A". */
export function getMatchesByGroup(letter: string): TournamentMatch[] {
  const target = letter.toUpperCase();
  return matches.filter((m) => m.group_letter === target);
}

/** A single match by its unique code, e.g. "GROUP_A_1" or "FINAL". */
export function getMatchByCode(code: string): TournamentMatch | undefined {
  return matches.find((m) => m.match_code === code);
}

/** Team metadata (flag, code, group) by team name. Undefined for unknown/null. */
export function getTeam(
  name: string | null | undefined,
): TournamentTeam | undefined {
  if (!name) return undefined;
  return teamByName.get(name);
}

/** Team metadata by URL slug, e.g. "south-korea". Undefined for unknown/null. */
export function getTeamBySlug(
  slug: string | null | undefined,
): TournamentTeam | undefined {
  if (!slug) return undefined;
  return teamBySlug.get(slug);
}

/** All 48 teams in canonical group order. */
export function getAllTeams(): TournamentTeam[] {
  return teams;
}
