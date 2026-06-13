import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupPill } from "@/components/group-pill";
import { LocalDate, LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import squadsData from "@/data/squads-2026.json";
import {
  getAllTeams,
  getMatchesByGroup,
  getTeam,
  getTeamBySlug,
} from "@/lib/tournament";

export const revalidate = 86400; // squad data is static; refresh daily

interface Player {
  name: string;
  pos: string | null;
  club: string | null;
}
interface Squad {
  status: string | null;
  confirmed: boolean;
  players: Player[];
}
const squads = squadsData as Record<string, Squad>;

const POSITION_ORDER = ["GK", "DF", "MF", "FW"] as const;
const POSITION_LABEL: Record<string, string> = {
  GK: "Goalkeepers",
  DF: "Defenders",
  MF: "Midfielders",
  FW: "Forwards",
};

export function generateStaticParams() {
  return getAllTeams().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) return { title: "Team not found | Verdocast" };
  return {
    title: `${team.name} at World Cup 2026 - Squad, Group & Fixtures | Verdocast`,
    description: `${team.name} World Cup 2026: full squad, coach ${team.coach ?? ""}, Group ${team.group_letter ?? ""} fixtures, and free score predictions on Verdocast.`,
    alternates: { canonical: `/world-cup-2026/team/${team.slug}` },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) notFound();

  const squad = squads[team.name];
  const players = squad?.players ?? [];
  const byPosition = POSITION_ORDER.map((pos) => ({
    pos,
    label: POSITION_LABEL[pos],
    players: players.filter((p) => p.pos === pos),
  })).filter((g) => g.players.length > 0);
  const other = players.filter(
    (p) => !p.pos || !POSITION_ORDER.includes(p.pos as (typeof POSITION_ORDER)[number]),
  );

  // Group fixtures featuring this team.
  const fixtures = team.group_letter
    ? getMatchesByGroup(team.group_letter).filter(
        (m) => m.home_team === team.name || m.away_team === team.name,
      )
    : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {team.group_letter && (
        <Link
          href={`/world-cup-2026/group/${team.group_letter.toLowerCase()}`}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Group {team.group_letter}
        </Link>
      )}

      <div className="mt-3 flex items-center gap-4">
        <span className="text-5xl leading-none">{team.flag ?? ""}</span>
        <h1 className="font-display text-5xl tracking-wide text-foreground">
          {team.name}
        </h1>
      </div>

      {/* Details */}
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {team.group_letter && (
          <div className="flex items-center gap-2">
            <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Group
            </dt>
            <dd>
              <GroupPill letter={team.group_letter} className="size-6 text-sm" />
            </dd>
          </div>
        )}
        {team.coach && (
          <div>
            <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Coach
            </dt>
            <dd className="mt-0.5 text-foreground">{team.coach}</dd>
          </div>
        )}
        {team.confederation && (
          <div>
            <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Confederation
            </dt>
            <dd className="mt-0.5 text-foreground">{team.confederation}</dd>
          </div>
        )}
        {team.route && (
          <div>
            <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Qualified
            </dt>
            <dd className="mt-0.5 text-foreground">{team.route}</dd>
          </div>
        )}
      </dl>

      {/* Fixtures */}
      {fixtures.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl tracking-wide text-foreground">
            Group {team.group_letter} fixtures
          </h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {fixtures.map((m) => {
              const opponentName =
                m.home_team === team.name ? m.away_team : m.home_team;
              const opponent = getTeam(opponentName);
              const home = m.home_team === team.name;
              return (
                <li
                  key={m.match_code}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                    <LocalDate iso={m.kickoff_utc} /> · <LocalTime iso={m.kickoff_utc} />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {home ? "vs" : "@"}
                  </span>
                  <span className="flex flex-1 items-center gap-2 text-foreground">
                    <span className="leading-none">{opponent?.flag ?? ""}</span>
                    {opponent ? (
                      <Link
                        href={`/world-cup-2026/team/${opponent.slug}`}
                        className="hover:text-primary"
                      >
                        {opponentName}
                      </Link>
                    ) : (
                      opponentName
                    )}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                    {m.venue_city}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Squad */}
      <div className="mt-10 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Squad
        </h2>
        {squad?.status && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {squad.status}
          </span>
        )}
      </div>

      {players.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Squad not yet announced. Check back closer to the tournament.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {byPosition.map((group) => (
            <div key={group.pos}>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {group.label}
              </h3>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {group.players.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="text-foreground">{p.name}</span>
                    {p.club && (
                      <span className="truncate text-right text-xs text-muted-foreground">
                        {p.club}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {other.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Squad
              </h3>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {other.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="text-foreground">{p.name}</span>
                    {p.club && (
                      <span className="truncate text-right text-xs text-muted-foreground">
                        {p.club}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Predict {team.name}&rsquo;s matches - free
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Forecast every group-stage score and climb the live leaderboard with
          your office or mates.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/start">Start a free league</Link>
        </Button>
      </div>
    </div>
  );
}
