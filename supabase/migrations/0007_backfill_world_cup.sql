-- ============================================================
-- 0007_backfill_world_cup
--
-- Phase 1, step 2 (docs/season-launch-plan.md). Moves the World Cup into the
-- multi-competition model and makes `fixtures` the single prediction target:
--
--   1. assert the source data reconciles BEFORE anything is written
--   2. backfill competition / season / teams / fixtures
--   3. assert the backfill is total, then repoint predictions at fixtures
--   4. replace the `matches` TABLE with a compatibility VIEW over fixtures
--
-- This touches live user data (16 leagues, 64 members, 1,178 predictions at
-- time of writing). It runs in one transaction via db-push.mjs, so a failed
-- assertion rolls the whole thing back. The dangerous case is not a crash —
-- it is a migration that "succeeds" with a subtly wrong team mapping and
-- quietly corrupts prediction history, so every step that could lose a row
-- is bracketed by a count assertion that aborts the transaction.
--
-- FIXTURE IDS ARE PRESERVED FROM MATCH IDS. That is deliberate and load-
-- bearing: predictions.match_id already holds those UUIDs, so repointing the
-- foreign key needs no data rewrite, and any bookmarked /match/<id> URL or
-- cached id stays valid.
-- ============================================================

-- ============================================================
-- Step 0 — Preconditions. Cheap, and they fail loudly.
--
-- Deliberately NOT asserting a non-zero match count: on a fresh database
-- 0001..0007 run before any seed, so an empty `matches` is legitimate and the
-- backfill is simply a no-op. Everything below is written to survive that.
-- ============================================================
do $$
declare
  v_unresolved int;
  v_dupe_external int;
begin
  select count(*) into v_unresolved
    from matches where home_team is null or away_team is null;
  if v_unresolved > 0 then
    raise exception
      'Aborting: % match(es) still have unresolved teams. Knockout placeholders must be resolved before backfill, or team mapping will be lossy.',
      v_unresolved;
  end if;

  select count(*) into v_dupe_external from (
    select external_id from matches
    where external_id is not null
    group by external_id having count(*) > 1
  ) s;
  if v_dupe_external > 0 then
    raise exception
      'Aborting: % duplicated external_id(s) in matches; provider_fixture_id is UNIQUE on fixtures.',
      v_dupe_external;
  end if;
end $$;

-- ============================================================
-- Step 1 — Columns this step needs.
--
-- fixtures.code carries the human match code ('GROUP_A_1', later 'GW1_3').
-- teams.flag_emoji completes the promotion of data/tournament-2026.json into
-- the database — national sides are rendered by flag, clubs by colour.
-- ============================================================
alter table fixtures add column if not exists code text;
create unique index if not exists idx_fixtures_season_code
  on fixtures(season_id, code) where code is not null;

alter table teams add column if not exists flag_emoji text;

-- ============================================================
-- Step 2 — The World Cup as a competition + season.
-- ============================================================
insert into competitions (sport, name, short_name, slug, kind, provider, provider_competition_id)
values ('football', 'FIFA World Cup', 'WC', 'fifa-world-cup', 'tournament', 'api-football', '1')
on conflict (slug) do nothing;

insert into seasons (competition_id, label, starts_on, ends_on, status, provider_season_id)
select c.id, '2026', date '2026-06-11', date '2026-07-19', 'complete', '2026'
from competitions c where c.slug = 'fifa-world-cup'
on conflict (competition_id, label) do nothing;

