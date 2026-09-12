// Matchday logic for season-shaped competitions (Premier League gameweeks,
// Champions League league-phase matchdays).
//
// Pure functions, no I/O — the World Cup taught us that the scoring and
// tournament helpers are the code worth testing exhaustively, and this is the
// same kind of logic: a handful of rules that decide what every returning user
// sees first.

/** One matchday of a season, summarised from its fixtures. */
export interface MatchdaySummary {
  matchday: number;
  fixtureCount: number;
  /** ISO kickoff of the earliest fixture — the matchday's deadline anchor. */
  firstKickoff: string;
  /** ISO kickoff of the latest fixture. */
  lastKickoff: string;
  finishedCount: number;
}

export interface MatchdayFixtureLike {
  matchday: number | null;
  kickoff_utc: string;
  status: string;
}

/**
 * Collapse a season's fixtures into per-matchday summaries, ascending.
 * Fixtures with no matchday (knockout ties, and every World Cup fixture) are
 * ignored — they are not part of the matchday rhythm.
 */
export function summariseMatchdays(
  fixtures: MatchdayFixtureLike[],
): MatchdaySummary[] {
  const byMatchday = new Map<number, MatchdaySummary>();

  for (const f of fixtures) {
    if (f.matchday == null) continue;
    const existing = byMatchday.get(f.matchday);
    if (!existing) {
      byMatchday.set(f.matchday, {
        matchday: f.matchday,
        fixtureCount: 1,
        firstKickoff: f.kickoff_utc,
        lastKickoff: f.kickoff_utc,
        finishedCount: f.status === "finished" ? 1 : 0,
      });
      continue;
    }
    existing.fixtureCount += 1;
    if (f.kickoff_utc < existing.firstKickoff) existing.firstKickoff = f.kickoff_utc;
    if (f.kickoff_utc > existing.lastKickoff) existing.lastKickoff = f.kickoff_utc;
    if (f.status === "finished") existing.finishedCount += 1;
  }

  return [...byMatchday.values()].sort((a, b) => a.matchday - b.matchday);
}

/**
 * The matchday a returning member should land on.
 *
 * The rule the whole weekly ritual rests on: the earliest matchday that is
 * still open to predict, never earlier than the league's own start. "Open"
 * means at least one fixture has not kicked off — deliberately more generous
 * than a single weekly cut-off, because per-match locking means a member who
 * missed Saturday can still predict Sunday.
 *
 * Falls back to the last matchday in the league's window once a season is
 * over, so a finished league opens on its final standings rather than on an
 * empty view. Returns null when the league's window contains no matchdays.
 */
export function pickDefaultMatchday(opts: {
  matchdays: MatchdaySummary[];
  startMatchday: number | null;
  now?: Date;
}): number | null {
  const now = (opts.now ?? new Date()).toISOString();
  const start = opts.startMatchday ?? 1;
  const inWindow = opts.matchdays.filter((m) => m.matchday >= start);
  if (inWindow.length === 0) return null;

  const open = inWindow.find((m) => m.lastKickoff > now);
  return (open ?? inWindow[inWindow.length - 1]!).matchday;
}

/**
 * Clamp a requested matchday (a `?md=` in the URL, which anyone can edit) to
 * one that actually exists in the season. Out-of-range or non-numeric input
 * falls back to the default rather than erroring.
 *
 * Matchdays BEFORE the league's start are intentionally still reachable: they
 * are real fixtures with real results, shown read-only and worth nothing, and
 * a member deserves to see what happened before they joined rather than a
 * wall.
 */
export function resolveMatchday(opts: {
  requested: string | number | null | undefined;
  matchdays: MatchdaySummary[];
  startMatchday: number | null;
  now?: Date;
}): number | null {
  const fallback = pickDefaultMatchday(opts);
  if (opts.requested == null || opts.requested === "") return fallback;

  const n = Number(opts.requested);
  if (!Number.isInteger(n)) return fallback;
  return opts.matchdays.some((m) => m.matchday === n) ? n : fallback;
}

export interface MatchdayState {
  /** Nothing in this matchday has kicked off yet. */
  upcoming: boolean;
  /** Started but not all finished. */
  inProgress: boolean;
  /** Every fixture finished. */
  complete: boolean;
  /** At least one fixture still predictable. */
  anyOpen: boolean;
  /** Before the league's scoring window opened — visible, but worth nothing. */
  beforeLeagueStart: boolean;
}

export function matchdayState(
  md: MatchdaySummary,
  startMatchday: number | null,
  now: Date = new Date(),
): MatchdayState {
  const iso = now.toISOString();
  const started = md.firstKickoff <= iso;
  const complete = md.finishedCount >= md.fixtureCount;
  return {
    upcoming: !started,
    inProgress: started && !complete,
    complete,
    anyOpen: md.lastKickoff > iso,
    beforeLeagueStart: startMatchday != null && md.matchday < startMatchday,
  };
}

/**
 * Human date range for a matchday header: "Sat 13 Sep" for a single day,
 * "Sat 13 – Sun 14 Sep" within a month, "Sat 30 Aug – Mon 1 Sep" across one.
 */
export function formatMatchdayRange(
  md: MatchdaySummary,
  locale?: string,
): string {
  const first = new Date(md.firstKickoff);
  const last = new Date(md.lastKickoff);
  const dayMonth = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  const dayOnly = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "short", day: "numeric" });

  const sameDay = first.toDateString() === last.toDateString();
  if (sameDay) return dayMonth(first);

  const sameMonth = first.getMonth() === last.getMonth();
  return sameMonth
    ? `${dayOnly(first)} – ${dayMonth(last)}`
    : `${dayMonth(first)} – ${dayMonth(last)}`;
}
