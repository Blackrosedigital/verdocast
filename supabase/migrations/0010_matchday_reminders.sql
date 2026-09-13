-- ============================================================
-- 0010_matchday_reminders
--
-- One row per reminder actually sent. The unique constraint IS the
-- double-send guard: the cron runs every 15 minutes and a matchday's deadline
-- window is hours wide, so without it every member would be emailed dozens of
-- times before a single gameweek locked.
--
-- Deliberately a real table rather than a timestamp column on `members`:
-- reminders are per (member, matchday), and a member plays 38 of them.
-- ============================================================

create table matchday_reminders (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  matchday int not null,
  -- What the member still had outstanding when we nudged them. Kept for
  -- tuning: if most reminders go to people who then don't predict, the
  -- reminder is wrong, not the member.
  outstanding int not null default 0,
  sent_at timestamptz not null default now(),
  unique (member_id, matchday)
);

create index idx_matchday_reminders_league on matchday_reminders(league_id, matchday);

alter table matchday_reminders enable row level security;
grant select, insert on matchday_reminders to service_role;
