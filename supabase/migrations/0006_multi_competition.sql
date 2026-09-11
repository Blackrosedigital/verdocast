-- ============================================================
-- 0006_multi_competition
--
-- Phase 1 of the multi-competition migration (docs/tech-foundation.md B2/B4,
-- docs/season-launch-plan.md Phase 1). ADDITIVE AND NON-BREAKING: creates the
-- new tables empty and adds nullable columns to `leagues`. Nothing reads these
-- yet, and `matches`/`predictions` are untouched, so the live World Cup
-- surfaces keep working exactly as they do today.
--
-- Backfill, the predictions repoint and the `matches` compatibility view are
-- 0007 — deliberately separated because that step is the irreversible one.
-- ============================================================

-- ============================================================
-- Competitions: a timeless competition. `sport` leaves room for
-- non-football later; everything at launch is football.
-- ============================================================
create table competitions (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'football',
  name text not null,                       -- 'Premier League', 'UEFA Champions League'
  short_name text,                          -- 'PL', 'UCL'
  slug text unique not null,                -- 'premier-league', 'champions-league'
  kind text not null check (kind in ('league', 'cup', 'tournament')),
  country text,                             -- 'England', null for continental
  logo_url text,
  provider text not null default 'api-football',
  provider_competition_id text,             -- API-Football league id ('39', '2')
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_competition_id)
);

-- ============================================================
-- Seasons: the concrete edition a league predicts. Ingestion polls
-- seasons with status='active' (see jobs/ingest-results.ts).
-- ============================================================
create table seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  label text not null,                      -- '2026/27', '2026'
  starts_on date,
  ends_on date,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'complete')),
  total_matchdays int,                      -- 38 (PL), 8 league-phase (UCL), null (cup)
  provider_season_id text,                  -- API-Football season ('2026')
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competition_id, label)
);

create index idx_seasons_competition_id on seasons(competition_id);
create index idx_seasons_status on seasons(status);

-- ============================================================
-- Teams: promoted out of data/tournament-2026.json into the DB.
-- Covers national sides and clubs alike.
--
-- Crests: we store `crest_url` but the product renders club COLOUR +
-- NAME. Club crests are trademarked (docs/tech-foundation.md A1) —
-- do not surface them, and never market data as "official".
-- ============================================================
create table teams (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'football',
  name text not null,                       -- 'Manchester City', 'Spain'
  short_code text,                          -- 'MCI', 'ESP'
  slug text not null,
  country text,
  primary_color text,                       -- hex, the club identity we actually render
  secondary_color text,
  crest_url text,                           -- stored, not rendered (see note above)
  provider text not null default 'api-football',
  provider_team_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sport, slug),
  unique(provider, provider_team_id)
);

create index idx_teams_slug on teams(slug);

-- ============================================================
-- Fixtures: generalises `matches`. One row per fixture in a season.
--
-- `stage` is text, not the WC-specific match_stage enum, because it has
-- to carry league seasons ('regular'), the UCL Swiss league phase
-- ('league_phase') and knockout rounds in one column.
--
-- `matchday` is the gameweek (PL 1..38) or league-phase matchday
-- (UCL 1..8), and is what leagues.start_matchday is compared against.
--
-- Knockout ties keep team ids null until the draw, displaying `matchup`
-- ('Winner LP-1') and wiring the tree via home/away_source_fixture_id.
-- ============================================================
create table fixtures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  stage text not null,                      -- 'regular'|'league_phase'|'group'|'playoff'|'r32'|'r16'|'qf'|'sf'|'third'|'final'
  matchday int,                             -- gameweek / league-phase matchday; null for knockouts
  group_label text,                         -- 'A'..'L' for group tournaments, else null
  home_team_id uuid references teams(id) on delete restrict,
  away_team_id uuid references teams(id) on delete restrict,
  matchup text,                             -- bracket placeholder before the draw
  home_source_fixture_id uuid references fixtures(id) on delete set null,
  away_source_fixture_id uuid references fixtures(id) on delete set null,
  kickoff_utc timestamptz not null,
  venue text,
  venue_city text,
  status match_status not null default 'scheduled',   -- reuses the 0001 enum
  home_score int,
  away_score int,
  result char(1),                           -- 'H'|'D'|'A' once finished
  provider_fixture_id text unique,          -- API-Football fixture id
  finalised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_fixtures_season_id on fixtures(season_id);
create index idx_fixtures_kickoff_utc on fixtures(kickoff_utc);
create index idx_fixtures_status on fixtures(status);
-- The matchday predict view's main access path: "season X, matchday N, in order".
create index idx_fixtures_season_matchday on fixtures(season_id, matchday, kickoff_utc);

-- ============================================================
-- Bind leagues to a season, and to the matchday their scoring window
-- opens (docs/season-launch-plan.md — the core mid-season mechanic).
--
-- Points count for fixtures where matchday >= start_matchday. Earlier
-- fixtures stay visible and read-only with real results, worth zero.
-- A company buying in February gets a fair league starting in February.
--
-- Both nullable: existing World Cup leagues predate this and are
-- backfilled to the WC season in 0007.
-- ============================================================
alter table leagues
  add column season_id uuid references seasons(id) on delete restrict,
  add column start_matchday int check (start_matchday >= 1);

create index idx_leagues_season_id on leagues(season_id);

-- ============================================================
-- Row-Level Security. Matches the 0001 posture: reference data is
-- publicly readable, everything else goes through the service role.
-- ============================================================
alter table competitions enable row level security;
alter table seasons enable row level security;
alter table teams enable row level security;
alter table fixtures enable row level security;

create policy "competitions_public_read" on competitions for select using (true);
create policy "seasons_public_read" on seasons for select using (true);
create policy "teams_public_read" on teams for select using (true);
create policy "fixtures_public_read" on fixtures for select using (true);
