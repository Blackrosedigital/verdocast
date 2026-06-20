# Verdocast — Technical Foundation & Multi-Competition Design

**Status:** Research capture (verified, Jun 2026) + **design pass** for the multi-competition expansion. The design here is **proposed, not yet implemented** — it's the blueprint for the year-round build described in [`docs/strategy-expansion.md`](strategy-expansion.md). Architecture contract remains [`CLAUDE.md`](../CLAUDE.md).

Confidence tags: **High** = official/primary source; **Medium** = analyst/secondary; **Soft** = dated/indirect.

---

# Part A — Researched foundation

## A1. Sports data provider

| Provider | Coverage | Live | Pricing | Notes |
|---|---|---|---|---|
| **API-Football** (api-sports.io) | 1,200+ leagues/cups | ~15s refresh | Free 100/day · Pro **$19** (7.5k/day) · Ultra **$29** (75k) · Mega **$39** (150k) — **flat, no overage** | **Recommended.** Already in use. Sibling APIs (NBA/NFL/etc.) for multi-sport. *(Medium — official pages 403'd; verified via third-party.)* |
| **Sportmonks** | 2,300+ leagues, **gated per-league** | <15s | €29 (5 leagues) / €99 (30) / €249 (120) / Enterprise | PL/CL/Euros not bundled → multi-competition pushes to €99–€249. *(High)* |
| **football-data.org** | 12 free comps (incl. WC/Euros) | Free tier **delayed**; live ≥€12/mo | €12 / €49 / €99 / €199 | Cheap tournament-only; weak year-round. *(High)* |

**Decision: standardise on API-Football.** Flat **$39/mo (Mega)** covers unlimited competitions year-round with no overage — decisive vs Sportmonks' per-league gating — and means **no migration** (it's the current provider). Re-evaluate Sportmonks/Opta only if richer data depth (xG, detailed events) becomes a product need.

### Licensing (High/Medium)
- **Football DataCo** (owned by the Premier League + EFL) controls *official* UK fixture/stat IP.
- **Refuted (0-3):** that PL live data is locked to a single exclusive distributor — commercial **aggregator APIs legally resell PL/CL data**, so there's no exclusivity blocker.
- **Actions:** source via the aggregator API (already do); **never market data as "official"**; ignore the £266/£3,931 figures online — those are *newspaper fixture-list printing fees*, not API costs.

## A2. Scaling (Supabase) — High
- **Realtime quotas:** Free 200 connections / 2M msgs/mo (100 msg/s); Pro/Team 500→10,000 connections / 5M msgs/mo (500–2,500 msg/s); overage **$2.50/1M msgs, $10/1k connections**.
- **Pattern:** keep the **polling baseline** (30s live / 5min idle, per CLAUDE.md budgets); add **Realtime only in live-match windows** to cap message/connection cost.

## A3. Recurring billing (Stripe) — High
- Four models: flat / **per-seat** / tiered / usage. Per-seat = subscription `quantity` (linear N×, auto-prorated).
- Proration configurable: `create_prorations` (default) / `none` / `always_invoice`.
- **Season anchoring:** `billing_cycle_anchor_config` (e.g. `month=8, day_of_month=1`) pins annual plans to a season start — leap-year safe.

---

# Part B — Design pass: multi-competition data model

## B1. Where we are today

Single-tournament schema (`schema.sql`): `matches` *is* the World Cup (104 rows; WC-specific `match_stage` enum, `group_letter`, **team names as TEXT**, `external_id` for API-Football). `predictions.match_id → matches`. `leagues` have **no competition binding** (the WC is implicit). Teams live in static JSON (`data/tournament-2026.json`), not the DB. Leaderboard is a SQL `view`.

This is perfect for one tournament and the wrong shape for many. The generalisation below is **additive and non-breaking** so the live WC2026 product is never disturbed.

## B2. Target model

New/changed tables (DDL sketches — **design, not migrations**):

```
-- A timeless competition. sport enables multi-sport later.
competitions (
  id uuid pk, sport text not null default 'football',   -- football|nfl|cricket|f1
  name text not null,                                   -- 'Premier League', 'FIFA World Cup'
  kind text not null,                                   -- 'league' | 'cup' | 'tournament'
  country text, logo_url text,
  provider text not null default 'api-football',
  provider_competition_id text,                         -- API-Football league id
  unique(provider, provider_competition_id)
)

-- A concrete edition a league predicts.
seasons (
  id uuid pk, competition_id uuid -> competitions,
  label text not null,                                  -- '2026/27' | '2026'
  starts_on date, ends_on date,
  status text not null default 'upcoming',              -- upcoming|active|complete
  provider_season_id text,
  unique(competition_id, label)
)

-- Teams promoted from static JSON to a table (national + club).
teams (
  id uuid pk, sport text not null default 'football',
  name text not null, short_code text, flag_or_crest_url text,
  slug text, provider_team_id text,
  unique(provider, provider_team_id)
)

-- Generalises matches. One row per fixture in a season.
fixtures (
  id uuid pk, season_id uuid -> seasons,
  stage text not null,            -- 'group'|'r16'|...|'regular' (league)|'playoff'
  matchday int,                   -- gameweek/round number (league seasons)
  group_label text,               -- 'A'..'L' or null
  home_team_id uuid -> teams null,  away_team_id uuid -> teams null,  -- null until drawn
  matchup text,                   -- bracket placeholder ('Winner R16-1') pre-draw
  home_source_fixture_id uuid -> fixtures null,  away_source_fixture_id uuid -> fixtures null,
  kickoff_utc timestamptz not null, venue text, venue_city text,
  status text not null default 'scheduled',  -- scheduled|live|finished|postponed
  home_score int, away_score int, result char(1),
  provider_fixture_id text unique, finalised_at timestamptz,
  unique(season_id, stage, matchday, home_team_id, away_team_id)
)

leagues  -> add: season_id uuid -> seasons   -- the edition this league predicts
predictions -> change: match_id  ->  fixture_id uuid -> fixtures

-- Cached standings (scale path; replaces the live view when needed).
league_standings (
  league_id uuid, member_id uuid,
  total_points int, exact_scores int, matches_scored int, total_predictions int,
  updated_at timestamptz, primary key (league_id, member_id)
)
```

