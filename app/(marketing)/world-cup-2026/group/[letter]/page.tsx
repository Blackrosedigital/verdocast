import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupPill } from "@/components/group-pill";
import { Button } from "@/components/ui/button";
import { getMatchesByGroup, getTeam } from "@/lib/tournament";

const GROUPS = "abcdefghijkl".split("");

export function generateStaticParams() {
  return GROUPS.map((letter) => ({ letter }));
}

function teams(letter: string): string[] {
  const seen = new Set<string>();
  for (const m of getMatchesByGroup(letter)) {
    if (m.home_team) seen.add(m.home_team);
    if (m.away_team) seen.add(m.away_team);
  }
  return [...seen].sort();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const L = letter.toUpperCase();
  const list = teams(letter).join(", ");
  return {
    title: `World Cup 2026 Group ${L} - Teams, Fixtures & Predictions | Verdocast`,
    description: `World Cup 2026 Group ${L}: ${list}. See every fixture and predict the scores in a free Verdocast league.`,
    alternates: { canonical: `/world-cup-2026/group/${letter.toLowerCase()}` },
  };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  if (!GROUPS.includes(letter.toLowerCase())) notFound();
  const L = letter.toUpperCase();

  const matches = getMatchesByGroup(letter);
  const groupTeams = teams(letter);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/world-cup-2026"
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← All groups
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <GroupPill letter={L} className="size-9 text-lg sm:size-9 sm:text-lg" />
        <h1 className="font-display text-5xl tracking-wide text-foreground">
          World Cup 2026 Group {L}
        </h1>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {groupTeams.map((name) => (
          <span
            key={name}
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground"
          >
            <span className="leading-none">{getTeam(name)?.flag ?? ""}</span>
            {name}
          </span>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl tracking-wide text-foreground">
        Fixtures
      </h2>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {matches.map((m) => {
          const kickoff = new Date(m.kickoff_utc);
          return (
            <li key={m.match_code} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                {kickoff.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </span>
              <span className="flex flex-1 items-center justify-end gap-2 truncate text-right text-foreground">
                {m.home_team}
                <span className="leading-none">{getTeam(m.home_team)?.flag ?? ""}</span>
              </span>
              <span className="font-mono text-muted-foreground">v</span>
              <span className="flex flex-1 items-center gap-2 truncate text-left text-foreground">
                <span className="leading-none">{getTeam(m.away_team)?.flag ?? ""}</span>
                {m.away_team}
              </span>
              <span className="hidden w-28 shrink-0 text-right font-mono text-[11px] text-muted-foreground sm:block">
                {m.venue_city}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Predict Group {L} - free
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Forecast every score and climb the live leaderboard with your office or
          mates.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/start">Start a free league</Link>
        </Button>
      </div>
    </div>
  );
}
