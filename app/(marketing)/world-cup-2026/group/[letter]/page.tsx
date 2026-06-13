import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupPill } from "@/components/group-pill";
import { LocalDate, LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/db";
import { computeStandings, type StandingsMatch } from "@/lib/standings";
import { getMatchesByGroup, getTeam } from "@/lib/tournament";

// Re-render every 5 minutes so standings & scores follow the results cron.
export const revalidate = 300;

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

/** Live results for a group's matches, keyed by match_code. Empty on error. */
async function liveResults(
  letter: string,
): Promise<Map<string, { home: number | null; away: number | null; status: string | null }>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("matches")
      .select("match_code, home_score, away_score, status")
      .eq("stage", "group")
      .eq("group_letter", letter.toUpperCase());
    return new Map(
      (data ?? []).map((m) => [
        m.match_code,
        { home: m.home_score, away: m.away_score, status: m.status },
      ]),
    );
  } catch {
    return new Map();
  }
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
    title: `World Cup 2026 Group ${L} - Table, Fixtures & Predictions | Verdocast`,
    description: `World Cup 2026 Group ${L}: ${list}. Live group table, every fixture, squads, and free score predictions on Verdocast.`,
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
  const results = await liveResults(letter);

  // Merge static fixtures with live scores for the standings calculation.
  const standingsInput: StandingsMatch[] = matches.map((m) => {
    const r = results.get(m.match_code);
    return {
      home_team: m.home_team,
      away_team: m.away_team,
      home_score: r?.home ?? null,
      away_score: r?.away ?? null,
      status: r?.status ?? "scheduled",
    };
  });
  const standings = computeStandings(groupTeams, standingsInput);
  const anyPlayed = standings.some((r) => r.played > 0);

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

      {/* Standings table */}
      <h2 className="mt-10 font-display text-2xl tracking-wide text-foreground">
        Group table
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {anyPlayed
          ? "Updated automatically as results come in."
          : "Updates automatically once matches kick off."}
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-2 text-left font-mono text-[11px] font-normal uppercase tracking-widest">
                Team
              </th>
              {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
                <th
                  key={h}
                  className="w-9 px-1 py-2 text-center font-mono text-[11px] font-normal uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const team = getTeam(row.team);
              return (
                <tr
                  key={row.team}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/world-cup-2026/team/${team?.slug ?? ""}`}
                      className="flex items-center gap-2 text-foreground hover:text-primary"
                    >
                      <span className="w-4 font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="leading-none">{team?.flag ?? ""}</span>
                      <span className="truncate">{row.team}</span>
                    </Link>
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.played}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.won}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.drawn}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.lost}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.goals_for}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.goals_against}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono text-muted-foreground">
                    {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                  </td>
                  <td className="px-1 py-2.5 text-center font-mono font-semibold text-foreground">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tap a team for its squad and details. Top two of each group advance, plus
        the eight best third-placed teams.
      </p>

      {/* Fixtures */}
      <h2 className="mt-10 font-display text-2xl tracking-wide text-foreground">
        Fixtures
      </h2>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {matches.map((m) => {
          const r = results.get(m.match_code);
          const home = getTeam(m.home_team);
          const away = getTeam(m.away_team);
          const finished = r?.status === "finished";
          const live = r?.status === "live";
          const hasScore = r?.home != null && r?.away != null;
          return (
            <li key={m.match_code} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                <LocalDate iso={m.kickoff_utc} />
              </span>
              <span className="flex flex-1 items-center justify-end gap-2 truncate text-right text-foreground">
                <Link
                  href={`/world-cup-2026/team/${home?.slug ?? ""}`}
                  className="truncate hover:text-primary"
                >
                  {m.home_team}
                </Link>
                <span className="leading-none">{home?.flag ?? ""}</span>
              </span>
              <span className="w-14 shrink-0 text-center font-mono">
                {hasScore ? (
                  <span
                    className={finished ? "text-foreground" : "font-semibold"}
                    style={finished ? undefined : { color: "var(--accent-2)" }}
                  >
                    {r!.home}-{r!.away}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    <LocalTime iso={m.kickoff_utc} />
                  </span>
                )}
              </span>
              <span className="flex flex-1 items-center gap-2 truncate text-left text-foreground">
                <span className="leading-none">{away?.flag ?? ""}</span>
                <Link
                  href={`/world-cup-2026/team/${away?.slug ?? ""}`}
                  className="truncate hover:text-primary"
                >
                  {m.away_team}
                </Link>
              </span>
              <span className="hidden w-24 shrink-0 text-right font-mono text-[11px] text-muted-foreground sm:block">
                {live ? "LIVE" : m.venue_city}
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
