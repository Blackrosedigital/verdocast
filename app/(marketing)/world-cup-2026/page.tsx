import type { Metadata } from "next";
import Link from "next/link";
import { GroupPill } from "@/components/group-pill";
import { Button } from "@/components/ui/button";
import { getMatchesByGroup, getTeam } from "@/lib/tournament";

interface GroupTeam {
  name: string;
  slug: string;
  flag: string;
}

export const metadata: Metadata = {
  title:
    "World Cup 2026 Predictor - Fixtures, Groups & Free Prediction League | Verdocast",
  description:
    "All 12 World Cup 2026 groups and group-stage fixtures. Run a free prediction league for your office, mates, or group - predict every score and climb the live leaderboard.",
  alternates: { canonical: "/world-cup-2026" },
};

const GROUPS = "ABCDEFGHIJKL".split("");

function teamsForGroup(letter: string): GroupTeam[] {
  const seen = new Set<string>();
  for (const m of getMatchesByGroup(letter)) {
    if (m.home_team) seen.add(m.home_team);
    if (m.away_team) seen.add(m.away_team);
  }
  return [...seen]
    .sort()
    .map((name) => {
      const t = getTeam(name);
      return { name, slug: t?.slug ?? "", flag: t?.flag ?? "" };
    });
}

export default function WorldCup2026Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        World Cup 2026 Predictor
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        The complete World Cup 2026 group-stage fixtures, by group. Turn the
        tournament into a free prediction league for your office, mates, or group
        chat: forecast every score, get points automatically, and follow a live
        leaderboard.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/start">Start a free league</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/play">Join the global league</Link>
        </Button>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <div
            key={g}
            className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <Link
              href={`/world-cup-2026/group/${g.toLowerCase()}`}
              className="flex items-center gap-3"
            >
              <GroupPill letter={g} />
              <span className="font-display text-2xl tracking-wide text-foreground">
                Group {g}
              </span>
            </Link>
            <ul className="mt-4 space-y-1.5">
              {teamsForGroup(g).map((t) => (
                <li key={t.name}>
                  <Link
                    href={`/world-cup-2026/team/${t.slug}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  >
                    <span className="leading-none">{t.flag}</span>
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Predict all 72 group matches - free
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Set up your league in two minutes and share one link. No card, no
          passwords.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/start">Start free</Link>
        </Button>
      </div>
    </div>
  );
}
