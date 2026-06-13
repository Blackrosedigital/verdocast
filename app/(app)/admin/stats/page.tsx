import { notFound } from "next/navigation";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

type DB = ReturnType<typeof createAdminClient>;

async function count(db: DB, table: "organizations" | "leagues" | "members" | "predictions", activeOnly = false) {
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (activeOnly && table === "leagues") q = q.is("deleted_at", null);
  const { count } = await q;
  return count ?? 0;
}

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

export default async function StatsPage() {
  const user = await requireUser();
  if (!isSuperAdmin(user.email)) notFound();

  const db = createAdminClient();

  const [orgs, leagues, members, predictions] = await Promise.all([
    count(db, "organizations"),
    count(db, "leagues", true),
    count(db, "members"),
    count(db, "predictions"),
  ]);

  const { data: memberRows } = await db.from("members").select("email");
  const uniquePlayers = new Set(
    (memberRows ?? []).map((m) => m.email.toLowerCase()),
  ).size;

  let authUsers = 0;
  for (let page = 1; ; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const n = data?.users?.length ?? 0;
    authUsers += n;
    if (n < 1000) break;
  }

  const { data: leagueRows } = await db
    .from("leagues")
    .select("name, join_code, members(count)")
    .is("deleted_at", null);
  const top = (leagueRows ?? [])
    .map((l) => ({
      name: l.name,
      code: l.join_code,
      members: (l.members as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    .sort((a, b) => b.members - a.members);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Verdocast · private
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        Stats
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Auth users" value={String(authUsers)} sub="signed in" />
        <Stat label="Players" value={String(uniquePlayers)} sub="unique, in leagues" />
        <Stat label="Active leagues" value={String(leagues)} />
        <Stat label="Organizations" value={String(orgs)} />
        <Stat label="Predictions" value={String(predictions)} sub="submitted" />
        <Stat label="Memberships" value={String(members)} sub="total" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Leagues by size
        </h2>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No leagues yet.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {top.map((l, i) => (
              <li key={l.code} className="flex items-center gap-3 text-sm">
                <span className="w-5 font-mono text-muted-foreground">{i + 1}</span>
                <span className="flex-1 text-foreground">{l.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{l.code}</span>
                <span className="w-12 text-right font-mono text-primary">
                  {l.members}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Live from the database. Also available via <code>pnpm stats</code>.
      </p>
    </main>
  );
}
