import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, scorePrediction, type Score } from "@/lib/scoring";

const score = (predicted: Score, actual: Score, rules = DEFAULT_RULES) =>
  scorePrediction({ predicted, actual, rules });

describe("scorePrediction", () => {
  // ---- exact (5) ----
  it("exact home win", () => {
    expect(score({ h: 2, a: 1 }, { h: 2, a: 1 })).toBe(5);
  });
  it("exact away win", () => {
    expect(score({ h: 0, a: 3 }, { h: 0, a: 3 })).toBe(5);
  });
  it("exact draw", () => {
    expect(score({ h: 1, a: 1 }, { h: 1, a: 1 })).toBe(5);
  });
  it("exact 0-0", () => {
    expect(score({ h: 0, a: 0 }, { h: 0, a: 0 })).toBe(5);
  });

  // ---- correct goal difference, non-draw (3) ----
  it("correct GD, home win, wrong score", () => {
    expect(score({ h: 2, a: 1 }, { h: 3, a: 2 })).toBe(3);
  });
  it("correct GD, away win, wrong score", () => {
    expect(score({ h: 1, a: 2 }, { h: 2, a: 3 })).toBe(3);
  });
  it("correct GD, bigger margin both sides", () => {
    expect(score({ h: 3, a: 1 }, { h: 4, a: 2 })).toBe(3);
  });

  // ---- correct result only (2) ----
  it("draw predicted with wrong score (0-0 vs 1-1) → result, not GD", () => {
    expect(score({ h: 1, a: 1 }, { h: 0, a: 0 })).toBe(2);
  });
  it("draw 2-2 vs 0-0 → result", () => {
    expect(score({ h: 2, a: 2 }, { h: 0, a: 0 })).toBe(2);
  });
  it("home win, different goal difference → result", () => {
    expect(score({ h: 1, a: 0 }, { h: 3, a: 0 })).toBe(2);
  });
  it("away win, different goal difference → result", () => {
    expect(score({ h: 0, a: 1 }, { h: 0, a: 3 })).toBe(2);
  });

  // ---- no points (0) ----
  it("predicted home win, actual away win", () => {
    expect(score({ h: 2, a: 0 }, { h: 0, a: 2 })).toBe(0);
  });
  it("predicted draw, actual home win", () => {
    expect(score({ h: 1, a: 1 }, { h: 2, a: 0 })).toBe(0);
  });
  it("predicted home win, actual draw", () => {
    expect(score({ h: 1, a: 0 }, { h: 1, a: 1 })).toBe(0);
  });
  it("predicted away win, actual draw", () => {
    expect(score({ h: 0, a: 1 }, { h: 2, a: 2 })).toBe(0);
  });

  // ---- custom rules ----
  it("respects custom rule values", () => {
    const rules = { exact: 10, goal_diff: 6, result: 3 };
    expect(score({ h: 2, a: 1 }, { h: 2, a: 1 }, rules)).toBe(10);
    expect(score({ h: 2, a: 1 }, { h: 3, a: 2 }, rules)).toBe(6);
    expect(score({ h: 1, a: 0 }, { h: 3, a: 0 }, rules)).toBe(3);
    expect(score({ h: 2, a: 0 }, { h: 0, a: 2 }, rules)).toBe(0);
  });
});
