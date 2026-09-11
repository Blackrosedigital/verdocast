-- ============================================================
-- 0008_seed_pl_ucl_seasons
--
-- The Premier League and Champions League as competitions + 2026/27 seasons.
-- Reference data only: no teams and no fixtures, which come from API-Football
-- (see scripts/seed-season.ts) and cannot be seeded by hand.
--
-- Both seasons are marked 'active', which is what the season-aware ingestion
-- job polls on. Until fixtures land, polling an active season is a harmless
-- no-op.
--
-- The dates here are display metadata only — each fixture carries its own
-- authoritative kickoff from the provider, so a day's drift in a season
-- boundary changes nothing operationally.
--
-- provider_competition_id values are API-Football league ids: 39 = Premier
-- League, 2 = UEFA Champions League. provider_season_id is the season's
-- STARTING year, which is how API-Football labels cross-year seasons.
-- ============================================================

insert into competitions (sport, name, short_name, slug, kind, country, provider, provider_competition_id)
values
  ('football', 'Premier League',        'PL',  'premier-league',   'league', 'England', 'api-football', '39'),
  ('football', 'UEFA Champions League', 'UCL', 'champions-league', 'cup',    null,      'api-football', '2')
on conflict (slug) do nothing;

-- Premier League 2026/27: started 21 Aug 2026, ends 30 May 2027. 38 gameweeks,
-- so fixtures.matchday runs 1..38.
insert into seasons (competition_id, label, starts_on, ends_on, status, total_matchdays, provider_season_id)
select c.id, '2026/27', date '2026-08-21', date '2027-05-30', 'active', 38, '2026'
from competitions c where c.slug = 'premier-league'
on conflict (competition_id, label) do nothing;

-- Champions League 2026/27: Swiss-model league phase, matchday 1 played
-- 8-10 Sep 2026, matchday 2 on 13-14 Oct 2026 (the launch target).
--
-- total_matchdays = 8 covers the LEAGUE PHASE only; the knockout rounds that
-- follow carry stage values ('playoff', 'r16', ...) with a null matchday, the
-- same shape the World Cup backfill uses. ends_on is left null rather than
-- guessed — the 2027 final date is not confirmed here, and nothing depends on
-- it.
insert into seasons (competition_id, label, starts_on, ends_on, status, total_matchdays, provider_season_id)
select c.id, '2026/27', date '2026-09-08', null, 'active', 8, '2026'
from competitions c where c.slug = 'champions-league'
on conflict (competition_id, label) do nothing;

do $$
declare v_active int;
begin
  select count(*) into v_active from seasons where status = 'active';
  if v_active <> 2 then
    raise exception 'Expected exactly 2 active seasons after seeding, found %.', v_active;
  end if;
  raise notice 'Seeded Premier League and Champions League 2026/27 (both active, no fixtures yet).';
end $$;
