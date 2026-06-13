import Link from "next/link";
import { notFound } from "next/navigation";
import { DisplayNameForm } from "@/components/display-name-form";
import {
  PredictionsGrid,
  type PredictMatch,
} from "@/components/predictions-grid";
import { ScoringLegend } from "@/components/scoring-legend";
import { ShareButton } from "@/components/share-button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getTeam } from "@/lib/tournament";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function PredictPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser();
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
          You&rsquo;re not in this league
        </h1>
        <p className="text-muted-foreground">
          Ask your league admin for an invitation to {league.name}.
        </p>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </main>
    );
  }

  // Group-stage matches + this member's predictions, in parallel.
  const [matchesRes, predsRes] = await Promise.all([
    admin
      .from("matches")
      .select(
        "id, match_code, kickoff_utc, home_team, away_team, venue, venue_city, group_letter, status, home_score, away_score",
      )
      .eq("stage", "group")
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
        Predict the score of every group-stage match. Each one locks at kickoff.
      </p>

      <ScoringLegend className="mt-6" />

      <div className="mt-8">
        <PredictionsGrid leagueCode={code} matches={matches} />
      </div>
    </main>
  );
}