Unchanged & reused as-is: `organizations`, `members`, `scoring_rules` (per-league JSONB), `lib/scoring.ts` (pure), the prediction-lockdown + member-cap triggers (re-pointed at `fixtures`).

## B3. Knockouts & gameweeks
- **Knockout brackets:** keep team ids null until the draw, with a `matchup` placeholder for display and optional `home_source_fixture_id` / `away_source_fixture_id` to wire the bracket (winner-of feeds next round). Resolve team ids when results/draws land. (Generalises today's WC `matchup` text.)
- **League gameweeks:** `fixtures.matchday` is the gameweek; per-gameweek leaderboards = aggregate predictions joined to fixtures by `matchday`. Cumulative is the default; per-gameweek is an added view/dimension.

## B4. Migration plan (phased, non-breaking)

- **Phase 0 — now (do nothing):** WC2026 runs on `matches`/`predictions`. Never refactor mid-tournament.
- **Phase 1 — additive (post-final):** create `competitions`, `seasons`, `teams`, `fixtures` (empty). Backfill one competition (`FIFA World Cup`) + season (`2026`) + teams (from `data/tournament-2026.json`) + copy `matches → fixtures` (map stage/group, resolve team text → `team_id`, carry `external_id → provider_fixture_id`).
- **Phase 2 — repoint:** backfill `predictions.fixture_id` from the match→fixture map; add the FK; **keep `matches` as a compatibility VIEW over `fixtures`** (filtered to the WC season) so existing match-based code keeps working during cutover. Add `leagues.season_id`, default existing leagues to the WC season.
- **Phase 3 — first new competition:** create `Premier League` competition + `2026/27` season, ingest fixtures via API-Football, allow league creation bound to a season (the `/start` flow gains a competition picker).
- **Phase 4 — recurring billing + scale:** Stripe subscriptions (B5), `league_standings` cache (B6) when scale warrants.

All DB changes go via numbered migrations applied in the Supabase SQL Editor (the local service-role key is stale, so writes go through the editor).

## B5. Live ingestion & reconciliation
- A cron (extend `jobs/ingest-results`) polls API-Football **per active season** (those with `status='active'`), not a fixed tournament. Map each provider fixture by `provider_fixture_id` and **upsert idempotently** (write only on change).
- **Status machine:** `scheduled → live → finished`; `postponed` updates `kickoff_utc` + status (which re-opens the prediction window via the existing lockdown trigger).
- **Scoring:** unchanged — pure `lib/scoring.ts`, points computed once when a fixture transitions to `finished`, cached on the prediction.
- **Corrections (new path):** if a *finished* result later changes (rare provider correction), re-run scoring for that fixture's predictions and adjust standings. Requires relaxing "compute once" to "compute once, plus re-score on correction" — guard with `finalised_at`/a `scored_at` marker so normal runs never double-apply.

## B6. Leaderboard scaling
- **Now / small leagues:** keep the SQL `leaderboard` view (well under the 50ms p99 budget for typical sizes).
- **At scale:** maintain `league_standings` **incrementally** — when a fixture finalises, update only the affected members' totals (delta = their `points_earned` for that fixture), O(predictions-for-that-fixture), not a full recompute. Index `(league_id, total_points desc)`.
- **Realtime:** polling baseline + Supabase Realtime broadcast of standings deltas during live windows only (cost-controlled per A2).

## B7. Recurring billing design
- **Stripe subscriptions** replace one-off Checkout for the year-round B2B motion (keep one-off for single-tournament passes):
  - **B2B per-seat:** subscription `quantity` = league seats (maps to `licenses.max_members`); proration on mid-season seat changes (config: charge now vs next cycle).
  - **Season-anchored annual:** `billing_cycle_anchor_config` to the season start (PL ≈ 1 Aug).
  - **Consumer:** flat tournament pass (one-off) or season pass (annual).
  - **Editorial:** flat-rate £5/mo.
- **Schema:** extend `licenses` (or add `subscriptions`) with `stripe_subscription_id`, `status`, `current_period_end`, `billing_type` (one_off | subscription). **Stripe webhook stays the only writer of billing state** (CLAUDE.md).

---

## Risks, cost drivers & open questions
- **Data cost stays flat** on API-Football regardless of competitions added (vs per-league elsewhere) — the main reason to standardise there.
- **Realtime overage** if standings are over-broadcast — gate to live windows.
- **Multi-sport scoring** differs (F1 isn't score-prediction) — `scoring_rules` will need per-sport rule *types*, not just point values. Out of scope until football multi-competition is proven.
- **Open (web-unverifiable, need a design decision):** exact bracket-resolution mechanics; whether a single league can span multiple competitions (a "season pass" meta-league) vs one season per league; cross-sport provider cost comparison.

## Sources & confidence
API-Football / Sportmonks / football-data.org pricing pages (pricing **High** except API-Football **Medium**); Wikipedia *Football DataCo* + SportsPro (licensing **Medium**); Supabase Realtime docs (**High**); Stripe billing docs — pricing-models, quantities, prorations, billing-cycle (**High**). Full cited research in the workflow task outputs. The Part B design is **first-party engineering design**, grounded in the current `schema.sql`, not a web finding.
