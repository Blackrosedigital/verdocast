import Link from "next/link";
import { notFound } from "next/navigation";
import { DisplayNameForm } from "@/components/display-name-form";
import { KnockoutCountdown } from "@/components/knockout-countdown";
import { Leaderboard } from "@/components/leaderboard";
import { SeasonStandings } from "@/components/season-standings";
import { ScoringLegend } from "@/components/scoring-legend";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getLeaderboard, getSeasonLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ md?: string }>;
}) {
  const { code } = await params;
  const { md } = await searchParams;
  const user = await requireUser(`/league/${code}/leaderboard`);

  const admin = createAdminClient();
  // select * so the page keeps working before the prize columns migration runs.
  const { data: league } = await admin
    .from("leagues")
    .select("*")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();
  const brandStyle = league.brand_color
    ? ({ "--primary": league.brand_color } as React.CSSProperties)
    : undefined;

  const result = await getLeaderboard(code);
  if (!result.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl tracking-wide text-foreground">
          You&rsquo;re not in {league.name} yet
        </h1>
        <p className="text-muted-foreground">
          Join the league to see the leaderboard and make your predictions.
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

  // Find the viewer's rank for a Wordle-style share line.
  const { data: me } = await admin
    .from("members")
    .select("id, display_name")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();
  const rows = result.data.rows;
  const myIndex = me ? rows.findIndex((r) => r.member_id === me.id) : -1;
  const total = rows.length;

  // A league bound to a season with matchdays gets the two-dimension table:
  // season-to-date plus this matchday. World Cup leagues keep the flat
  // all-time leaderboard below.
  const seasonResult = await getSeasonLeaderboard(
    code,
    md ? Number(md) : null,
  );
  const seasonData = seasonResult.ok ? seasonResult.data : null;

  if (seasonData) {
    // The per-matchday average earns its column only when members have
    // genuinely played different amounts — a late joiner, not someone who
    // missed one week. A spread of one is noise; two or more is a real gap.
    const played = seasonData.season.map((r) => r.matchdaysPlayed);
    const spread = played.length ? Math.max(...played) - Math.min(...played) : 0;

    return (
      <main style={brandStyle} className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {league.name}
            </p>
            <h1 className="mt-2 truncate font-display text-4xl tracking-wide text-foreground sm:text-5xl">
              {seasonData.competitionName}
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {seasonData.seasonLabel}
              {seasonData.startMatchday != null && (
                <>
                  {" · from "}
                  {seasonData.unitLabel.toLowerCase()} {seasonData.startMatchday}
                </>
              )}
            </p>
          </div>
          <div className="mt-2 shrink-0">
            <ShareButton
              text={`Join my ${seasonData.competitionName} prediction league "${league.name}" on Verdocast ⚽ Free to play:`}
              url={`${SITE_URL}/league/${code}/join`}
              label="Share / Invite"
            />
          </div>
        </div>

        {me && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            You&rsquo;re playing as{" "}
            <DisplayNameForm code={code} initialName={me.display_name ?? ""} />
          </p>
        )}

        <div className="mt-6">
          {seasonData.scored ? (
            <SeasonStandings
              leagueCode={code}
              unitLabel={seasonData.unitLabel}
              matchday={seasonData.matchday}
              matchdays={seasonData.matchdays}
              season={seasonData.season}
              thisMatchday={seasonData.thisMatchday}
              meMemberId={me?.id ?? null}
              showNormaliser={spread >= 2}
            />
          ) : (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center">
              <p className="text-foreground">
                No {seasonData.unitLabel.toLowerCase()} has been played yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The table fills in once{" "}
                {seasonData.unitLabel.toLowerCase()} {seasonData.startMatchday ?? 1} is
                settled.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/league/${code}/predict`}>Make your predictions</Link>
              </Button>
            </div>
          )}
        </div>

        <ScoringLegend className="mt-6" />
      </main>
    );
  }

  const joinUrl = `${SITE_URL}/league/${code}/join`;
  const standingsUrl = `${SITE_URL}/league/${code}/standings`;
  // "Beat me" shares point at the public standings (anyone can view + join from
  // there); a plain invite points at the join page.
  const ranked = myIndex >= 0;
  const shareText = ranked
    ? `I'm #${myIndex + 1} of ${total} in "${league.name}" with ${rows[myIndex]!.total_points} pts on Verdocast 🏆 Think you can beat me? Predict the World Cup 2026:`
    : `Join my World Cup 2026 prediction league "${league.name}" on Verdocast 🏆 Free to play:`;
  const shareUrl = ranked ? standingsUrl : joinUrl;

  return (
    <main style={brandStyle} className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {league.name}
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
            Leaderboard
          </h1>
        </div>
        <div className="mt-2">
          <ShareButton text={shareText} url={shareUrl} label="Share / Invite" />
        </div>
      </div>

      {me && (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          You&rsquo;re playing as{" "}
          <DisplayNameForm code={code} initialName={me.display_name ?? ""} />
        </p>
      )}

      <div className="mt-6">
        <KnockoutCountdown audience="member" />
      </div>

      <div className="mt-6">
        <Leaderboard
          code={code}
          initialRows={rows}
          initialLiveCount={result.data.liveCount}
          prize={league.prize}
          qualifyCount={league.qualify_count}
        />
      </div>

      <ScoringLegend className="mt-6" />
    </main>
  );
}
