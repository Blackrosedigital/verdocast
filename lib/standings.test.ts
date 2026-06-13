import { describe, expect, it } from "vitest";
import {
  computeStandings,
  type StandingsMatch,
} from "@/lib/standings";

const TEAMS = ["Alpha", "Bravo", "Charlie", "Delta"];

function m(
  home: string,
  away: string,
  hs: number | null,
  as: number | null,
  status = "finished",
): StandingsMatch {
  return {
    home_team: home,
    away_team: away,
    home_score: hs,
    away_score: as,
    status,
  };
}

describe("computeStandings", () => {
  it("lists every team even with no matches played", () => {
    const rows = computeStandings(TEAMS, []);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it("awards 3 points for a win and 0 for a loss", () => {
    const rows = computeStandings(TEAMS, [m("Alpha", "Bravo", 2, 0)]);
    const alpha = rows.find((r) => r.team === "Alpha")!;
    const bravo = rows.find((r) => r.team === "Bravo")!;
    expect(alpha.points).toBe(3);
    expect(alpha.won).toBe(1);
    expect(alpha.goals_for).toBe(2);
    expect(alpha.goal_difference).toBe(2);
    expect(bravo.points).toBe(0);
    expect(bravo.lost).toBe(1);
    expect(bravo.goal_difference).toBe(-2);
  });

  it("awards 1 point each for a draw", () => {
    const rows = computeStandings(TEAMS, [m("Alpha", "Bravo", 1, 1)]);
    expect(rows.find((r) => r.team === "Alpha")!.points).toBe(1);
    expect(rows.find((r) => r.team === "Bravo")!.points).toBe(1);
    expect(rows.find((r) => r.team === "Alpha")!.drawn).toBe(1);
  });

  it("ignores matches that are not finished", () => {
    const rows = computeStandings(TEAMS, [
      m("Alpha", "Bravo", 2, 0, "live"),
      m("Charlie", "Delta", 1, 0, "scheduled"),
    ]);
    expect(rows.every((r) => r.played === 0)).toBe(true);
  });

  it("ignores finished matches missing a score", () => {
    const rows = computeStandings(TEAMS, [m("Alpha", "Bravo", null, 0)]);
    expect(rows.every((r) => r.played === 0)).toBe(true);
  });

  it("ignores matches referencing a team outside the group", () => {
    const rows = computeStandings(TEAMS, [m("Alpha", "Zeta", 3, 0)]);
    expect(rows.find((r) => r.team === "Alpha")!.played).toBe(0);
  });

  it("ranks by points, then goal difference, then goals for, then name", () => {
    const rows = computeStandings(TEAMS, [
      // Alpha & Bravo both 3 pts; Alpha better GD.
      m("Alpha", "Charlie", 3, 0),
      m("Bravo", "Delta", 1, 0),
      // Charlie & Delta both 0 pts; same GD (-?), goals-for tiebreak then name.
    ]);
    expect(rows.map((r) => r.team)).toEqual([
      "Alpha",
      "Bravo",
      "Delta",
      "Charlie",
    ]);
  });

  it("breaks an all-equal tie alphabetically by team name", () => {
    const rows = computeStandings(["Delta", "Charlie", "Bravo", "Alpha"], []);
    expect(rows.map((r) => r.team)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
    ]);
  });

  it("uses goals-for as a tiebreak when points and GD are equal", () => {
    const rows = computeStandings(["Alpha", "Bravo", "Charlie", "Delta"], [
      m("Alpha", "Charlie", 2, 0), // Alpha +2, 2 GF
      m("Bravo", "Delta", 3, 1), // Bravo +2, 3 GF
    ]);
    expect(rows[0]!.team).toBe("Bravo");
    expect(rows[1]!.team).toBe("Alpha");
  });

  it("accumulates across multiple matches", () => {
    const rows = computeStandings(TEAMS, [
      m("Alpha", "Bravo", 1, 0),
      m("Alpha", "Charlie", 2, 2),
      m("Delta", "Alpha", 0, 3),
    ]);
    const alpha = rows.find((r) => r.team === "Alpha")!;
    expect(alpha.played).toBe(3);
    expect(alpha.won).toBe(2);
    expect(alpha.drawn).toBe(1);
    expect(alpha.points).toBe(7);
    expect(alpha.goals_for).toBe(6);
    expect(alpha.goals_against).toBe(2);
  });
});
