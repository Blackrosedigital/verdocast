import { describe, expect, it } from "vitest";
import {
  firstFullyOpenMatchday,
  formatMatchdayRange,
  matchdayState,
  pickDefaultMatchday,
  resolveMatchday,
  summariseMatchdays,
  type MatchdaySummary,
} from "@/lib/season";

function fx(matchday: number | null, kickoff: string, status = "scheduled") {
  return { matchday, kickoff_utc: kickoff, status };
}

// A three-matchday season: MD1 finished, MD2 part-played, MD3 upcoming.
const SEASON = [
  fx(1, "2026-09-08T16:45:00Z", "finished"),
  fx(1, "2026-09-08T19:00:00Z", "finished"),
  fx(2, "2026-10-13T16:45:00Z", "finished"),
  fx(2, "2026-10-14T19:00:00Z"),
  fx(3, "2026-11-03T19:00:00Z"),
];

describe("summariseMatchdays", () => {
  it("collapses fixtures into ascending matchday summaries", () => {
    const mds = summariseMatchdays(SEASON);
    expect(mds.map((m) => m.matchday)).toEqual([1, 2, 3]);
    expect(mds[0]).toMatchObject({
      matchday: 1,
      fixtureCount: 2,
      firstKickoff: "2026-09-08T16:45:00Z",
      lastKickoff: "2026-09-08T19:00:00Z",
      finishedCount: 2,
    });
    expect(mds[1]).toMatchObject({ fixtureCount: 2, finishedCount: 1 });
  });

  it("finds the earliest and latest kickoff regardless of input order", () => {
    const mds = summariseMatchdays([
      fx(4, "2026-10-14T19:00:00Z"),
      fx(4, "2026-10-13T16:45:00Z"),
      fx(4, "2026-10-14T16:45:00Z"),
    ]);
    expect(mds[0]!.firstKickoff).toBe("2026-10-13T16:45:00Z");
    expect(mds[0]!.lastKickoff).toBe("2026-10-14T19:00:00Z");
  });

  // Every World Cup fixture has a null matchday, as do knockout ties.
  it("ignores fixtures with no matchday", () => {
    expect(summariseMatchdays([fx(null, "2026-06-11T19:00:00Z", "finished")])).toEqual([]);
  });

  it("returns an empty list for no fixtures", () => {
    expect(summariseMatchdays([])).toEqual([]);
  });
});

describe("pickDefaultMatchday", () => {
  const matchdays = summariseMatchdays(SEASON);

  it("lands on the earliest matchday still open to predict", () => {
    // Mid-MD2: its Tuesday game is played, Wednesday's is not.
    const now = new Date("2026-10-14T09:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: 1, now })).toBe(2);
  });

  it("skips matchdays that are entirely played", () => {
    const now = new Date("2026-09-20T00:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: 1, now })).toBe(2);
  });

  // The mid-season rule: a league starting at MD2 never opens on MD1.
  it("never lands earlier than the league's start matchday", () => {
    const now = new Date("2026-09-01T00:00:00Z"); // MD1 still open
    expect(pickDefaultMatchday({ matchdays, startMatchday: 2, now })).toBe(2);
  });

  it("falls back to the final matchday once the season is over", () => {
    const now = new Date("2027-06-01T00:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: 1, now })).toBe(3);
  });

  it("returns null when no matchday falls inside the league's window", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: 99, now })).toBeNull();
    expect(pickDefaultMatchday({ matchdays: [], startMatchday: 1, now })).toBeNull();
  });

  it("treats a null start matchday as matchday 1", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: null, now })).toBe(1);
  });
});

describe("resolveMatchday", () => {
  const matchdays = summariseMatchdays(SEASON);
  const now = new Date("2026-10-14T09:00:00Z");
  const base = { matchdays, startMatchday: 2, now };

  it("honours a valid requested matchday", () => {
    expect(resolveMatchday({ ...base, requested: 3 })).toBe(3);
    expect(resolveMatchday({ ...base, requested: "3" })).toBe(3);
  });

  // ?md= comes from a URL anyone can edit.
  it("falls back to the default for junk or out-of-range input", () => {
    expect(resolveMatchday({ ...base, requested: "99" })).toBe(2);
    expect(resolveMatchday({ ...base, requested: "abc" })).toBe(2);
    expect(resolveMatchday({ ...base, requested: "1.5" })).toBe(2);
    expect(resolveMatchday({ ...base, requested: "" })).toBe(2);
    expect(resolveMatchday({ ...base, requested: null })).toBe(2);
  });

  // Read-only history before you joined beats a wall.
  it("allows navigating to a matchday before the league started", () => {
    expect(resolveMatchday({ ...base, requested: 1 })).toBe(1);
  });
});

