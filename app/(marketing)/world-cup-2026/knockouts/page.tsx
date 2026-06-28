import type { Metadata } from "next";
import Link from "next/link";
import { LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import { createPublicClient } from "@/lib/db";
import { getTeam } from "@/lib/tournament";

// Refresh every few minutes so the bracket fills in and scores update live.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "World Cup 2026 Knockout Bracket - Live Results & Fixtures | Verdocast",
  description:
    "The full World Cup 2026 knockout bracket - Round of 32 through the final, with live scores and kickoff times. Predict every knockout match free on Verdocast.",
  alternates: { canonical: "/world-cup-2026/knockouts" },
};

const STAGES = [
  { key: "r32", label: "Round of 32" },
  { key: "r16", label: "Round of 16" },
  { key: "qf", label: "Quarter-finals" },
  { key: "sf", label: "Semi-finals" },
  { key: "third", label: "Third place" },
  { key: "final", label: "Final" },
] as const;

interface KoMatch {
  match_code: string;
  stage: string;
  home_team: string | null;
  away_team: string | null;
  kickoff_utc: string;
  venue_city: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
}

async function getKnockoutMatches(): Promise<KoMatch[]> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from("matches")
      .select(
        "match_code, stage, home_team, away_team, kickoff_utc, venue_city, status, home_score, away_score",
      )
      .neq("stage", "group")
      .order("kickoff_utc", { ascending: true });
    return (data ?? []) as KoMatch[];
  } catch {
    return [];
  }
}

function TeamSide({
  name,
  align,
}: {
  name: string | null;
  align: "left" | "right";
}) {
  const team = name ? getTeam(name) : undefined;
  const flag = <span className="leading-none">{team?.flag ?? ""}</span>;
  const label = team?.slug ? (
    <Link
      href={`/world-cup-2026/team/${team.slug}`}
      className="truncate hover:text-primary"
    >
      {name}
    </Link>
  ) : (
    <span className="truncate text-muted-foreground">{name ?? "TBD"}</span>
  );
  return align === "left" ? (
    <span className="flex flex-1 items-center justify-end gap-2 truncate text-right text-foreground">
      {label}
      {flag}
    </span>
  ) : (
    <span className="flex flex-1 items-center gap-2 truncate text-left text-foreground">
      {flag}
      {label}
    </span>
  );
}

function FixtureCard({ m }: { m: KoMatch }) {
  const finished = m.status === "finished";
  const live = m.status === "live";
  const hasScore = m.home_score != null && m.away_score != null;
  return (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <TeamSide name={m.home_team} align="left" />
      <span className="w-16 shrink-0 text-center font-mono">
        {hasScore ? (
          <span
            className={finished ? "text-foreground" : "font-semibold"}
            style={finished ? undefined : { color: "var(--accent-2)" }}
          >
            {m.home_score}-{m.away_score}
          </span>
        ) : (
          <span className="text-muted-foreground">
            <LocalTime iso={m.kickoff_utc} />
          </span>
        )}
      </span>
      <TeamSide name={m.away_team} align="right" />
      <span className="hidden w-16 shrink-0 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
        {live ? "LIVE" : finished ? "FT" : (m.venue_city ?? "")}
      </span>
    </li>
  );
}

export default async function KnockoutsPage() {
  const matches = await getKnockoutMatches();
  const byStage = new Map<string, KoMatch[]>();
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
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
        the bracket fills in. Teams appear as each round is decided.
      </p>

      {matches.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center text-muted-foreground">
          The knockout bracket is set after the group stage. Check back soon.
        </p>
      ) : (
        <div className="mt-10 space-y-8">
          {STAGES.map((stage) => {
            const fixtures = byStage.get(stage.key);
            if (!fixtures || fixtures.length === 0) return null;
            return (
              <section key={stage.key}>
                <h2 className="font-display text-2xl tracking-wide text-foreground">
                  {stage.label}
                </h2>
                <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                  {fixtures.map((m) => (
                    <FixtureCard key={m.match_code} m={m} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
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
