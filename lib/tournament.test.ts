import { describe, expect, it } from "vitest";
import {
  getAllMatches,
  getMatchByCode,
  getMatchesByGroup,
  getMatchesByStage,
  type Stage,
} from "@/lib/tournament";

describe("getAllMatches", () => {
  it("returns all 104 tournament matches", () => {
    expect(getAllMatches()).toHaveLength(104);
  });

  it("every match has the required fields populated", () => {
    for (const m of getAllMatches()) {
      expect(m.match_code).toBeTruthy();
      expect(m.kickoff_utc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(m.venue).toBeTruthy();
      expect(m.venue_city).toBeTruthy();
    }
  });

  it("has unique match codes", () => {
    const codes = getAllMatches().map((m) => m.match_code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("getMatchesByStage", () => {
  const expectedCounts: Record<Stage, number> = {
    group: 72,
    r32: 16,
    r16: 8,
    qf: 4,
    sf: 2,
    third: 1,
    final: 1,
  };

  it.each(Object.entries(expectedCounts))(
    "returns %s matches for stage with the right count",
    (stage, count) => {
      const result = getMatchesByStage(stage as Stage);
      expect(result).toHaveLength(count);
      expect(result.every((m) => m.stage === stage)).toBe(true);
    },
  );

  it("knockout matches have null teams; group matches have both teams", () => {
    expect(getMatchesByStage("group").every((m) => m.home_team && m.away_team)).toBe(true);
    expect(
      getMatchesByStage("r32").every(
        (m) => m.home_team === null && m.away_team === null,
      ),
    ).toBe(true);
  });
});

describe("getMatchesByGroup", () => {
  it("returns 6 matches for a valid group", () => {
    const result = getMatchesByGroup("A");
    expect(result).toHaveLength(6);
    expect(result.every((m) => m.group_letter === "A")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(getMatchesByGroup("a")).toEqual(getMatchesByGroup("A"));
  });

  it("covers all 12 groups with 6 matches each (72 total)", () => {
    const letters = "ABCDEFGHIJKL".split("");
    const total = letters.reduce((n, l) => n + getMatchesByGroup(l).length, 0);
    expect(total).toBe(72);
  });

  it("returns an empty array for an unknown group", () => {
    expect(getMatchesByGroup("Z")).toEqual([]);
  });
});

describe("getMatchByCode", () => {
  it("finds a group match by code", () => {
    const match = getMatchByCode("GROUP_A_1");
    expect(match).toBeDefined();
    expect(match?.stage).toBe("group");
    expect(match?.group_letter).toBe("A");
  });

  it("finds the final", () => {
    const final = getMatchByCode("FINAL");
    expect(final).toBeDefined();
    expect(final?.stage).toBe("final");
  });

  it("returns undefined for an unknown code", () => {
    expect(getMatchByCode("NOPE")).toBeUndefined();
  });
});
