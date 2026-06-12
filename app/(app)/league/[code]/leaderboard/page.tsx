import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/leaderboard";
import { ShareButton } from "@/components/share-button";
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
  const user = await requireUser();

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("id, name")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();

  const result = await getLeaderboard(code);
  if (!result.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl tracking-wide text-foreground">
          You&rsquo;re not in this league
        </h1>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </main>
    );
  }

  // Find the viewer's rank for a Wordle-style share line.
  const { data: me } = await admin
    .from("members")
    .select("id")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();
  const rows = result.data.rows;
  const myIndex = me ? rows.findIndex((r) => r.member_id === me.id) : -1;
  const total = rows.length;

  const joinUrl = `${SITE_URL}/league/${code}/join`;
  const shareText =
    myIndex >= 0
      ? `I'm #${myIndex + 1} of ${total} in "${league.name}" with ${rows[myIndex]!.total_points} pts on Verdocast 🏆 Think you can beat me? Predict the World Cup 2026:`
      : `Join my World Cup 2026 prediction league "${league.name}" on Verdocast 🏆 Free to play:`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
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
          <ShareButton text={shareText} url={joinUrl} label="Share / Invite" />
        </div>
      </div>

      <div className="mt-8">
        <Leaderboard
          code={code}
          initialRows={rows}
          initialLiveCount={result.data.liveCount}
        />
      </div>
    </main>
  );
}
