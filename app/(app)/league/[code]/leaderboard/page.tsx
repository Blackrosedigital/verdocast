import Link from "next/link";
import { notFound } from "next/navigation";
import { DisplayNameForm } from "@/components/display-name-form";
import { KnockoutCountdown } from "@/components/knockout-countdown";
import { Leaderboard } from "@/components/leaderboard";
import { ScoringLegend } from "@/components/scoring-legend";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser(`/league/${code}/leaderboard`);

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
        />
      </div>

      <ScoringLegend className="mt-6" />
    </main>
  );
}
