-- ============================================================
-- WC2026 Office Leagues — initial schema
-- Run this against a fresh Supabase Postgres instance.
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- Organizations: a company that bought one or more licenses
-- ============================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_owner_email on organizations(owner_email);

-- ============================================================
-- Licenses: a Stripe purchase. One organization can have multiple
-- (e.g. they came back next year). max_members caps the league size.
-- ============================================================
create type license_tier as enum ('starter', 'pro', 'team', 'enterprise');

create table licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  tier license_tier not null,
  max_members int not null check (max_members > 0),
  amount_paid_pence int not null check (amount_paid_pence >= 0),
  currency text not null default 'gbp',
  stripe_session_id text unique,
  stripe_payment_intent text unique,
  expires_at timestamptz not null, -- = 2026-10-19 by default (tournament + 90d)
  created_at timestamptz not null default now()
);

create index idx_licenses_organization_id on licenses(organization_id);

-- ============================================================
-- Leagues: a competition within an org. A small org has 1; a big org
-- might have one per department. join_code is the shareable bit.
-- ============================================================
create table leagues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  license_id uuid not null references licenses(id) on delete restrict,
  name text not null,
  slug text not null,
  join_code text unique not null,
  created_by_email text not null,
  brand_color text, -- hex like '#e6ff3d'
  brand_logo_url text,
  scoring_rules jsonb not null default '{"exact":5,"goal_diff":3,"result":2}'::jsonb,
  is_demo boolean not null default false, -- the public demo league
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_leagues_organization_id on leagues(organization_id);
create index idx_leagues_join_code on leagues(join_code);

-- ============================================================
-- Members: people who joined a league. Email-only identity.
-- A member exists per (league, email) pair.
-- ============================================================
create table members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  email text not null,
  display_name text not null,
  is_admin boolean not null default false, -- org admin auto-added as member
  joined_at timestamptz not null default now(),
  unique(league_id, email)
);

create index idx_members_league_id on members(league_id);
create index idx_members_email on members(email);

-- ============================================================
-- Matches: the 104 tournament matches. Group stage matches have
-- known teams; knockouts have home/away as 'TBD' until draws happen.
-- ============================================================
create type match_stage as enum ('group', 'r32', 'r16', 'qf', 'sf', 'third', 'final');
create type match_status as enum ('scheduled', 'live', 'finished', 'postponed');

create table matches (
  id uuid primary key default gen_random_uuid(),
  match_code text unique not null, -- e.g. 'GROUP_A_1', 'R32_1'
  kickoff_utc timestamptz not null,
  stage match_stage not null,
  group_letter char(1), -- 'A'..'L' for group stage, null for knockouts
  home_team text, -- nullable for early knockouts
  away_team text,
  venue text not null,
  venue_city text not null,
  status match_status not null default 'scheduled',
  home_score int, -- null until match starts
  away_score int,
  result char(1), -- 'H', 'D', 'A' once finished
  external_id text, -- API-Football fixture ID for ingestion
  finalised_at timestamptz, -- when status moved to 'finished'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_matches_kickoff_utc on matches(kickoff_utc);
create index idx_matches_status on matches(status);
create index idx_matches_stage on matches(stage);

-- ============================================================
-- Predictions: a member's predicted score for a match.
-- Editable until kickoff. points_earned is computed once on match
-- completion and cached here. Unique (member, match).
-- ============================================================
create table predictions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  home_score int not null check (home_score >= 0 and home_score <= 20),
  away_score int not null check (away_score >= 0 and away_score <= 20),
  points_earned int, -- null until match finishes
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(member_id, match_id)
);

create index idx_predictions_member_id on predictions(member_id);
create index idx_predictions_match_id on predictions(match_id);

-- ============================================================
-- Lockdown trigger: predictions cannot be created or updated
-- after the match has kicked off. Application code also enforces
-- this but the DB is the source of truth.
-- ============================================================
create or replace function enforce_prediction_lockdown()
returns trigger as $$
declare
  v_kickoff timestamptz;
begin
  select kickoff_utc into v_kickoff from matches where id = new.match_id;
  if v_kickoff is null then
    raise exception 'Match % not found', new.match_id;
  end if;
  if now() >= v_kickoff then
    raise exception 'Predictions locked: match kicked off at %', v_kickoff;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_predictions_lockdown
before insert or update on predictions
for each row execute function enforce_prediction_lockdown();

-- ============================================================
-- Member cap trigger: a league cannot have more members than its
-- license's max_members.
-- ============================================================
create or replace function enforce_member_cap()
returns trigger as $$
declare
  v_cap int;
  v_count int;
begin
  select l.max_members into v_cap
    from leagues lg
    join licenses l on l.id = lg.license_id
    where lg.id = new.league_id;
  select count(*) into v_count from members where league_id = new.league_id;
  if v_count >= v_cap then
    raise exception 'League member cap reached (% members)', v_cap;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_members_cap
before insert on members
for each row execute function enforce_member_cap();

-- ============================================================
-- Leaderboard view: per league, sum of points and prediction count.
-- Indexed via the underlying tables; this is a simple aggregation
-- that runs in well under 50ms for typical league sizes.
-- ============================================================
create or replace view leaderboard as
select
  m.league_id,
  m.id as member_id,
  m.display_name,
  m.email,
  coalesce(sum(p.points_earned), 0)::int as total_points,
  count(p.id) filter (where p.points_earned is not null)::int as matches_scored,
  count(p.id) filter (where p.points_earned = 5)::int as exact_scores,
  count(p.id)::int as total_predictions
from members m
left join predictions p on p.member_id = m.id
group by m.league_id, m.id, m.display_name, m.email;

-- ============================================================
-- Row-Level Security
-- All tables RLS-enabled; access controlled via server-side service
-- role for now (since we use Supabase only as Postgres + Auth).
-- Tighten with policies in PR 9 (admin dashboard hardening).
-- ============================================================
alter table organizations enable row level security;
alter table licenses enable row level security;
alter table leagues enable row level security;
alter table members enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;

-- Public read on matches (tournament data is not secret)
create policy "matches_public_read" on matches for select using (true);

-- Everything else: server-only access (via service role key). UI
-- talks to a Server Action that uses the service role. Granular
-- per-user RLS policies arrive in PR 9.
