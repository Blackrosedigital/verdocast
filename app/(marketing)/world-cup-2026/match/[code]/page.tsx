import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KickoffLabel } from "@/components/kickoff-label";
import { Button } from "@/components/ui/button";
import { createPublicClient } from "@/lib/db";
import { BRACKET_ORDER, KO_FEEDERS, KO_FEEDS_INTO, KO_STAGE_LABEL } from "@/lib/knockout";
import { getMatchByCode, getTeam } from "@/lib/tournament";

export const revalidate = 300;

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

export function generateStaticParams() {
  return [...BRACKET_ORDER, "THIRD"].map((code) => ({
    code: code.toLowerCase(),
  }));
}

async function getKnockouts(): Promise<Map<string, KoMatch>> {
  const map = new Map<string, KoMatch>();
  try {
    const db = createPublicClient();
    const { data } = await db
      .from("matches")
      .select(
        "match_code, stage, home_team, away_team, kickoff_utc, venue_city, status, home_score, away_score",
      )
      .neq("stage", "group");
    for (const m of (data ?? []) as KoMatch[]) map.set(m.match_code, m);
  } catch {
    // fall through to empty map
  }
  return map;
}

/** "South Africa v Canada", or for an unresolved feeder, "Winner of …". */
function tieLabel(code: string | undefined, map: Map<string, KoMatch>): string {
  if (!code) return "TBD";
  const m = map.get(code);
  if (m?.home_team && m?.away_team) return `${m.home_team} v ${m.away_team}`;
  const stat = getMatchByCode(code);
  if (stat?.matchup) return stat.matchup;
  return "TBD";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const map = await getKnockouts();
  const m = map.get(code);
  const stage = KO_STAGE_LABEL[m?.stage ?? ""] ?? "Knockout match";
  const tie =
    m?.home_team && m?.away_team
      ? `${m.home_team} vs ${m.away_team}`
      : `${stage}`;
  return {
    title: `${tie} - World Cup 2026 ${stage} | Verdocast`,
    description: `${tie} in the World Cup 2026 ${stage}. Kickoff time, venue, live score and the route to the final. Predict it free on Verdocast.`,
    alternates: { canonical: `/world-cup-2026/match/${raw.toLowerCase()}` },
  };
}

function TeamBlock({ name }: { name: string | null }) {
  const team = name ? getTeam(name) : undefined;
  if (!name) {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-2 text-3xl text-muted-foreground">
          ?
        </div>
        <span className="text-lg font-semibold text-muted-foreground">TBD</span>
      </div>
    );
  }
  const inner = (
    <>
      <span className="text-5xl leading-none sm:text-6xl">
        {team?.flag ?? "🏳️"}
      </span>
      <span className="text-lg font-semibold text-foreground sm:text-xl">
        {name}
      </span>
    </>
  );
  return team?.slug ? (
    <Link
      href={`/world-cup-2026/team/${team.slug}`}
      className="flex flex-1 flex-col items-center gap-3 text-center transition-opacity hover:opacity-80"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      {inner}
    </div>
  );
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const map = await getKnockouts();
  const m = map.get(code);
  if (!m) notFound();

  const stageLabel = KO_STAGE_LABEL[m.stage] ?? "Knockout match";
  const live = m.status === "live";
  const finished = m.status === "finished";
  const hasScore = m.home_score != null && m.away_score != null;
  const feeders = KO_FEEDERS[code];
  const nextCode = KO_FEEDS_INTO[code];
  const next = nextCode ? map.get(nextCode) : undefined;
  const nextStage = next ? KO_STAGE_LABEL[next.stage] : undefined;
  const isFinal = code === "FINAL";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/world-cup-2026/knockouts"
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Knockout bracket
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-widest text-gold">
        {stageLabel}
      </p>

      {/* Hero matchup */}
      <div className="mt-4 rounded-3xl border border-border bg-surface p-8">
        <div className="flex items-center justify-between gap-4">
          <TeamBlock name={m.home_team} />
          <div className="flex flex-col items-center">
            {live && (
              <span className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--accent-2)]">
                Live
              </span>
            )}
            {hasScore ? (
              <span className="font-mono text-4xl font-bold text-foreground sm:text-5xl">
                {m.home_score}
                <span className="mx-2 text-muted-foreground">-</span>
                {m.away_score}
              </span>
            ) : (
              <span className="font-display text-3xl tracking-wide text-muted-foreground">
                vs
              </span>
            )}
            {finished && (
              <span className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Full time
              </span>
            )}
          </div>
          <TeamBlock name={m.away_team} />
        </div>

        {/* Feeder context for unresolved ties */}
        {feeders && (!m.home_team || !m.away_team) && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Winner of <strong>{tieLabel(feeders[0], map)}</strong> vs winner of{" "}
            <strong>{tieLabel(feeders[1], map)}</strong>
          </p>
        )}
      </div>

      {/* Facts */}
      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        <div className="bg-surface p-4">
          <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Kickoff
          </dt>
          <dd className="mt-1 text-foreground">
            <KickoffLabel iso={m.kickoff_utc} full />
          </dd>
        </div>
        <div className="bg-surface p-4">
          <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Venue
          </dt>
          <dd className="mt-1 text-foreground">{m.venue_city ?? "TBC"}</dd>
        </div>
      </dl>

      {/* Route to the final */}
      {next && nextStage && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Route to the final
          </p>
          <p className="mt-2 text-foreground">
            {isFinal
              ? "This is the final - the last match of the tournament."
              : `The winner advances to the ${nextStage}.`}
          </p>
          {!isFinal && nextCode && (
            <Link
              href={`/world-cup-2026/match/${nextCode.toLowerCase()}`}
              className="mt-1 inline-block text-sm text-primary underline"
            >
              See the {nextStage} tie →
            </Link>
          )}
        </div>
      )}

      {/* Line-ups & stats (follow-up) */}
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Line-ups & match stats
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirmed line-ups and in-match stats appear here around kickoff, once
          the teams are announced.
        </p>
      </div>

      {/* Predict CTA */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/play">Predict this match - free</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/world-cup-2026/knockouts">Back to bracket</Link>
        </Button>
      </div>
    </div>
  );
}
