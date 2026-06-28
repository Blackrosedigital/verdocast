// Official FIFA 2026 knockout bracket structure, expressed in our match codes.
// Our codes are scheduled chronologically (R32_1..16), but the bracket tree pairs
// them non-sequentially. Derived from the official feeding map (Wikipedia: 2026
// FIFA World Cup knockout stage), mapped to our codes by venue. FIFA match number
// in the comment beside each next-round code.

/** Each knockout match (R16 onward) and the two matches whose winners feed it. */
export const KO_FEEDERS: Record<string, [string, string]> = {
  R16_2: ["R32_3", "R32_6"], // 89 = W74 v W77
  R16_1: ["R32_1", "R32_4"], // 90 = W73 v W75
  R16_3: ["R32_2", "R32_5"], // 91 = W76 v W78
  R16_4: ["R32_7", "R32_8"], // 92 = W79 v W80
  R16_5: ["R32_12", "R32_11"], // 93 = W83 v W84
  R16_6: ["R32_10", "R32_9"], // 94 = W81 v W82
  R16_7: ["R32_15", "R32_14"], // 95 = W86 v W88
  R16_8: ["R32_13", "R32_16"], // 96 = W85 v W87
  QF_1: ["R16_2", "R16_1"], // 97 = W89 v W90
  QF_2: ["R16_5", "R16_6"], // 98 = W93 v W94
  QF_3: ["R16_3", "R16_4"], // 99 = W91 v W92
  QF_4: ["R16_7", "R16_8"], // 100 = W95 v W96
  SF_1: ["QF_1", "QF_2"], // 101 = W97 v W98
  SF_2: ["QF_3", "QF_4"], // 102 = W99 v W100
  FINAL: ["SF_1", "SF_2"], // 104 = W101 v W102
};

/** Reverse map: the match a given tie's winner advances to. */
export const KO_FEEDS_INTO: Record<string, string> = Object.entries(
  KO_FEEDERS,
).reduce<Record<string, string>>((acc, [next, [a, b]]) => {
  acc[a] = next;
  acc[b] = next;
  return acc;
}, {});

/** Vertical bracket order, top to bottom, used by the bracket renderer. */
export const BRACKET_ORDER: string[] = [
  // Round of 32
  "R32_3", // 74
  "R32_6", // 77
  "R32_1", // 73
  "R32_4", // 75
  "R32_12", // 83
  "R32_11", // 84
  "R32_10", // 81
  "R32_9", // 82
  "R32_2", // 76
  "R32_5", // 78
  "R32_7", // 79
  "R32_8", // 80
  "R32_15", // 86
  "R32_14", // 88
  "R32_13", // 85
  "R32_16", // 87
  // Round of 16
  "R16_2", // 89
  "R16_1", // 90
  "R16_5", // 93
  "R16_6", // 94
  "R16_3", // 91
  "R16_4", // 92
  "R16_7", // 95
  "R16_8", // 96
  // Quarter-finals
  "QF_1", // 97
  "QF_2", // 98
  "QF_3", // 99
  "QF_4", // 100
  // Semi-finals
  "SF_1", // 101
  "SF_2", // 102
  // Final
  "FINAL", // 104
];

const ORDER_INDEX: Record<string, number> = Object.fromEntries(
  BRACKET_ORDER.map((code, i) => [code, i]),
);

/** Position of a tie in the vertical bracket order (unknown codes sort last). */
export function bracketOrderOf(code: string): number {
  return ORDER_INDEX[code] ?? 999;
}

/** Long stage label by stage key. */
export const KO_STAGE_LABEL: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  third: "Third-place play-off",
  final: "Final",
};
