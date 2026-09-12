import { describe, expect, it } from "vitest";
import {
  buildMatchdayStandings,
  buildSeasonStandings,
  describeMovement,
  type MatchdayPointsRow,
  type RosterMember,
} from "@/lib/league-standings";

const ROSTER: RosterMember[] = [
  { id: "ana", display_name: "Ana" },
  { id: "ben", display_name: "Ben" },
  { id: "cal", display_name: "Cal" },
];

function row(
  member: string,
  matchday: number,
  points: number,
  extra: Partial<MatchdayPointsRow> = {},
): MatchdayPointsRow {
  const names: Record<string, string> = { ana: "Ana", ben: "Ben", cal: "Cal" };
  return {
    member_id: member,
    display_name: names[member] ?? member,
    matchday,
    points,
    scored: extra.scored ?? 1,
    exact_scores: extra.exact_scores ?? 0,
    predictions: extra.predictions ?? 1,
  };
}

describe("buildSeasonStandings", () => {
  it("accumulates points across matchdays and ranks them", () => {
    const rows = [
      row("ana", 1, 5), row("ben", 1, 3), row("cal", 1, 0),
      row("ana", 2, 2), row("ben", 2, 7), row("cal", 2, 4),
    ];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 2, startMatchday: 1,
    });

    expect(table.map((r) => [r.displayName, r.totalPoints])).toEqual([
      ["Ben", 10],
      ["Ana", 7],
      ["Cal", 4],
    ]);
    expect(table.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("reports movement against the previous matchday", () => {
    const rows = [
      row("ana", 1, 10), row("ben", 1, 3), row("cal", 1, 1),
      row("ana", 2, 0), row("ben", 2, 9), row("cal", 2, 2),
    ];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 2, startMatchday: 1,
    });

    // After MD1: Ana 10, Ben 3, Cal 1. After MD2: Ben 12, Ana 10, Cal 3.
    const ben = table.find((r) => r.displayName === "Ben")!;
    const ana = table.find((r) => r.displayName === "Ana")!;
    expect(ben).toMatchObject({ rank: 1, previousRank: 2, movement: 1 });
    expect(ana).toMatchObject({ rank: 2, previousRank: 1, movement: -1 });
    expect(table.find((r) => r.displayName === "Cal")!.movement).toBe(0);
  });

  it("has no movement on the league's first matchday", () => {
    const rows = [row("ana", 1, 5), row("ben", 1, 3)];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 1, startMatchday: 1,
    });
    for (const r of table) {
      expect(r.previousRank).toBeNull();
      expect(r.movement).toBeNull();
    }
  });

  // The mid-season mechanic: a league starting at MD5 must never bank points
  // from MD1-4, even if prediction rows somehow carry them.
  it("ignores matchdays before the league's start", () => {
    const rows = [
      row("ana", 1, 99), row("ana", 4, 99),
      row("ana", 5, 6), row("ben", 5, 4),
    ];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 5, startMatchday: 5,
    });
    expect(table.find((r) => r.displayName === "Ana")!.totalPoints).toBe(6);
    // MD4 is outside the window, so there is no previous table to move against.
    expect(table.find((r) => r.displayName === "Ana")!.movement).toBeNull();
  });

  it("includes roster members who have never predicted, on zero", () => {
    const table = buildSeasonStandings({
      rows: [row("ana", 1, 5)], roster: ROSTER, throughMatchday: 1, startMatchday: 1,
    });
    expect(table).toHaveLength(3);
    const cal = table.find((r) => r.displayName === "Cal")!;
    expect(cal).toMatchObject({ totalPoints: 0, matchdaysPlayed: 0, pointsPerMatchday: 0 });
  });

  it("shares a rank between tied members", () => {
    const rows = [row("ana", 1, 5), row("ben", 1, 5), row("cal", 1, 1)];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 1, startMatchday: 1,
    });
    expect(table.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("breaks ties on exact scores before falling back to name", () => {
    const rows = [
      row("ben", 1, 5, { exact_scores: 1 }),
      row("ana", 1, 5, { exact_scores: 0 }),
    ];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 1, startMatchday: 1,
    });
    expect(table[0]!.displayName).toBe("Ben");
    expect(table[0]!.rank).toBe(1);
    expect(table[1]!.displayName).toBe("Ana");
    expect(table[1]!.rank).toBe(2);
  });

  // The late-joiner normaliser: total points alone buries someone who has
  // played three matchdays against someone who has played ten.
  it("normalises by matchdays actually played", () => {
    const rows = [
      row("ana", 1, 4), row("ana", 2, 4), row("ana", 3, 4), // 12 over 3
      row("ben", 3, 9),                                      // 9 over 1
    ];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 3, startMatchday: 1,
    });
    const ana = table.find((r) => r.displayName === "Ana")!;
    const ben = table.find((r) => r.displayName === "Ben")!;

    expect(ana).toMatchObject({ totalPoints: 12, matchdaysPlayed: 3, pointsPerMatchday: 4 });
    expect(ben).toMatchObject({ totalPoints: 9, matchdaysPlayed: 1, pointsPerMatchday: 9 });
    // Ana leads the table, Ben leads per matchday. Both are true and shown.
    expect(ana.rank).toBeLessThan(ben.rank);
  });

  it("counts a matchday as played only once it has scored predictions", () => {
    // Predicted but not yet scored — the matchday hasn't been played out.
    const rows = [row("ana", 1, 0, { scored: 0, predictions: 10 })];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 1, startMatchday: 1,
    });
    expect(table.find((r) => r.displayName === "Ana")!.matchdaysPlayed).toBe(0);
  });

  it("carries the current matchday's points for a recap", () => {
    const rows = [row("ana", 1, 5), row("ana", 2, 8)];
    const table = buildSeasonStandings({
      rows, roster: ROSTER, throughMatchday: 2, startMatchday: 1,
    });
    expect(table.find((r) => r.displayName === "Ana")!.lastMatchdayPoints).toBe(8);
  });
});

