# Premier League launch — design & feature build plan

**Status:** build plan for the World-Cup → Premier-League pivot. Pairs with the architecture blueprint [`tech-foundation.md`](tech-foundation.md) (the competitions/seasons/fixtures model + phased migration) and the revenue thesis [`strategy-expansion.md`](strategy-expansion.md). The WC2026 tournament is complete (Spain champions), so we are clear to execute Phase 1+ of the migration.

**The reframe (read first):** the World Cup was *predict 72 games once, over a month*. The Premier League is *predict ~10 games every week, for 38 gameweeks, Aug → May*. The product must become a **weekly ritual**, not a one-time fill-in. Every design and feature call below serves the returning weekly user.

**Runway:** PL 2026/27 kicks off ~mid-August. That is ~1 month. So this plan has a hard **MVP cut line** (below) - launch a season product for Gameweek 1, then layer depth.

---

## What carries over vs what's net-new

| Carries over (reuse as-is) | Net-new to build |
|---|---|
| Pure scoring engine (`lib/scoring.ts`) | Competitions/seasons/**fixtures** data model (tech-foundation B2) |
| Leaderboard view + branding + admin | **Gameweek** prediction UX + navigation |
| Invites, nudges, referrals, magic-link auth | Weekly **deadline + reminder** loop |
| Join flow, public standings, blog | **Season-long** leaderboard + gameweek winners |
| **Match pages (line-ups/stats)** + predictions grid | Recurring **billing** (Stripe subscriptions) |
| API-Football ingestion (extend, don't rebuild) | Competition **picker** in `/start`; PL club design |

The engine is reusable; the lift is the season shape and the weekly loop.

---

## Phase 1 — Data & architecture foundation *(invisible, unblocks everything)*
Execute tech-foundation Phases 1-3 (additive, non-breaking; WC stays live as a compatibility view).
- **Migrate** `matches`/`predictions` → `competitions` + `seasons` + `teams` + `fixtures`; backfill WC as one competition/season.
- **Seed the Premier League:** competition + `2026/27` season + 20 clubs + 380 fixtures via API-Football (league id 39). `fixtures.matchday` = the gameweek.
- **Extend ingestion** to poll **per active season** (not a fixed tournament), idempotent upserts, gameweek-aware.
- **Bind leagues to a season** (`leagues.season_id`).
- *No visible UI yet - but nothing else can ship without this.*

## Phase 2 — The gameweek prediction experience *(the core product)*
**Features**
- Gameweek-scoped predict view: **Gameweek N** shows that week's ~10 fixtures.
- **Per-match lock** (predict each fixture until its own kickoff) - our engine already enforces this; it's more forgiving than a single weekly cut-off. Surface the **gameweek deadline** (first kickoff) as the nudge anchor + countdown.
- Gameweek **navigation**: GW1…38, prev/next, "jump to current", locked past weeks read-only with results.
- Auto-save + progress: "you've predicted 7/10 this gameweek."
- Fixture context: club form (WDL) and current league position beside each tie (from standings) - cheap credibility.

**Design**
- A **gameweek header**: GW number, date range, deadline countdown, your completion ring.
- Fixture rows use **club identity** (colour + name; crest treatment per the IP note below), not nation flags.
- Reuse `predictions-grid` grouped by gameweek; reuse the match page for each fixture (line-ups/stats already work).

## Phase 3 — Season-long leaderboards & engagement *(retention over 38 weeks)*
**Features**
- **Two leaderboard dimensions:** season (cumulative) and **this gameweek** (weekly winner).
- **Gameweek winner** recognition + position **movement** (up/down since last week).
- Light gamification: **streaks** (consecutive correct results), best gameweek, exact-score count, badges (reuse the WC gamification thinking in the PRD).
- **Mid-season joins** handled fairly (decision below).
- **The weekly ritual:** pre-deadline reminder ("Gameweek N locks Saturday 12:30") + a **gameweek recap** ("you scored 14, up 3 places") - email + on-site. This loop is what makes it a habit.

**Design**
- Season leaderboard with a "This gameweek" tab; movement arrows; a compact "your week" recap card.

## Phase 4 — Monetization for a season *(recurring, not one-off)*
**Features**
- **Stripe subscriptions** (tech-foundation B7): B2B **annual per-company** anchored to the season start; consumer **season pass**; retire one-off Checkout for the season motion.
- **Competition picker** in `/start` - create a *Premier League 2026/27* league.
- Keep the **free-to-play** consumer wedge (see decision 1) - monetise B2B + premium + sponsorship, not the core game.

**Design**
- Pricing page updated for season/subscription; the **"Free to play · No money · Not gambling"** trust line carries straight over (it's even more valuable year-round).

## Phase 5 — Differentiators *(post-launch, the moat)*
- **Slack / Teams integration** - gameweek reminders + results in-channel. The single clearest B2B differentiator (only one rival has it).
- **Rewards / sponsorship** per gameweek/season (the partner + creator-league plays we already built).
- **Add CL / Euros** once PL is proven (the model is now multi-competition).
- **White-label** (custom domain/branding per client) for high-ACV B2B.

---

## MVP cut line — what must ship for Gameweek 1
Ship this, defer the rest:
1. **Phase 1** data model + PL season + fixtures ingesting live. *(non-negotiable)*
2. **Phase 2** gameweek predict flow + per-match lock + gameweek navigation.
3. **Phase 3 (core only)** season + gameweek leaderboard; one weekly reminder email.
4. **Create-a-PL-league** (competition picker) + the existing join flow.

**Defer past GW1:** recurring-billing polish (launch free / one-off first), streaks/badges, gameweek recap emails, Slack/Teams, multi-competition, white-label. Depth can land across the early gameweeks - the season is long.

---

## Design-system changes (WC → PL)
- **Club-based identity:** 20 clubs, each a primary colour + name. The organising unit shifts from *group/knockout* to **gameweek**.
- **Optimise for the returning user:** default to the current gameweek, one-tap "predict this week", a "what changed since last week" recap. WC optimised for a one-time fill; PL optimises for a habit.
- **Denser, calmer weekly UI** - this is visited 38 times, not once.

## Product decisions to make (with my recommendation)
1. **Free vs paid for the consumer PL game** → **Recommend free-to-play the season**, monetise B2B subscription + premium perks + sponsorship. Consistent with the WC free pivot and the not-gambling/free wedge; free is how we out-acquire.
2. **Mid-season joins** → **Recommend cumulative-from-join for consumers, full-season (zeros before join) for office fairness**, with a "gameweeks played" normaliser shown. Pick per league type.
3. **Deadline model** → **Per-match lock** (already built) + a surfaced gameweek deadline for nudges. Don't build a hard single-cut-off.
4. **Crest / logo IP** → clubs' crests are trademarked. **Recommend club colours + names** (and provider logos only where licensing clearly permits); **never market data or badges as "official"** (per the licensing research).

---

## Sequenced timeline against the ~1-month runway
- **Weeks 1-2:** Phase 1 (data model + PL seed + ingestion). Highest risk, do first.
- **Week 3:** Phase 2 gameweek predict + navigation; Phase 3 core leaderboards.
- **Week 4:** create-a-PL-league + competition picker; reminder email; polish; soft-launch a **free consumer PL league** to the WC email list.
- **Post-GW1:** recurring billing + B2B annual subscription (the revenue pivot), then engagement depth, then Slack/Teams.

**Honest note:** the full multi-competition platform is more than a month solo. The plan front-loads the **data foundation** (irreversible if rushed) and ships a **free consumer PL season** for GW1 to convert the World Cup audience, with the **B2B subscription following within the first few gameweeks**. That protects the launch date without cutting the architecture corner.
