/**
 * Scoring logic. Pure, synchronous, no I/O — easily testable (CLAUDE.md).
 * MUST have 100% test coverage.
 *
 * Rules (defaults): exact score 5, correct goal difference 3, correct result 2.
 * The "correct goal difference" bonus only applies to non-draws: every draw has
 * a goal difference of 0, so predicting the wrong draw score (e.g. 1-1 for a 0-0)
 * earns the result points, not the goal-difference bonus.
 */

export interface Score {
  h: number;
  a: number;
}

export interface ScoringRules {
  exact: number;
  goal_diff: number;
  result: number;
}

export interface ScoreInput {
  predicted: Score;
  actual: Score;
  rules: ScoringRules;
}

export const DEFAULT_RULES: ScoringRules = {
  exact: 5,
  goal_diff: 3,
  result: 2,
};

export function scorePrediction({
  predicted,
  actual,
  rules,
}: ScoreInput): number {
  // Exact score.
  if (predicted.h === actual.h && predicted.a === actual.a) {
    return rules.exact;
  }

  const predictedDiff = predicted.h - predicted.a;
  const actualDiff = actual.h - actual.a;

  // Correct goal difference — non-draws only (excludes the 0-0 vs 1-1 case).
  if (predictedDiff === actualDiff && predictedDiff !== 0) {
    return rules.goal_diff;
  }

  // Correct result (W/D/L), including a draw predicted with the wrong score.
  if (Math.sign(predictedDiff) === Math.sign(actualDiff)) {
    return rules.result;
  }

  return 0;
}
