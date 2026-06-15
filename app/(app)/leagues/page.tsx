import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

interface LeagueLite {
  name: string;
  slug: string;
  join_code: string;
  brand_color: string | null;
  deleted_at: string | null;
}

/** Member hub: every league the signed-in user belongs to, with quick links. */
export default async function MyLeaguesPage() {
  const user = await requireUser("/leagues");
  const admin = createAdminClient();
  const email = (user.email ?? "").toLowerCase();

  const { data: rows } = await admin
    .from("members")
    .select("leagues(name, slug, join_code, brand_color, deleted_at)")
    .eq("email", email);

  const leagues = (rows ?? [])
    .map((r) => r.leagues as unknown as LeagueLite | null)
    .filter((l): l is LeagueLite => !!l && !l.deleted_at)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={[{ href: "/leagues", label: "My leagues" }]} />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-5xl tracking-wide text-foreground">
          My leagues
        </h1>

        {leagues.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-muted-foreground">
              You haven&rsquo;t joined a league yet.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/play">Join the global league</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/start">Start your own</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {leagues.map((l) => (
              <li
                key={l.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: l.brand_color || "var(--primary)" }}
                  />
                  <span className="font-display text-2xl tracking-wide text-foreground">
                    {l.name}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Button asChild size="sm">
                    <Link href={`/league/${l.join_code}/predict`}>Predict</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/league/${l.join_code}/leaderboard`}>
                      Leaderboard
                    </Link>
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
