import Link from "next/link";
import { redirect } from "next/navigation";
import { NewLeagueForm } from "@/components/admin/new-league-form";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Admin home: a hub listing every league the signed-in owner runs, with a way to
 * spin up another. New owners (no org/leagues yet) are sent to /start.
 */
export default async function AdminIndexPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("owner_email", user.email ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!org) redirect("/start");

  const { data: leaguesRaw } = await admin
    .from("leagues")
    .select("slug, name, join_code, members(count)")
    .eq("organization_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const leagues = leaguesRaw ?? [];
  if (leagues.length === 0) redirect("/start");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {org.name} · Admin
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        Your leagues
      </h1>

      <ul className="mt-8 space-y-3">
        {leagues.map((l) => {
          const members =
            (l.members as unknown as { count: number }[])?.[0]?.count ?? 0;
          return (
            <li
              key={l.slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5"
            >
              <div>
                <p className="font-display text-2xl tracking-wide text-foreground">
                  {l.name}
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {members} member{members === 1 ? "" : "s"} · {l.join_code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/league/${l.join_code}/leaderboard`}>
                    Leaderboard
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/league/${l.slug}`}>Manage</Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Create another league
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Run a separate league - a different department, team, or group of mates.
          It shares your free plan.
        </p>
        <NewLeagueForm />
      </div>
    </main>
  );
}
