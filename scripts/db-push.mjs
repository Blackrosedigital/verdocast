// Apply SQL migrations in supabase/migrations/ to the database in DATABASE_URL.
//
// Idempotent: each migration's version (the filename prefix before the first
// "_") is recorded in a `schema_migrations` table and skipped on re-run. Each
// migration runs in its own transaction, so a failure rolls back cleanly.
//
// Usage:  node --env-file=.env.local scripts/db-push.mjs
// (We have no Supabase CLI / psql locally; this is the lightweight stand-in.)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "supabase", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Missing DATABASE_URL. Run with: node --env-file=.env.local scripts/db-push.mjs",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString });

function versionOf(filename) {
  return filename.split("_")[0];
}

async function main() {
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      filename text not null,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query("select version from schema_migrations")).rows.map(
      (r) => r.version,
    ),
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let appliedCount = 0;
  for (const file of files) {
    const version = versionOf(file);
    if (applied.has(version)) {
      console.log(`• skip   ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (version, filename) values ($1, $2)",
        [version, file],
      );
      await client.query("commit");
      console.log(`✓ apply  ${file}`);
      appliedCount += 1;
    } catch (err) {
      await client.query("rollback");
      console.error(`✗ failed ${file}: ${err.message}`);
      throw err;
    }
  }

  console.log(
    appliedCount === 0
      ? "Nothing to apply — database is up to date."
      : `Applied ${appliedCount} migration(s).`,
  );
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
