import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JoinLink } from "@/components/admin/join-link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Group stage is free; billing (knockout tiers) surfaces from R32 onward.
const BILLING_VISIBLE_FROM = new Date("2026-06-28T00:00:00Z");

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function AdminLeaguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();

  const { data: org } = await admin
    .from("organizations")
    .select("name, owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  if (org?.owner_email && user.email !== org.owner_email) {
    redirect("/");
  }

  const [licenseRes, membersRes, groupCountRes, topRes] = await Promise.all([
    admin.from("licenses").select("max_members").eq("id", league.license_id).maybeSingle(),
    admin.from("members").select("id").eq("league_id", league.id),
    admin
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("stage", "group"),
    admin
      .from("leaderboard")
      .select("member_id, display_name, total_points, exact_scores")
      .eq("league_id", league.id)
      .order("total_points", { ascending: false })
      .order("exact_scores", { ascending: false })
      .limit(5),
  ]);

  const cap = licenseRes.data?.max_members ?? 0;
  const memberIds = (membersRes.data ?? []).map((m) => m.id);
  const memberCount = memberIds.length;
  const groupCount = groupCountRes.count ?? 0;

  let predictionsMade = 0;
  if (memberIds.length > 0) {
    const { count } = await admin
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .in("member_id", memberIds);
    predictionsMade = count ?? 0;
  }
  const possible = memberCount * groupCount;
  const completion = possible > 0 ? Math.round((predictionsMade / possible) * 100) : 0;

  const joinUrl = `${SITE_URL}/league/${league.join_code}/join`;
  const top = topRes.data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {org?.name ?? "Your organization"} · Admin
      </p>
      <div className="flex items-center justify-between gap-4">
        <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
          {league.name}
        </h1>
        {new Date() >= BILLING_VISIBLE_FROM && (
          <Link
            href="/admin/billing"
            className="shrink-0 text-sm text-muted-foreground underline hover:text-foreground"
          >
            Manage billing
          </Link>
        )}
      </div>{/* billing link hidden during the free group stage */}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Members"
          value={`${memberCount} / ${cap}`}
          sub={`${Math.max(0, cap - memberCount)} seats left`}
        />
        <Stat
          label="Predictions"
          value={`${completion}%`}
          sub={`${predictionsMade} of ${possible} made`}
        />
        <Stat label="Group matches" value={String(groupCount)} sub="to predict" />
      </div>

      {/* Top 5 */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            Top scorers
          </h2>
          <Link
            href={`/league/${league.join_code}/leaderboard`}
            className="text-sm text-primary underline"
          >
            Full leaderboard
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No members yet — invite your team to get started.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {top.map((r, i) => (
              <li
                key={r.member_id}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-5 font-mono text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 text-foreground">{r.display_name}</span>
                <span className="font-mono text-primary">
                  {r.total_points ?? 0} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Invite */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Invite your team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link or the join code{" "}
          <span className="font-mono text-foreground">{league.join_code}</span>.
        </p>
        <div className="mt-4">
          <JoinLink joinUrl={joinUrl} />
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link href={`/admin/league/${slug}/invite`}>
              Invite your team by email
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
