import { DEFAULT_RULES } from "@/lib/scoring";

// Compact scoring explainer for in-app pages. Points come from lib/scoring.ts
// (DEFAULT_RULES), so this can never drift from the engine. No client JS — uses
// a native <details> disclosure.
const TIERS = [
  {
    points: DEFAULT_RULES.exact,
    label: "Exact score",
    desc: "the precise scoreline",
    color: "var(--gold)",
  },
  {
    points: DEFAULT_RULES.goal_diff,
    label: "Goal difference",
    desc: "right margin, wrong score (non-draws)",
    color: "var(--accent)",
  },
  {
    points: DEFAULT_RULES.result,
    label: "Correct result",
    desc: "right winner, or you called the draw",
    color: "var(--foreground)",
  },
  {
    points: 0,
    label: "Anything else",
    desc: "wrong result",
    color: "var(--muted-foreground)",
  },
];

export function ScoringLegend({ className = "" }: { className?: string }) {
  return (
    <details className={`group rounded-xl border border-border bg-surface ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        How points work
        <span className="group-open:hidden">Show</span>
        <span className="hidden group-open:inline">Hide</span>
      </summary>
      <ul className="space-y-2 border-t border-border px-4 py-3 text-sm">
        {TIERS.map((t) => (
          <li key={t.label} className="flex items-baseline gap-3">
            <span
              className="w-6 shrink-0 text-right font-display text-xl leading-none"
              style={{ color: t.color }}
            >
              {t.points}
            </span>
            <span className="text-foreground">{t.label}</span>
            <span className="text-muted-foreground">- {t.desc}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
