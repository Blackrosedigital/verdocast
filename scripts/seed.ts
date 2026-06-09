// Seed the `matches` table from data/tournament-2026.json.
//
// Idempotent: upsert with onConflict=match_code + ignoreDuplicates, so existing
// matches are skipped (ON CONFLICT DO NOTHING). Safe to run repeatedly.
//
// Run:  pnpm seed   (=> node --env-file=.env.local --import tsx scripts/seed.ts)
//
// Uses the Supabase SERVICE ROLE key (bypasses RLS). Relative imports only so
// tsx doesn't need tsconfig path-alias resolution.

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../types/db";
import tournament from "../data/tournament-2026.json";

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];

const MatchRow = z.object({
  match_code: z.string().min(1),
  kickoff_utc: z.string().min(1),
  stage: z.enum(["group", "r32", "r16", "qf", "sf", "third", "final"]),
  group_letter: z.string().nullable(),
  home_team: z.string().nullable(),
  away_team: z.string().nullable(),
  venue: z.string().min(1),
  venue_city: z.string().min(1),
}) satisfies z.ZodType<MatchInsert>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing ${name}. Run via \`pnpm seed\` so .env.local is loaded.`,
    );
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Keep only DB columns (drop `matchup`), then validate every row.
  const rows: MatchInsert[] = tournament.matches.map((m) =>
    MatchRow.parse({
      match_code: m.match_code,
      kickoff_utc: m.kickoff_utc,
      stage: m.stage,
      group_letter: m.group_letter,
      home_team: m.home_team,
      away_team: m.away_team,
      venue: m.venue,
      venue_city: m.venue_city,
    }),
  );

  console.log(`Seeding ${rows.length} matches…`);

  const { data, error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "match_code", ignoreDuplicates: true })
    .select("match_code");

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  const inserted = data?.length ?? 0;
  console.log(
    inserted === 0
      ? "Nothing to insert — all matches already present."
      : `Inserted ${inserted} new match(es); ${rows.length - inserted} already present.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
