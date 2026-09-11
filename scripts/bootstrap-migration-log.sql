-- ============================================================
-- One-time repair, not a migration. Do NOT put this in
-- supabase/migrations/ — db-push.mjs would try to apply it.
--
-- Migrations 0001-0005 were applied by hand in the Supabase SQL editor, so
-- the database has their schema but no `schema_migrations` table to prove it.
-- Run this ONCE before the first `pnpm db:push`, otherwise db-push will see an
-- empty log, try to re-apply 0001 (`create table organizations` — no IF NOT
-- EXISTS) and fail.
--
-- Safe to re-run: the insert is ON CONFLICT DO NOTHING.
-- ============================================================

create table if not exists schema_migrations (
  version text primary key,
  filename text not null,
  applied_at timestamptz not null default now()
);

-- Versions are full filenames minus ".sql" (see scripts/db-push.mjs).
insert into schema_migrations (version, filename)
values
  ('0001_initial',              '0001_initial.sql'),
  ('0002_prediction_lockdown',  '0002_prediction_lockdown.sql'),
  ('0003_league_prizes',        '0003_league_prizes.sql'),
  ('0003_rls',                  '0003_rls.sql'),
  ('0004_refunds',              '0004_refunds.sql'),
  ('0005_referrals',            '0005_referrals.sql')
on conflict (version) do nothing;

select version, applied_at from schema_migrations order by version;
