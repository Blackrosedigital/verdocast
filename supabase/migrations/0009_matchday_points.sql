-- ============================================================
-- 0009_matchday_points
--
-- Per-member, per-matchday points. The season leaderboard sums these; the
-- "this matchday" leaderboard reads one row per member; cumulative totals and
-- position movement are derived from them in lib/league-standings.ts.
--
-- Aggregating in SQL rather than fetching raw predictions matters at the top
-- of the pricing tiers: a 250-member league across 38 gameweeks of 10 fixtures
-- is ~95,000 prediction rows, which is not something a page load should pull
-- across the wire to add up in JavaScript.
--
-- Only members who actually predicted appear here. Callers fill in zeros for
-- the rest of the roster — that keeps this view a straight aggregate rather
-- than a cross join against every member and every matchday.
--
-- `exact_scores` counts 5-point predictions, matching the existing
-- `leaderboard` view from 0001. Both are wrong for a league that has
-- customised `scoring_rules.exact` away from 5 (an Enterprise-tier lever, no
-- UI yet). Left consistent rather than silently different: when the scoring
-- rules editor ships, both need fixing together.
-- ============================================================

create or replace view matchday_points as
select
  mem.league_id,
  mem.id                                                        as member_id,
  mem.display_name,
  f.season_id,
  f.matchday,
  coalesce(sum(p.points_earned), 0)::int                        as points,
  count(p.id) filter (where p.points_earned is not null)::int   as scored,
  count(p.id) filter (where p.points_earned = 5)::int           as exact_scores,
  count(p.id)::int                                              as predictions
from members mem
join predictions p on p.member_id = mem.id
join fixtures f on f.id = p.match_id
where f.matchday is not null
group by mem.league_id, mem.id, mem.display_name, f.season_id, f.matchday;

-- Same posture as the `leaderboard` view and the compatibility `matches` view:
-- reads go through the service role, which the app uses for every standings
-- query after authorising the caller itself.
grant select on matchday_points to service_role;
