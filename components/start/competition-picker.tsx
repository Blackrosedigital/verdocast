"use client";

import type { JoinableCompetition } from "@/lib/competitions";
import { cn } from "@/lib/utils";

/**
 * Choose the competition a new league predicts.
 *
 * The honest bit is the subtitle: it says which matchday the league will start
 * from and how many are left. Someone creating a Premier League league in
 * September is joining 4 gameweeks late, and finding that out afterwards is
 * worse than being told up front — especially when the alternative on the same
 * screen (the Champions League, one matchday in) is a much better deal today.
 */

function startsIn(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "starts today";
  if (days === 1) return "starts tomorrow";
  if (days < 14) return `starts in ${days} days`;
  return `starts in ${Math.round(days / 7)} weeks`;
}

export function CompetitionPicker({
  competitions,
  value,
  onChange,
}: {
  competitions: JoinableCompetition[];
  value: string | null;
  onChange: (slug: string) => void;
}) {
  if (competitions.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
        No competitions are open to join right now.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Competition" className="space-y-2">
      {competitions.map((c) => {
        const selected = c.competitionSlug === value;
        const unit = c.unitLabel.toLowerCase();
        const closed = c.startMatchday == null;
        const when = startsIn(c.startsAt);

        return (
          <button
            key={c.seasonId}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={closed}
            onClick={() => onChange(c.competitionSlug)}
            className={cn(
              "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-surface-2"
                : "border-border bg-surface hover:border-border-strong",
              closed && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {c.competitionName}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                {c.seasonLabel}
                {closed ? (
                  <> · season over</>
                ) : (
                  <>
                    {" · from "}
                    {unit} {c.startMatchday}
                    {c.totalMatchdays ? ` of ${c.totalMatchdays}` : ""}
                    {" · "}
                    {c.remainingMatchdays} to play
                  </>
                )}
              </span>
              {when && !closed && (
                <span className="mt-0.5 block font-mono text-[11px] text-primary">
                  {when}
                </span>
              )}
            </span>
            <span
              aria-hidden
              className={cn(
                "mt-1 size-4 shrink-0 rounded-full border",
                selected ? "border-primary bg-primary" : "border-border",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
