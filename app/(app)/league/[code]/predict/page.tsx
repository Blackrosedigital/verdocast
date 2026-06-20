import Link from "next/link";
import { notFound } from "next/navigation";
import { DisplayNameForm } from "@/components/display-name-form";
import { KnockoutCountdown } from "@/components/knockout-countdown";
import { PredictCoachMark } from "@/components/predict-coach-mark";
import {
  PredictionsGrid,
  type PredictMatch,
} from "@/components/predictions-grid";
import { ScoringLegend } from "@/components/scoring-legend";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getTeam } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Knockout stage badges (null = group stage, which uses the group pill instead).
const STAGE_LABEL: Record<string, string | null> = {
  group: null,
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  third: "3rd",
  final: "Final",
};

export default async function PredictPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser(`/league/${code}/predict`);
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("id, name, brand_color")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();
  const brandStyle = league.brand_color
    ? ({ "--primary": league.brand_color } as React.CSSProperties)
    : undefined;

  const { data: member } = await admin
    .from("members")
    .select("id, display_name")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!member) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl tracking-wide text-foreground">
          You&rsquo;re not in {league.name} yet
        </h1>
        <p className="text-muted-foreground">
          Join the league to make your predictions and climb the leaderboard.
        </p>
        <Button asChild className="mt-2">
          <Link href={`/league/${code}/join`}>Join {league.name}</Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground underline">
          Back to home
        </Link>
      </main>
    );
  }

  // Predictable matches (group stage, plus knockout fixtures once the bracket
  // resolves and both teams are known) + this member's predictions, in parallel.
  const [matchesRes, predsRes] = await Promise.all([
    admin
      .from("matches")
      .select(
        "id, match_code, kickoff_utc, home_team, away_team, venue, venue_city, group_letter, stage, status, home_score, away_score",
      )
      .not("home_team", "is", null)
      .not("away_team", "is", null)
      .order("kickoff_utc", { ascending: true }),
    admin
      .from("predictions")
      .select("match_id, home_score, away_score, points_earned")
      .eq("member_id", member.id),
  ]);

  const predByMatch = new Map(
    (predsRes.data ?? []).map((p) => [p.match_id, p]),
  );
  const now = Date.now();

  const matches: PredictMatch[] = (matchesRes.data ?? []).map((m) => {
    const pred = predByMatch.get(m.id);
    const home = getTeam(m.home_team);
    const away = getTeam(m.away_team);
    return {
      id: m.id,
      matchCode: m.match_code,
      kickoffUtc: m.kickoff_utc,
      homeTeam: m.home_team ?? "TBD",
      awayTeam: m.away_team ?? "TBD",
      homeFlag: home?.flag ?? "",
      awayFlag: away?.flag ?? "",
      homeCode: home?.code ?? "",
      awayCode: away?.code ?? "",
      venue: m.venue,
      venueCity: m.venue_city,
      groupLetter: m.group_letter,
      stageLabel: STAGE_LABEL[m.stage] ?? null,
      status: m.status,
      homeScore: m.home_score,
      awayScore: m.away_score,
      locked: new Date(m.kickoff_utc).getTime() <= now,
      prediction: pred
        ? {
            homeScore: pred.home_score,
            awayScore: pred.away_score,
            pointsEarned: pred.points_earned,
          }
        : null,
    };
  });

  const predictedCount = matches.filter((m) => m.prediction).length;
  const totalMatches = matches.length;
  const pct = totalMatches ? Math.round((predictedCount / totalMatches) * 100) : 0;
  const openCount = matches.filter((m) => !m.locked).length;
  const openUnpredicted = matches.filter(
    (m) => !m.locked && !m.prediction,
  ).length;
  const caughtUp = openCount > 0 && openUnpredicted === 0;
  const hasKnockouts = matches.some((m) => m.stageLabel != null);

  return (
    <main style={brandStyle} className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {league.name} ·{" "}
            <DisplayNameForm code={code} initialName={member.display_name ?? ""} />
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
            Your predictions
          </h1>
        </div>
        <div className="mt-2">
          <ShareButton
            text={`Join my World Cup 2026 prediction league "${league.name}" on Verdocast 🏆 Free to play:`}
            url={`${SITE_URL}/league/${code}/join`}
            label="Invite"
            variant="secondary"
          />
        </div>
      </div>
      <p className="mt-2 text-muted-foreground">
        Predict the score of every match. Each one locks at kickoff.
        {hasKnockouts &&
          " Knockout games are scored on the 90-minute result - extra time and penalties don't count."}
      </p>

      <div className="mt-5">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span>Your progress</span>
          <span>
            {predictedCount} / {totalMatches} predicted
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {predictedCount === 0 && (
        <div className="mt-5">
          <PredictCoachMark />
        </div>
      )}

      {caughtUp && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--green)" }}
          />
          <span className="text-foreground">
            You&rsquo;re all caught up
          </span>
          <span className="text-muted-foreground">
            — predictions in for every upcoming match.
          </span>
        </div>
      )}

      <div className="mt-6">
        <KnockoutCountdown audience="member" />
      </div>

      <ScoringLegend className="mt-6" />

      <div className="mt-8">
        <PredictionsGrid leagueCode={code} matches={matches} />
      </div>
    </main>
  );
}
