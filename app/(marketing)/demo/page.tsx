import type { Metadata } from "next";
import Link from "next/link";
import {
  DemoPredictor,
  type DemoMatch,
} from "@/components/marketing/demo-predictor";
import { Button } from "@/components/ui/button";
import { getMatchesByStage, getTeam } from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Try the predictor - Verdocast demo",
  description:
    "Predict four real World Cup 2026 group matches and see how Verdocast scoring works. No signup.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  const matches: DemoMatch[] = getMatchesByStage("group")
    .slice(0, 4)
    .map((m) => ({
      matchCode: m.match_code,
      homeTeam: m.home_team ?? "TBD",
      awayTeam: m.away_team ?? "TBD",
      homeFlag: getTeam(m.home_team)?.flag ?? "",
      awayFlag: getTeam(m.away_team)?.flag ?? "",
      groupLetter: m.group_letter,
      venueCity: m.venue_city,
    }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Live demo · no signup
        </span>
        <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground sm:text-6xl">
          Try the predictor
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Predict four real World Cup 2026 group matches, then see how you&rsquo;d
          score. This is exactly what your employees get.
        </p>
      </div>

      <div className="mt-10">
        <DemoPredictor matches={matches} />
      </div>

      <div className="mt-10 text-center">
        <p className="mb-4 text-muted-foreground">
          Like it? Set your whole office up in five minutes.
        </p>
        <Button asChild size="lg">
          <Link href="/pricing">See pricing</Link>
        </Button>
      </div>
    </div>
  );
}
