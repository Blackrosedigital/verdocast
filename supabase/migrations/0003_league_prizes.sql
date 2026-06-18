-- ============================================================
-- League prizes & qualification (PRD §7: knockout rewards).
-- prize:         free-text reward the admin sets (employer/sponsor funded).
-- qualify_count: how many top-of-leaderboard players "qualify" (0 = off).
-- Rewards are free-entry, skill-based (the leaderboard) - not gambling.
-- ============================================================
alter table leagues
  add column if not exists prize text,
  add column if not exists qualify_count int not null default 0
    check (qualify_count >= 0 and qualify_count <= 50);
