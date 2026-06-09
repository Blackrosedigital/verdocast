"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_RULES, scorePrediction } from "@/lib/scoring";

export interface DemoMatch {
  matchCode: string;
  homeTeam: string;
  awayTeam: string;
  venueCity: string;
}

// Fixed sample results so visitors can see how scoring works.
const SAMPLE_RESULTS = [
  { h: 2, a: 1 },
  { h: 0, a: 0 },
  { h: 3, a: 1 },
  { h: 1, a: 2 },
];

export function DemoPredictor({ matches }: { matches: DemoMatch[] }) {
  const [scores, setScores] = useState<Record<string, { h: string; a: string }>>(
    {},
  );
  const [revealed, setRevealed] = useState(false);

  function setScore(code: string, side: "h" | "a", value: string) {
    setScores((prev) => ({
      ...prev,
      [code]: { h: "", a: "", ...prev[code], [side]: value },
    }));
  }

  function pointsFor(index: number, code: string): number | null {
    const s = scores[code];
    if (!s) return null;
    const h = Number.parseInt(s.h, 10);
    const a = Number.parseInt(s.a, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) return null;
    const actual = SAMPLE_RESULTS[index]!;
    return scorePrediction({ predicted: { h, a }, actual, rules: DEFAULT_RULES });
  }

  const total = matches.reduce(
    (sum, m, i) => sum + (revealed ? (pointsFor(i, m.matchCode) ?? 0) : 0),
    0,
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="space-y-3">
        {matches.map((m, i) => {
          const pts = revealed ? pointsFor(i, m.matchCode) : null;
          const actual = SAMPLE_RESULTS[i]!;
          return (
            <div key={m.matchCode} className="flex items-center gap-3">
              <span className="flex-1 truncate text-right text-sm text-foreground">
                {m.homeTeam}
              </span>
              <Input
                type="number"
                min={0}
                max={20}
                aria-label={`${m.homeTeam} score`}
                value={scores[m.matchCode]?.h ?? ""}
                onChange={(e) => setScore(m.matchCode, "h", e.target.value)}
                className="h-10 w-12 text-center font-mono"
                disabled={revealed}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                max={20}
                aria-label={`${m.awayTeam} score`}
                value={scores[m.matchCode]?.a ?? ""}
                onChange={(e) => setScore(m.matchCode, "a", e.target.value)}
                className="h-10 w-12 text-center font-mono"
                disabled={revealed}
              />
              <span className="flex-1 truncate text-left text-sm text-foreground">
                {m.awayTeam}
              </span>
              <span className="w-28 text-right font-mono text-xs text-muted-foreground">
                {revealed
                  ? `result ${actual.h}–${actual.a} · ${pts ?? 0}pt`
                  : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {revealed ? (
          <p className="font-display text-2xl tracking-wide text-foreground">
            You scored <span className="text-primary">{total}</span> points
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Exact 5 · goal difference 3 · correct result 2
          </p>
        )}
        {revealed ? (
          <Button variant="secondary" onClick={() => setRevealed(false)}>
            Try again
          </Button>
        ) : (
          <Button onClick={() => setRevealed(true)}>See how you scored</Button>
        )}
      </div>
    </div>
  );
}
