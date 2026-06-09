/**
 * Brand constants shared across marketing surfaces.
 * GROUP_COLORS are the 12 group accent colours from reference/wc2026.html,
 * used for decorative accents (e.g. the group-colour strip).
 */
export const GROUP_COLORS: Record<string, string> = {
  A: "#DC2626",
  B: "#EA580C",
  C: "#D97706",
  D: "#65A30D",
  E: "#059669",
  F: "#0891B2",
  G: "#2563EB",
  H: "#4F46E5",
  I: "#7C3AED",
  J: "#C026D3",
  K: "#DB2777",
  L: "#475569",
};

export const GROUP_COLOR_LIST: string[] = Object.values(GROUP_COLORS);

export const TOURNAMENT = {
  name: "FIFA World Cup 2026",
  startISO: "2026-06-11",
  endISO: "2026-07-19",
  startLabel: "11 June 2026",
} as const;
