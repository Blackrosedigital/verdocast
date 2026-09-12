"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  MatchdayStandingRow,
  SeasonStandingRow,
} from "@/lib/league-standings";
import { cn } from "@/lib/utils";

/**
 * The two leaderboard dimensions a season needs: where you stand overall, and
 * who won this matchday.
 *
 * Both matter for retention and they answer different questions. Season-to-date
 * is the long arc; "this matchday" is what makes a bad start survivable — you
 * can win a week without being anywhere near the top of the table.
 */

function MovementArrow({ movement }: { movement: number | null }) {
  if (movement == null) {
    return <span className="font-mono text-[10px] text-muted-foreground/40">—</span>;
  }
  if (movement === 0) {
    return (
      <span className="font-mono text-[10px] text-muted-foreground" title="No change">
        —
      </span>
    );
  }
  const up = movement > 0;
  return (
    <span
      className="font-mono text-[10px]"
      style={{ color: up ? "var(--green)" : "var(--accent-2)" }}
      title={up ? `Up ${movement}` : `Down ${Math.abs(movement)}`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(movement)}
    </span>
  );
}

function RankCell({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "w-7 shrink-0 text-right font-mono text-sm",
        rank === 1 ? "text-primary" : "text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

export interface SeasonStandingsProps {
  leagueCode: string;
  unitLabel: string;
  matchday: number;
  /** Scored matchdays, for the picker. */
  matchdays: number[];
  season: SeasonStandingRow[];
  thisMatchday: MatchdayStandingRow[];
  /** The viewer, highlighted in both tables. */
  meMemberId: string | null;
  /** Public leagues show points-per-matchday; office leagues share a start. */
  showNormaliser: boolean;
}

export function SeasonStandings({
  leagueCode,
  unitLabel,
  matchday,
  matchdays,
  season,
  thisMatchday,
  meMemberId,
  showNormaliser,
}: SeasonStandingsProps) {
  const [tab, setTab] = useState<"season" | "matchday">("season");
  const winners = thisMatchday.filter((r) => r.isMatchdayWinner);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Leaderboard view"
          className="inline-flex rounded-lg border border-border bg-surface p-0.5"
        >
          <TabButton selected={tab === "season"} onClick={() => setTab("season")}>
            Season
          </TabButton>
          <TabButton selected={tab === "matchday"} onClick={() => setTab("matchday")}>
            This {unitLabel.toLowerCase()}
          </TabButton>
        </div>

        {matchdays.length > 1 && (
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {unitLabel}
            <select
              value={matchday}
              onChange={(e) => {
                window.location.href = `/league/${leagueCode}/leaderboard?md=${e.target.value}`;
              }}
              className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-ring"
            >
              {[...matchdays].reverse().map((md) => (
                <option key={md} value={md}>
                  {md}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Matchday winner is worth calling out by name — it's the weekly prize
          that keeps someone mid-table coming back. */}
      {tab === "matchday" && winners.length > 0 && (
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {unitLabel} {matchday} winner
            {winners.length > 1 ? "s" : ""}
          </span>
          <br />
          <span className="text-foreground">
            {winners.map((w) => w.displayName).join(", ")}
          </span>
          <span className="text-muted-foreground"> — {winners[0]!.points} pts</span>
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {tab === "season" ? (
          <>
            <HeaderRow
              movement
              cols={[
                "Player",
                ...(showNormaliser ? ["Per " + unitLabel.toLowerCase()] : []),
                "Pts",
              ]}
            />
            <div className="divide-y divide-border">
              {season.map((row) => (
                <div
                  key={row.memberId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 sm:px-4",
                    row.memberId === meMemberId && "bg-surface-2",
                  )}
                >
                  <RankCell rank={row.rank} />
                  <span className="w-8 shrink-0">
                    <MovementArrow movement={row.movement} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {row.displayName}
                    {row.memberId === meMemberId && (
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                        you
                      </span>
                    )}
                  </span>
                  {showNormaliser && (
                    <span
                      className="w-20 shrink-0 text-right font-mono text-xs text-muted-foreground"
                      title={`${row.totalPoints} points over ${row.matchdaysPlayed} ${unitLabel.toLowerCase()}s played`}
                    >
                      {row.matchdaysPlayed > 0 ? row.pointsPerMatchday.toFixed(1) : "—"}
                    </span>
                  )}
                  <span className="w-12 shrink-0 text-right font-mono text-sm text-foreground">
                    {row.totalPoints}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <HeaderRow cols={["Player", "Picks", "Pts"]} />
            <div className="divide-y divide-border">
              {thisMatchday.map((row) => (
                <div
                  key={row.memberId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 sm:px-4",
                    row.memberId === meMemberId && "bg-surface-2",
                  )}
                >
                  <RankCell rank={row.rank} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {row.displayName}
                    {row.isMatchdayWinner && (
                      <span
                        className="ml-2 font-mono text-[10px]"
                        style={{ color: "var(--gold)" }}
                      >
                        winner
                      </span>
                    )}
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {row.predictions}
                  </span>
                  <span className="w-12 shrink-0 text-right font-mono text-sm text-foreground">
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showNormaliser && tab === "season" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Joined late? <span className="text-foreground">Per {unitLabel.toLowerCase()}</span>{" "}
          is your average, so you can be judged on form rather than on how long
          you&rsquo;ve been playing.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        <Link href={`/league/${leagueCode}/predict`} className="underline underline-offset-4">
          Make your predictions
        </Link>
      </p>
    </div>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
        selected
          ? "bg-surface-2 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function HeaderRow({ cols, movement = false }: { cols: string[]; movement?: boolean }) {
  const [player, ...rest] = cols;
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:px-4">
      <span className="w-7 shrink-0 text-right">#</span>
      {/* Matches the movement-arrow column in the season rows. */}
      {movement && <span className="w-8 shrink-0" aria-hidden />}
      <span className="min-w-0 flex-1">{player}</span>
      {rest.map((c, i) => (
        <span
          key={c}
          className={cn("shrink-0 text-right", i === rest.length - 1 ? "w-12" : "w-14 sm:w-20")}
        >
          {c}
        </span>
      ))}
    </div>
  );
}
