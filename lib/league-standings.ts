/**
 * Season and per-matchday league standings.
 *
 * Pure, synchronous, no I/O — the ranking rules, position movement and the
 * mid-season normaliser all live here so they can be tested exhaustively,
 * the same way lib/scoring.ts is.
 *
 * Input is one row per (member, matchday) from the `matchday_points` view,
 * plus the league's member roster so people who have not predicted still
 * appear. Everything else is derived.
 */

/** One member's haul on one matchday (from the `matchday_points` view). */
export interface MatchdayPointsRow {
  member_id: string;
  display_name: string;
  matchday: number;
  points: number;
  scored: number;
  exact_scores: number;
  predictions: number;
}

export interface RosterMember {
  id: string;
  display_name: string;
}

export interface SeasonStandingRow {
  memberId: string;
  displayName: string;
  rank: number;
  /** Rank as of the previous matchday; null before there is a previous one. */
  previousRank: number | null;
  /** previousRank - rank: positive means climbed. Null when there's no history. */
  movement: number | null;
  totalPoints: number;
  exactScores: number;
  /** Matchdays this member has a scored prediction in — the normaliser's base. */
  matchdaysPlayed: number;
  /** Points per matchday played, to one decimal. 0 when they've played none. */
  pointsPerMatchday: number;
  /** Points on the matchday this table is current to. */
  lastMatchdayPoints: number;
}

export interface MatchdayStandingRow {
  memberId: string;
  displayName: string;
  rank: number;
  points: number;
  exactScores: number;
  predictions: number;
  /** Top of this matchday, ties included. */
  isMatchdayWinner: boolean;
}

/**
 * Rank by points descending, then exact scores, then display name.
 *
 * Name as the final tiebreak is deliberate: it is stable across reloads, which
 * matters more than being interesting. Equal scores share a rank (1, 1, 3) —
 * two people genuinely tied should see the same number, not an arbitrary
 * winner decided by row order.
 */
function assignRanks<T>(
  rows: T[],
  key: (row: T) => { points: number; exact: number; name: string },
): Map<T, number> {
  const sorted = [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (kb.points !== ka.points) return kb.points - ka.points;
    if (kb.exact !== ka.exact) return kb.exact - ka.exact;
    return ka.name.localeCompare(kb.name);
  });

  const ranks = new Map<T, number>();
  let rank = 0;
  let seen = 0;
  let prev: { points: number; exact: number } | null = null;

  for (const row of sorted) {
    const k = key(row);
    seen += 1;
    if (!prev || k.points !== prev.points || k.exact !== prev.exact) {
      rank = seen;
      prev = { points: k.points, exact: k.exact };
    }
    ranks.set(row, rank);
  }
  return ranks;
}

interface Totals {
  memberId: string;
  displayName: string;
  points: number;
  exact: number;
  matchdaysPlayed: number;
  lastMatchdayPoints: number;
}

/**
 * Cumulative totals for every member up to and including `throughMatchday`.
 *
 * Matchdays before `startMatchday` are excluded entirely: they are shown
 * read-only in the predict view and score nothing, which is the whole
 * mid-season mechanic. Scoring already refuses to write points for them, so
 * this is belt and braces — but a standings table is exactly where a bug like
 * that would become visible to a member as points they didn't earn.
 */
function accumulate(
  rows: MatchdayPointsRow[],
  roster: RosterMember[],
  throughMatchday: number,
  startMatchday: number | null,
): Totals[] {
  const start = startMatchday ?? Number.NEGATIVE_INFINITY;
  const byMember = new Map<string, Totals>(
    roster.map((m) => [
      m.id,
      {
        memberId: m.id,
        displayName: m.display_name,
        points: 0,
        exact: 0,
        matchdaysPlayed: 0,
        lastMatchdayPoints: 0,
      },
    ]),
  );

  for (const row of rows) {
    if (row.matchday > throughMatchday || row.matchday < start) continue;

    // A member with predictions but no roster entry shouldn't happen; if it
    // does, showing them beats dropping points on the floor silently.
    let totals = byMember.get(row.member_id);
    if (!totals) {
      totals = {
        memberId: row.member_id,
        displayName: row.display_name,
        points: 0,
        exact: 0,
        matchdaysPlayed: 0,
        lastMatchdayPoints: 0,
      };
      byMember.set(row.member_id, totals);
    }

    totals.points += row.points;
    totals.exact += row.exact_scores;
    if (row.scored > 0) totals.matchdaysPlayed += 1;
    if (row.matchday === throughMatchday) totals.lastMatchdayPoints = row.points;
  }

  return [...byMember.values()];
}

