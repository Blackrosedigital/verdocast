import { notFound, redirect } from "next/navigation";
import { JoinLink } from "@/components/admin/join-link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Admin dashboard for a league (placeholder). PR 9 builds the real dashboard
 * (member count, completion %, top scorers). For now it confirms the league is
 * live and surfaces the shareable join link.
 */
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
    .maybeSingle();
  if (!league) notFound();

  // v1 authorization: only the org owner may view (RLS hardening in PR 9).
  const { data: org } = await admin
    .from("organizations")
    .select("name, owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  if (org?.owner_email && user.email !== org.owner_email) {
    redirect("/");
  }

  const joinUrl = `${SITE_URL}/league/${league.join_code}/join`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {org?.name ?? "Your organization"} · Admin
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        {league.name}
      </h1>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Invite your team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link or the join code{" "}
          <span className="font-mono text-foreground">{league.join_code}</span>.
          Anyone who opens it can join and start predicting.
        </p>
        <div className="mt-4">
          <JoinLink joinUrl={joinUrl} />
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Email invitations, the predictions grid, and the live leaderboard land in
        the next updates.
      </p>
    </main>
  );
}