-- ============================================================
-- Step 3 — The 48 nations, promoted from data/tournament-2026.json.
-- `country` = the nation itself for national sides. Confederation is not
-- carried over: nothing renders it, and the JSON remains the record.
-- ============================================================
insert into teams (sport, name, short_code, slug, country, flag_emoji, provider)
select 'football', v.name, v.code, v.slug, v.name, v.flag, 'api-football'
from (values
  ('Mexico', 'MEX', 'mexico', '🇲🇽'),
  ('South Africa', 'RSA', 'south-africa', '🇿🇦'),
  ('South Korea', 'KOR', 'south-korea', '🇰🇷'),
  ('Czechia', 'CZE', 'czechia', '🇨🇿'),
  ('Canada', 'CAN', 'canada', '🇨🇦'),
  ('Bosnia and Herzegovina', 'BIH', 'bosnia-and-herzegovina', '🇧🇦'),
  ('Qatar', 'QAT', 'qatar', '🇶🇦'),
  ('Switzerland', 'SUI', 'switzerland', '🇨🇭'),
  ('Brazil', 'BRA', 'brazil', '🇧🇷'),
  ('Morocco', 'MAR', 'morocco', '🇲🇦'),
  ('Haiti', 'HAI', 'haiti', '🇭🇹'),
  ('Scotland', 'SCO', 'scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('United States', 'USA', 'united-states', '🇺🇸'),
  ('Paraguay', 'PAR', 'paraguay', '🇵🇾'),
  ('Australia', 'AUS', 'australia', '🇦🇺'),
  ('Türkiye', 'TUR', 'turkiye', '🇹🇷'),
  ('Germany', 'GER', 'germany', '🇩🇪'),
  ('Curaçao', 'CUW', 'curacao', '🇨🇼'),
  ('Ivory Coast', 'CIV', 'ivory-coast', '🇨🇮'),
  ('Ecuador', 'ECU', 'ecuador', '🇪🇨'),
  ('Netherlands', 'NED', 'netherlands', '🇳🇱'),
  ('Japan', 'JPN', 'japan', '🇯🇵'),
  ('Sweden', 'SWE', 'sweden', '🇸🇪'),
  ('Tunisia', 'TUN', 'tunisia', '🇹🇳'),
  ('Belgium', 'BEL', 'belgium', '🇧🇪'),
  ('Egypt', 'EGY', 'egypt', '🇪🇬'),
  ('Iran', 'IRN', 'iran', '🇮🇷'),
  ('New Zealand', 'NZL', 'new-zealand', '🇳🇿'),
  ('Spain', 'ESP', 'spain', '🇪🇸'),
  ('Cape Verde', 'CPV', 'cape-verde', '🇨🇻'),
  ('Saudi Arabia', 'KSA', 'saudi-arabia', '🇸🇦'),
  ('Uruguay', 'URU', 'uruguay', '🇺🇾'),
  ('France', 'FRA', 'france', '🇫🇷'),
  ('Senegal', 'SEN', 'senegal', '🇸🇳'),
  ('Iraq', 'IRQ', 'iraq', '🇮🇶'),
  ('Norway', 'NOR', 'norway', '🇳🇴'),
  ('Argentina', 'ARG', 'argentina', '🇦🇷'),
  ('Algeria', 'ALG', 'algeria', '🇩🇿'),
  ('Austria', 'AUT', 'austria', '🇦🇹'),
  ('Jordan', 'JOR', 'jordan', '🇯🇴'),
  ('Portugal', 'POR', 'portugal', '🇵🇹'),
  ('DR Congo', 'COD', 'dr-congo', '🇨🇩'),
  ('Uzbekistan', 'UZB', 'uzbekistan', '🇺🇿'),
  ('Colombia', 'COL', 'colombia', '🇨🇴'),
  ('England', 'ENG', 'england', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croatia', 'CRO', 'croatia', '🇭🇷'),
  ('Ghana', 'GHA', 'ghana', '🇬🇭'),
  ('Panama', 'PAN', 'panama', '🇵🇦')
) as v(name, code, slug, flag)
on conflict (sport, slug) do nothing;

-- Every team name used by a match must now resolve to exactly one team row.
-- Checked before the fixtures insert so a mapping gap fails here, with the
-- offending names named, rather than surfacing as a silent NULL team id.
do $$
declare v_missing text;
begin
  select string_agg(distinct s.name, ', ') into v_missing
  from (
    select home_team as name from matches
    union select away_team from matches
  ) s
  where s.name is not null
    and not exists (select 1 from teams t where t.sport = 'football' and t.name = s.name);
  if v_missing is not null then
    raise exception 'Aborting: match team names with no teams row: %', v_missing;
  end if;
end $$;

-- ============================================================
-- Step 4 — matches -> fixtures, PRESERVING IDS (see header).
-- matchday stays null: a tournament has no gameweeks, which is exactly why
-- leagues.start_matchday is also left null for World Cup leagues.
-- ============================================================
insert into fixtures (
  id, season_id, stage, matchday, group_label,
  home_team_id, away_team_id, kickoff_utc, venue, venue_city,
  status, home_score, away_score, result,
  provider_fixture_id, code, finalised_at, created_at, updated_at
)
select
  m.id, s.id, m.stage::text, null, m.group_letter::text,
  ht.id, at.id, m.kickoff_utc, m.venue, m.venue_city,
  m.status, m.home_score, m.away_score, m.result,
  m.external_id, m.match_code, m.finalised_at, m.created_at, m.updated_at
from matches m
cross join lateral (
  select s.id from seasons s
  join competitions c on c.id = s.competition_id
  where c.slug = 'fifa-world-cup' and s.label = '2026'
) s
left join teams ht on ht.sport = 'football' and ht.name = m.home_team
left join teams at on at.sport = 'football' and at.name = m.away_team
on conflict (id) do nothing;

-- Reconciliation: every match became exactly one fixture, with both teams
-- resolved. Any shortfall aborts the transaction.
do $$
declare
  v_matches int;
  v_missing int;
  v_null_teams int;
begin
  select count(*) into v_matches from matches;

  select count(*) into v_missing
    from matches m left join fixtures f on f.id = m.id
    where f.id is null;
  if v_missing > 0 then
    raise exception 'Aborting: % of % match(es) did not reach fixtures.', v_missing, v_matches;
  end if;

  select count(*) into v_null_teams
    from fixtures f join matches m on m.id = f.id
    where f.home_team_id is null or f.away_team_id is null;
  if v_null_teams > 0 then
    raise exception 'Aborting: % backfilled fixture(s) have an unmapped team id.', v_null_teams;
  end if;

  raise notice 'Backfilled % fixture(s) from matches.', v_matches;
end $$;

-- ============================================================
-- Step 5 — Bind existing leagues to the World Cup season.
-- start_matchday stays null (no matchdays in a tournament).
-- ============================================================
update leagues set season_id = (
  select s.id from seasons s
  join competitions c on c.id = s.competition_id
  where c.slug = 'fifa-world-cup' and s.label = '2026'
) where season_id is null;

-- ============================================================
-- Step 6 — Repoint predictions at fixtures.
--
-- The COLUMN KEEPS THE NAME `match_id`. Renaming it to fixture_id is a
-- cosmetic change that would break every app call site at once; since ids
-- were preserved the column already points at valid fixtures rows, so the
-- constraint can move now and the rename can ride along with the code when
-- those call sites move to fixtures.
-- ============================================================
do $$
declare v_orphans int;
begin
  select count(*) into v_orphans
    from predictions p left join fixtures f on f.id = p.match_id
    where f.id is null;
  if v_orphans > 0 then
    raise exception 'Aborting: % prediction(s) would be orphaned by the FK repoint.', v_orphans;
  end if;
end $$;

alter table predictions drop constraint predictions_match_id_fkey;
alter table predictions add constraint predictions_match_id_fkey
  foreign key (match_id) references fixtures(id) on delete cascade;

-- The lockdown invariant (CLAUDE.md) now reads its kickoff from fixtures.
-- Behaviour is otherwise identical to 0002, including the carve-out that
-- lets the scoring engine write points_earned after kickoff.
create or replace function enforce_prediction_lockdown()
returns trigger as $$
declare
  v_kickoff timestamptz;
begin
  if tg_op = 'UPDATE'
     and new.home_score = old.home_score
     and new.away_score = old.away_score then
    new.updated_at := now();
    return new;
  end if;

  select kickoff_utc into v_kickoff from fixtures where id = new.match_id;
  if v_kickoff is null then
    raise exception 'Fixture % not found', new.match_id;
  end if;
  if now() >= v_kickoff then
    raise exception 'Predictions locked: match kicked off at %', v_kickoff;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Step 7 — `matches` becomes a compatibility VIEW over fixtures.
--
-- TEMPORARY SHIM. It exists so this migration can be applied and verified on
-- its own, without simultaneously rewriting every World Cup read path and the
-- test suite. Delete it once those move to fixtures; do not build anything
-- new on it.
--
-- It is fully writable via INSTEAD OF triggers rather than read-only, because
-- the seed script and three test files insert, update and delete matches —
-- a read-only view would turn a green suite red for reasons unrelated to the
-- migration.
-- ============================================================
drop table matches;

create view matches as
select
  f.id,
  f.code                                              as match_code,
  f.kickoff_utc,
  f.stage::match_stage                                as stage,
  f.group_label::char(1)                              as group_letter,
  (select t.name from teams t where t.id = f.home_team_id) as home_team,
  (select t.name from teams t where t.id = f.away_team_id) as away_team,
  f.venue,
  f.venue_city,
  f.status,
  f.home_score,
  f.away_score,
  f.result,
  f.provider_fixture_id                               as external_id,
  f.finalised_at,
  f.created_at,
  f.updated_at
from fixtures f
where f.season_id = (
  select s.id from seasons s
  join competitions c on c.id = s.competition_id
  where c.slug = 'fifa-world-cup' and s.label = '2026'
);

-- Resolve a team name to an id, creating the team if it is unknown.
--
-- The auto-create branch is here for the test suite, which inserts fabricated
-- sides ('Testland', 'Mockovia') straight into `matches`. Real ingestion
-- resolves teams by provider id and never relies on this.
create or replace function compat_team_id(p_name text)
returns uuid as $$
declare
  v_id uuid;
  v_slug text;
begin
  if p_name is null or btrim(p_name) = '' then
    return null;
  end if;

  select id into v_id from teams
    where sport = 'football' and name = p_name limit 1;
  if v_id is not null then
    return v_id;
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')));
  insert into teams (sport, name, short_code, slug, country, provider)
  values ('football', p_name, upper(left(regexp_replace(p_name, '[^a-zA-Z]', '', 'g'), 3)),
          v_slug, p_name, 'api-football')
  on conflict (sport, slug) do nothing
  returning id into v_id;

  -- Lost the conflict race, or two names slugify alike: take the existing row.
  if v_id is null then
    select id into v_id from teams
      where sport = 'football' and slug = v_slug limit 1;
  end if;

  return v_id;
end;
$$ language plpgsql;

create or replace function matches_view_insert()
returns trigger as $$
declare
  v_season uuid;
begin
  select s.id into v_season from seasons s
    join competitions c on c.id = s.competition_id
    where c.slug = 'fifa-world-cup' and s.label = '2026';

  new.id     := coalesce(new.id, gen_random_uuid());
  new.status := coalesce(new.status, 'scheduled');

  insert into fixtures (
    id, season_id, stage, group_label, home_team_id, away_team_id,
    kickoff_utc, venue, venue_city, status, home_score, away_score,
    result, provider_fixture_id, code, finalised_at
  ) values (
    new.id, v_season, new.stage::text, new.group_letter::text,
    compat_team_id(new.home_team), compat_team_id(new.away_team),
    new.kickoff_utc, new.venue, new.venue_city, new.status,
    new.home_score, new.away_score, new.result,
    new.external_id, new.match_code, new.finalised_at
  )
  returning created_at, updated_at into new.created_at, new.updated_at;

  return new;   -- feeds RETURNING *, which .select().single() depends on
end;
$$ language plpgsql;

create or replace function matches_view_update()
returns trigger as $$
begin
  update fixtures set
    code                = new.match_code,
    kickoff_utc         = new.kickoff_utc,
    stage               = new.stage::text,
    group_label         = new.group_letter::text,
    home_team_id        = compat_team_id(new.home_team),
    away_team_id        = compat_team_id(new.away_team),
    venue               = new.venue,
    venue_city          = new.venue_city,
    status              = new.status,
    home_score          = new.home_score,
    away_score          = new.away_score,
    result              = new.result,
    provider_fixture_id = new.external_id,
    finalised_at        = new.finalised_at,
    updated_at          = now()
  where id = old.id
  returning updated_at into new.updated_at;

  return new;
end;
$$ language plpgsql;

create or replace function matches_view_delete()
returns trigger as $$
begin
  delete from fixtures where id = old.id;
  return old;
end;
$$ language plpgsql;

create trigger trg_matches_view_insert instead of insert on matches
  for each row execute function matches_view_insert();
create trigger trg_matches_view_update instead of update on matches
  for each row execute function matches_view_update();
create trigger trg_matches_view_delete instead of delete on matches
  for each row execute function matches_view_delete();

-- The dropped table's "matches_public_read" policy is replaced by the view's
-- own grants: a view runs with its owner's rights, so it reads fixtures
-- without being blocked by that table's RLS — the same public-read posture
-- World Cup data had before.
grant select on matches to anon, authenticated;
grant select, insert, update, delete on matches to service_role;

-- ============================================================
-- Step 8 — Final reconciliation. The view must show exactly what the table
-- showed, and no prediction may have been cut loose.
-- ============================================================
do $$
declare
  v_view int;
  v_fixtures int;
  v_orphans int;
  v_unbound int;
begin
  select count(*) into v_view from matches;
  select count(*) into v_fixtures from fixtures;
  if v_view <> v_fixtures then
    raise exception 'Aborting: matches view shows % row(s), fixtures holds %.', v_view, v_fixtures;
  end if;

  select count(*) into v_orphans
    from predictions p left join fixtures f on f.id = p.match_id
    where f.id is null;
  if v_orphans > 0 then
    raise exception 'Aborting: % orphaned prediction(s) after cutover.', v_orphans;
  end if;

  select count(*) into v_unbound from leagues where season_id is null;
  if v_unbound > 0 then
    raise exception 'Aborting: % league(s) left without a season.', v_unbound;
  end if;

  raise notice 'Cutover complete: % fixture(s), all predictions and leagues bound.', v_fixtures;
end $$;