describe("buildMatchdayStandings", () => {
  it("ranks a single matchday and names the winner", () => {
    const rows = [row("ana", 4, 3), row("ben", 4, 11), row("ana", 5, 99)];
    const table = buildMatchdayStandings({ rows, roster: ROSTER, matchday: 4 });

    expect(table[0]).toMatchObject({ displayName: "Ben", points: 11, isMatchdayWinner: true });
    expect(table[1]).toMatchObject({ displayName: "Ana", points: 3, isMatchdayWinner: false });
    // Cal didn't predict this matchday.
    expect(table[2]).toMatchObject({ displayName: "Cal", points: 0, predictions: 0 });
  });

  it("crowns joint winners when a matchday is tied", () => {
    const rows = [row("ana", 1, 7), row("ben", 1, 7), row("cal", 1, 2)];
    const table = buildMatchdayStandings({ rows, roster: ROSTER, matchday: 1 });
    expect(table.filter((r) => r.isMatchdayWinner).map((r) => r.displayName)).toEqual([
      "Ana",
      "Ben",
    ]);
  });

  // Before a matchday is scored everyone sits on zero; crowning the
  // alphabetically first player would be nonsense.
  it("names no winner when nobody has scored", () => {
    const table = buildMatchdayStandings({ rows: [], roster: ROSTER, matchday: 9 });
    expect(table.every((r) => r.points === 0)).toBe(true);
    expect(table.some((r) => r.isMatchdayWinner)).toBe(false);
  });
});

describe("describeMovement", () => {
  it("describes climbs, falls and no change", () => {
    expect(describeMovement(3)).toBe("up 3");
    expect(describeMovement(-1)).toBe("down 1");
    expect(describeMovement(0)).toBe("—");
    expect(describeMovement(null)).toBe("—");
  });
});
