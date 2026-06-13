/**
 * Group-stage standings. Pure, synchronous, no I/O — easily testable.
 *
 * Standings are derived from finished match results only. A match counts toward
 * the table once its `status` is "finished" and both scores are present; live and
 * upcoming matches are ignored so the table reflects settled results.
 *
 * Ranking follows the FIFA group-stage order used in v1: points, then goal
 * difference, then goals for, then alphabetical team name as a stable tiebreak.
 * (Head-to-head and the deeper FIFA tiebreakers are out of scope for v1.)
 */

export interface StandingsMatch {
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
}

export interface StandingsRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

function blankRow(team: string): StandingsRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
  };
}

function isFinished(m: StandingsMatch): boolean {
  return (
    m.status === "finished" &&
    m.home_team != null &&
    m.away_team != null &&
    m.home_score != null &&
    m.away_score != null
  );
}

/**
 * Compute a sorted standings table for one group.
 *
 * @param teams  The group's four team names — ensures every team appears even
 *               before any match is played.
 * @param matches All group matches (only finished ones contribute).
 */
export function computeStandings(
  teams: string[],
  matches: StandingsMatch[],
): StandingsRow[] {
  const table = new Map<string, StandingsRow>();
  for (const team of teams) table.set(team, blankRow(team));

  for (const m of matches) {
    if (!isFinished(m)) continue;
    const home = table.get(m.home_team as string);
    const away = table.get(m.away_team as string);
    if (!home || !away) continue; // match references a team outside this group

    const hs = m.home_score as number;
    const as = m.away_score as number;

    home.played++;
    away.played++;
    home.goals_for += hs;
    home.goals_against += as;
    away.goals_for += as;
    away.goals_against += hs;

    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += WIN_POINTS;
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += WIN_POINTS;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += DRAW_POINTS;
      away.points += DRAW_POINTS;
    }
  }

  const rows = [...table.values()];
  for (const r of rows) r.goal_difference = r.goals_for - r.goals_against;

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.team.localeCompare(b.team),
  );

  return rows;
}
