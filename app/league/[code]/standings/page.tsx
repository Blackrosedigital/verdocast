import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoringLegend } from "@/components/scoring-legend";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/db";

// Public, read-only standings — the shareable "I'm #3, beat me" surface. No auth.
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getLeague(code: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("leagues")
    .select("id, name, join_code, brand_color, brand_logo_url")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const league = await getLeague(code);
  if (!league) return { title: "League not found | Verdocast" };
  return {
    title: `${league.name} leaderboard - World Cup 2026 | Verdocast`,
    description: `Live standings for ${league.name}. Join the free World Cup 2026 prediction league and climb the leaderboard.`,
    alternates: { canonical: `/league/${code}/standings` },
  };
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const league = await getLeague(code);
  if (!league) notFound();

  const admin = createAdminClient();
  const { data: rowsRaw } = await admin
    .from("leaderboard")
    .select("member_id, display_name, total_points, exact_scores, matches_scored")
    .eq("league_id", league.id)
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false });
  const rows = rowsRaw ?? [];

  const brandStyle = league.brand_color
    ? ({ "--primary": league.brand_color } as CSSProperties)
    : undefined;
  const standingsUrl = `${SITE_URL}/league/${code}/standings`;

  return (
    <main style={brandStyle} className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        {league.brand_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={league.brand_logo_url}
            alt={league.name}
            className="mx-auto mb-4 h-14 w-auto object-contain"
          />
        ) : (
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Verdocast · World Cup 2026
          </Link>
        )}
        <h1 className="mt-4 font-display text-5xl tracking-wide text-foreground">
          {league.name}
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Leaderboard
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 text-right font-medium">Pts</th>
              <th className="px-4 py-3 text-right font-medium">Exact</th>
              <th className="px-4 py-3 text-right font-medium">Played</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.member_id ?? i}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {r.display_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-lg text-primary">
                  {r.total_points ?? 0}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {r.exact_scores ?? 0}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {r.matches_scored ?? 0}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No predictions scored yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ScoringLegend className="mt-6" />

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Think you can do better?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Join {league.name} - free to play. Predict every match and climb the
          board.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={`/league/${code}/join`}>Join {league.name}</Link>
          </Button>
          <ShareButton
            text={`${league.name} World Cup 2026 leaderboard on Verdocast 🏆 Think you can beat them?`}
            url={standingsUrl}
            label="Share"
            variant="secondary"
          />
        </div>
      </div>
    </main>
  );
}
