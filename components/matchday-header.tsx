"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The gameweek header: which matchday, when it runs, how long until it locks,
 * how far through you are, and how to move between matchdays.
 *
 * This is the part optimised for the RETURNING user. The World Cup was a
 * one-time fill-in of 72 games; a league season is visited 38 times, so the
 * question this answers is "what do I need to do this week", not "what is this
 * tournament".
 */

function useCountdown(targetIso: string) {
  // Starts null and fills in after mount: a server-rendered countdown would be
  // stale the moment it arrived, and would differ from the client's clock.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return remaining;
}

function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function CompletionRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const complete = total > 0 && done >= total;

  return (
    <div className="relative shrink-0" title={`${done} of ${total} predicted`}>
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle
          cx="22" cy="22" r={radius} fill="none" strokeWidth="3"
          stroke="var(--surface-2)"
        />
        <circle
          cx="22" cy="22" r={radius} fill="none" strokeWidth="3"
          stroke={complete ? "var(--green)" : "var(--primary)"}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-foreground">
        {done}/{total}
      </span>
    </div>
  );
}

export interface MatchdayHeaderProps {
  leagueCode: string;
  /** "Gameweek" for a league season, "Matchday" for the UCL league phase. */
  unitLabel: string;
  matchday: number;
  totalMatchdays: number | null;
  dateRange: string;
  /** First kickoff of the matchday — the deadline the nudge anchors to. */
  deadlineIso: string;
  predicted: number;
  total: number;
  state: {
    upcoming: boolean;
    inProgress: boolean;
    complete: boolean;
    anyOpen: boolean;
    beforeLeagueStart: boolean;
  };
  prevMatchday: number | null;
  nextMatchday: number | null;
  /** The matchday the league's scoring window opens on. */
  startMatchday: number | null;
  /** Where "jump to current" goes; null when already there. */
  currentMatchday: number | null;
}

export function MatchdayHeader({
  leagueCode,
  unitLabel,
  matchday,
  totalMatchdays,
  dateRange,
  deadlineIso,
  predicted,
  total,
  state,
  prevMatchday,
  nextMatchday,
  startMatchday,
  currentMatchday,
}: MatchdayHeaderProps) {
  const remaining = useCountdown(deadlineIso);
  const href = (md: number) => `/league/${leagueCode}/predict?md=${md}`;

  const status = state.beforeLeagueStart
    ? { text: "Before your league started", color: "var(--text-muted)" }
    : state.complete
      ? { text: "Complete", color: "var(--text-muted)" }
      : state.inProgress
        ? { text: "In progress", color: "var(--accent-2)" }
        : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
              {unitLabel} {matchday}
            </h2>
            {totalMatchdays && (
              <span className="font-mono text-xs text-muted-foreground">
                of {totalMatchdays}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {dateRange}
          </p>
          {status && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-widest" style={{ color: status.color }}>
              {status.text}
            </p>
          )}
        </div>
        <CompletionRing done={predicted} total={total} />
      </div>

      {/* Deadline. Only meaningful while something is still predictable. */}
      {state.upcoming && !state.beforeLeagueStart && (
        <p className="mt-4 text-sm text-foreground">
          Locks in{" "}
          <span className="font-mono text-primary">
            {remaining == null
              ? "…"
              : remaining > 0
                ? formatRemaining(remaining)
                : "now"}
          </span>
          <span className="text-muted-foreground">
            {" "}
            — first kickoff{" "}
            {new Date(deadlineIso).toLocaleString(undefined, {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
      )}

      {/* Each fixture locks at its own kickoff, so a part-played matchday is
          still partly open. Worth saying plainly — it is more forgiving than
          the single weekly cut-off people expect from other games. */}
      {state.inProgress && state.anyOpen && !state.beforeLeagueStart && (
        <p className="mt-4 text-sm text-muted-foreground">
          Some games have kicked off. You can still predict the ones that
          haven&rsquo;t — each locks at its own kickoff.
        </p>
      )}

      {state.beforeLeagueStart && startMatchday != null && (
        <p className="mt-4 text-sm text-muted-foreground">
          Your league starts at {unitLabel.toLowerCase()} {startMatchday}. These
          results are here for context and score nothing.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <NavLink href={prevMatchday != null ? href(prevMatchday) : null}>
          ← {unitLabel} {prevMatchday ?? ""}
        </NavLink>
        {currentMatchday != null && currentMatchday !== matchday && (
          <Link
            href={href(currentMatchday)}
            className="font-mono text-[11px] uppercase tracking-widest text-primary underline-offset-4 hover:underline"
          >
            Jump to current
          </Link>
        )}
        <NavLink href={nextMatchday != null ? href(nextMatchday) : null} align="right">
          {unitLabel} {nextMatchday ?? ""} →
        </NavLink>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  align = "left",
}: {
  href: string | null;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const base = cn(
    "font-mono text-[11px] uppercase tracking-widest",
    align === "right" ? "text-right" : "text-left",
  );
  if (!href) {
    return <span className={cn(base, "text-muted-foreground/40")} aria-disabled>{children}</span>;
  }
  return (
    <Link href={href} className={cn(base, "text-foreground hover:text-primary")}>
      {children}
    </Link>
  );
}
