import type { Metadata } from "next";
import Link from "next/link";
import {
  KnockoutBracket,
  type BracketMatch,
} from "@/components/knockout-bracket";
import { Button } from "@/components/ui/button";
import { createPublicClient } from "@/lib/db";

// Refresh every few minutes so the bracket fills in and scores update live.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "World Cup 2026 Knockout Bracket - Live Results & Fixtures | Verdocast",
  description:
    "The full World Cup 2026 knockout bracket - Round of 32 through the final, with live scores and kickoff times. Predict every knockout match free on Verdocast.",
  alternates: { canonical: "/world-cup-2026/knockouts" },
};

async function getKnockoutMatches(): Promise<BracketMatch[]> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from("matches")
      .select(
        "match_code, stage, home_team, away_team, kickoff_utc, status, home_score, away_score",
      )
      .neq("stage", "group")
      .order("kickoff_utc", { ascending: true });
    return (data ?? []) as BracketMatch[];
  } catch {
    return [];
  }
}

export default async function KnockoutsPage() {
  const matches = await getKnockoutMatches();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/world-cup-2026"
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← World Cup 2026
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        Knockout bracket
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        The road to the final - Round of 32 through the final, updating live as
        the bracket fills in. Scroll across to follow the rounds.
      </p>

      {matches.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center text-muted-foreground">
          The knockout bracket is set after the group stage. Check back soon.
        </p>
      ) : (
        <div className="mt-10">
          <KnockoutBracket matches={matches} />
        </div>
      )}

      <div className="mt-12 max-w-3xl rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Predict every knockout match - free
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Call the scores, climb a live leaderboard, settle who knows it best.
          Knockouts are scored on the 90-minute result.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/play">Join the global league</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/start">Start a free league</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
