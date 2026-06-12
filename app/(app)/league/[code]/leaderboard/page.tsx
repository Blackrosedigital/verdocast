import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/leaderboard";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await requireUser();

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("name")
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {league.name}
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        Leaderboard
      </h1>

      <div className="mt-8">
        <Leaderboard
          code={code}
          initialRows={result.data.rows}
          initialLiveCount={result.data.liveCount}
        />
      </div>
    </main>
  );
}