/**
 * The season table as of `throughMatchday`, with movement against the table as
 * it stood one matchday earlier.
 */
export function buildSeasonStandings(opts: {
  rows: MatchdayPointsRow[];
  roster: RosterMember[];
  throughMatchday: number;
  startMatchday: number | null;
}): SeasonStandingRow[] {
  const { rows, roster, throughMatchday, startMatchday } = opts;

  const current = accumulate(rows, roster, throughMatchday, startMatchday);
  const currentRanks = assignRanks(current, (t) => ({
    points: t.points,
    exact: t.exact,
    name: t.displayName,
  }));

  // Movement needs a previous matchday that is inside the league's window.
  const start = startMatchday ?? 1;
  const hasPrevious = throughMatchday - 1 >= start;
  const previousRanks = new Map<string, number>();
  if (hasPrevious) {
    const previous = accumulate(rows, roster, throughMatchday - 1, startMatchday);
    const ranks = assignRanks(previous, (t) => ({
      points: t.points,
      exact: t.exact,
      name: t.displayName,
    }));
    for (const [totals, rank] of ranks) previousRanks.set(totals.memberId, rank);
  }

  return current
    .map((t) => {
      const rank = currentRanks.get(t) ?? 0;
      const previousRank = hasPrevious ? (previousRanks.get(t.memberId) ?? null) : null;
      return {
        memberId: t.memberId,
        displayName: t.displayName,
        rank,
        previousRank,
        movement: previousRank == null ? null : previousRank - rank,
        totalPoints: t.points,
        exactScores: t.exact,
        matchdaysPlayed: t.matchdaysPlayed,
        pointsPerMatchday:
          t.matchdaysPlayed > 0
            ? Math.round((t.points / t.matchdaysPlayed) * 10) / 10
            : 0,
        lastMatchdayPoints: t.lastMatchdayPoints,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.displayName.localeCompare(b.displayName));
}

/** The table for a single matchday. Members who didn't predict show as zero. */
export function buildMatchdayStandings(opts: {
  rows: MatchdayPointsRow[];
  roster: RosterMember[];
  matchday: number;
}): MatchdayStandingRow[] {
  const { rows, roster, matchday } = opts;

  const byMember = new Map<string, MatchdayPointsRow>();
  for (const row of rows) {
    if (row.matchday === matchday) byMember.set(row.member_id, row);
  }

  const entries = roster.map((m) => {
    const row = byMember.get(m.id);
    return {
      memberId: m.id,
      displayName: m.display_name,
      points: row?.points ?? 0,
      exactScores: row?.exact_scores ?? 0,
      predictions: row?.predictions ?? 0,
    };
  });

  const ranks = assignRanks(entries, (e) => ({
    points: e.points,
    exact: e.exactScores,
    name: e.displayName,
  }));

  // Nobody "wins" a matchday on zero points — before it is scored, everyone is
  // on zero, and crowning the alphabetical first would be nonsense.
  const best = Math.max(0, ...entries.map((e) => e.points));

  return entries
    .map((e) => ({
      ...e,
      rank: ranks.get(e) ?? 0,
      isMatchdayWinner: best > 0 && e.points === best,
    }))
    .sort((a, b) => a.rank - b.rank || a.displayName.localeCompare(b.displayName));
}

/** "up 3" / "down 1" / "—". Presentation-adjacent but pure, so it's tested. */
export function describeMovement(movement: number | null): string {
  if (movement == null || movement === 0) return "—";
  return movement > 0 ? `up ${movement}` : `down ${Math.abs(movement)}`;
}
