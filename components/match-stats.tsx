import type { StatRow } from "@/lib/api-football";

/** Parse "55%", "12", 7 -> a number, or null when not numeric. */
function toNumber(value: string | number | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function display(value: string | number | null): string {
  return value == null || value === "" ? "-" : String(value);
}

function StatBar({ row }: { row: StatRow }) {
  const h = toNumber(row.home);
  const a = toNumber(row.away);
  const total = (h ?? 0) + (a ?? 0);
  const hasBar = h != null && a != null && total > 0;
  const homePct = hasBar ? Math.round(((h as number) / total) * 100) : 50;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono font-semibold text-foreground">
          {display(row.home)}
        </span>
        <span className="text-xs text-muted-foreground">{row.type}</span>
        <span className="font-mono font-semibold text-foreground">
          {display(row.away)}
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-primary" style={{ width: `${homePct}%` }} />
        <div className="bg-border-strong" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

export function MatchStats({
  rows,
  homeTeam,
  awayTeam,
}: {
  rows: StatRow[];
  homeTeam: string | null;
  awayTeam: string | null;
}) {
  return (
    <section className="mt-6">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Match stats
      </h2>
      <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
        {(homeTeam || awayTeam) && (
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{homeTeam}</span>
            <span>{awayTeam}</span>
          </div>
        )}
        <div className="space-y-3">
          {rows.map((row) => (
            <StatBar key={row.type} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}