describe("matchdayState", () => {
  const [md1, md2, md3] = summariseMatchdays(SEASON) as [
    MatchdaySummary,
    MatchdaySummary,
    MatchdaySummary,
  ];

  it("marks a fully played matchday complete", () => {
    const s = matchdayState(md1, 1, new Date("2026-10-01T00:00:00Z"));
    expect(s).toMatchObject({ complete: true, upcoming: false, anyOpen: false });
  });

  it("marks a part-played matchday in progress but still open", () => {
    const s = matchdayState(md2, 1, new Date("2026-10-14T09:00:00Z"));
    expect(s).toMatchObject({ inProgress: true, complete: false, anyOpen: true });
  });

  it("marks a future matchday upcoming", () => {
    const s = matchdayState(md3, 1, new Date("2026-10-20T00:00:00Z"));
    expect(s).toMatchObject({ upcoming: true, anyOpen: true, complete: false });
  });

  it("flags matchdays before the league's window", () => {
    const now = new Date("2026-10-14T09:00:00Z");
    expect(matchdayState(md1, 2, now).beforeLeagueStart).toBe(true);
    expect(matchdayState(md2, 2, now).beforeLeagueStart).toBe(false);
    expect(matchdayState(md1, null, now).beforeLeagueStart).toBe(false);
  });
});

// These assert the SHAPE of the range, not exact month spellings: Intl output
// shifts between ICU versions ("Sep" vs "Sept"), and pinning the literal makes
// the suite fail on a Node upgrade for no real reason.
describe("formatMatchdayRange", () => {
  const range = (first: string, last: string) =>
    formatMatchdayRange(
      { matchday: 1, fixtureCount: 2, firstKickoff: first, lastKickoff: last, finishedCount: 0 },
      "en-GB",
    );

  it("shows one date, with no range dash, for a single-day matchday", () => {
    const out = range("2026-09-12T14:00:00Z", "2026-09-12T19:00:00Z");
    expect(out).not.toContain("–");
    expect(out).toMatch(/^Sat 12 Sep/);
  });

  it("names the month once when a matchday sits inside one month", () => {
    const out = range("2026-10-13T16:45:00Z", "2026-10-14T19:00:00Z");
    expect(out).toContain("–");
    expect(out.match(/Oct/g)).toHaveLength(1);
    expect(out).toMatch(/^Tue 13 – Wed 14 Oct/);
  });

  it("names both months when a matchday straddles one", () => {
    const out = range("2026-08-30T14:00:00Z", "2026-09-01T19:00:00Z");
    expect(out).toContain("Aug");
    expect(out).toMatch(/Sep/);
    expect(out).toMatch(/^Sun 30 Aug – Tue 1 Sep/);
  });
});

describe("firstFullyOpenMatchday", () => {
  const matchdays = summariseMatchdays(SEASON);

  it("skips a matchday that has already started", () => {
    // Mid-MD2: its Tuesday game has kicked off, Wednesday's has not. A new
    // league should not open on "predict 1 of 2".
    const now = new Date("2026-10-14T09:00:00Z");
    expect(firstFullyOpenMatchday(matchdays, now)).toBe(3);
  });

  it("picks the next matchday when the previous one is done", () => {
    const now = new Date("2026-09-20T00:00:00Z");
    expect(firstFullyOpenMatchday(matchdays, now)).toBe(2);
  });

  it("picks the first matchday before a season starts", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    expect(firstFullyOpenMatchday(matchdays, now)).toBe(1);
  });

  it("returns null once every matchday has started", () => {
    const now = new Date("2027-06-01T00:00:00Z");
    expect(firstFullyOpenMatchday(matchdays, now)).toBeNull();
    expect(firstFullyOpenMatchday([], now)).toBeNull();
  });

  // The contrast that matters: a returning member lands mid-gameweek, a new
  // league does not start there.
  it("differs from the returning-member default mid-matchday", () => {
    const now = new Date("2026-10-14T09:00:00Z");
    expect(pickDefaultMatchday({ matchdays, startMatchday: 1, now })).toBe(2);
    expect(firstFullyOpenMatchday(matchdays, now)).toBe(3);
  });
});
