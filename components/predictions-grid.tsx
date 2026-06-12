"use client";

import { useMemo, useState } from "react";
import { PredictionRow } from "@/components/prediction-row";

export interface PredictMatch {
  id: string;
  matchCode: string;
  kickoffUtc: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeCode: string;
  awayCode: string;
  venue: string;
  venueCity: string;
  groupLetter: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  locked: boolean;
  prediction: {
    homeScore: number;
    awayScore: number;
    pointsEarned: number | null;
  } | null;
}

interface DayGroup {
  key: string;
  label: string;
  matches: PredictMatch[];
}

function groupByDay(matches: PredictMatch[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const match of matches) {
    const date = new Date(match.kickoffUtc);
    const key = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const label = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.matches.push(match);
    } else {
      groups.push({ key, label, matches: [match] });
    }
  }
  return groups;
}

export function PredictionsGrid({
  leagueCode,
  matches,
}: {
  leagueCode: string;
  matches: PredictMatch[];
}) {
  const [predictedIds, setPredictedIds] = useState<Set<string>>(
    () => new Set(matches.filter((m) => m.prediction).map((m) => m.id)),
  );

  const groups = useMemo(() => groupByDay(matches), [matches]);
  const total = matches.length;

  function handleSaved(matchId: string) {
    setPredictedIds((prev) => {
      if (prev.has(matchId)) return prev;
      const next = new Set(prev);
      next.add(matchId);
      return next;
    });
  }

  return (
    <div>
      {/* Progress pill */}
      <div className="sticky top-0 z-20 -mx-6 mb-4 border-b border-border bg-[rgba(10,11,13,0.92)] px-6 py-3 backdrop-blur">
        <span className="font-mono text-sm text-foreground">
          <span className="text-primary">{predictedIds.size}</span> of {total}{" "}
          predictions made
        </span>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="sticky top-[3.25rem] z-10 -mx-6 bg-background px-6 py-2 font-display text-lg uppercase tracking-widest text-muted-foreground">
              {group.label}
            </h2>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {group.matches.map((match) => (
                <PredictionRow
                  key={match.id}
                  leagueCode={leagueCode}
                  match={match}
                  onSaved={handleSaved}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
