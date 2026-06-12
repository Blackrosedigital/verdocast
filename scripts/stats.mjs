// Print Verdocast usage stats from the database.
//   pnpm stats   (=> node --env-file=.env.local scripts/stats.mjs)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env. Run with --env-file=.env.local");
  process.exit(1);
}
const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function count(table, filter) {
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

const orgs = await count("organizations");
const leagues = await count("leagues", (q) => q.is("deleted_at", null));
const members = await count("members");
const predictions = await count("predictions");

// Unique players (distinct member emails across all leagues).
const { data: memberRows } = await db.from("members").select("email");
const uniquePlayers = new Set((memberRows ?? []).map((m) => m.email.toLowerCase())).size;

// Auth users (everyone who has signed in: admins + members).
let authUsers = 0;
let page = 1;
for (;;) {
  const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  const n = data?.users?.length ?? 0;
  authUsers += n;
  if (n < 1000) break;
  page += 1;
}

// Top leagues by members.
const { data: leagueRows } = await db
  .from("leagues")
  .select("name, join_code, members(count)")
  .is("deleted_at", null);
const top = (leagueRows ?? [])
  .map((l) => ({ name: l.name, code: l.join_code, members: l.members?.[0]?.count ?? 0 }))
  .sort((a, b) => b.members - a.members)
  .slice(0, 10);

console.log("\n===== Verdocast stats =====");
console.log("Auth users (signed in):", authUsers);
console.log("Unique players (in leagues):", uniquePlayers);
console.log("League memberships (total):", members);
console.log("Leagues (active):", leagues);
console.log("Organizations:", orgs);
console.log("Predictions submitted:", predictions);
console.log("\nTop leagues by members:");
for (const l of top) console.log(`  ${String(l.members).padStart(4)}  ${l.name}  (${l.code})`);
console.log();
