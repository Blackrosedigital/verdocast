# CLAUDE.md

This file is the architectural contract for the Verdocast codebase. Claude Code reads it on every task. Keep it accurate; when you change the architecture, update this file in the same PR.

> **Product reference:** [`docs/PRD.md`](docs/PRD.md) covers product intent, personas, user journeys, monetization, and roadmap. This file stays authoritative for tech/architecture; the PRD defers to it on those.

## Product

**Verdocast** is a football prediction league product: companies and groups run branded leagues, members predict scores, a leaderboard tracks them.

It began as a single World Cup 2026 tournament product and is now **multi-competition and season-shaped**. That shift is the single most important thing to understand about this codebase — see [`docs/season-launch-plan.md`](docs/season-launch-plan.md).

- **Live competitions:** Premier League 2026/27 (38 gameweeks) and UEFA Champions League 2026/27 (8 league-phase matchdays, then knockout). The World Cup 2026 is complete and preserved as historical data.
- **The shape that matters:** the World Cup was *predict 72 games once*. A league season is *predict ~10 games every week for 38 weeks*. Everything is built for the returning weekly user — default to the current matchday, per-matchday leaderboards, a weekly reminder.
- **Mid-season entry is the normal state, not an edge case.** A league scores from its own `start_matchday`, not from matchday 1. A company buying in February gets a fair league starting in February.
- Primary customer: HR / People / Internal-Comms manager. Consumer leagues are free to play; monetisation is B2B, premium and sponsorship.
- Brand voice: confident, analytical, slightly editorial. Closer to The Athletic than to DraftKings. The name is *verdict* + *forecast*: decisive prediction.

## Tech stack (locked for v1)

- **Next.js 15** App Router, server components by default, client components only when needed for interactivity. TypeScript strict mode.
- **Supabase** for Postgres + Auth (magic links) + Realtime. Use the `@supabase/ssr` package for cookie-based auth on server components.
- **Stripe** for payments. Always use Stripe Checkout (hosted) and Stripe Customer Portal. Never build custom payment forms.
- **Resend** for transactional email via the `resend` npm package.
- **shadcn/ui** + Tailwind for components. Install components on demand via the shadcn CLI; don't manually write what shadcn provides.
- **Zod** for runtime validation at every API boundary.
- **PostHog** for product analytics, **Sentry** for error tracking.
- **API-Football** (`api-football.com`) for fixtures and live results. Paid Pro plan — flat cost regardless of how many competitions are added, which is why it was standardised on.

## Brand tokens

CSS variables to wire up early (`app/globals.css`):

```css
:root {
  --bg: #0a0b0d;
  --surface: #14161a;
  --surface-2: #1c1f24;
  --border: #2a2d33;
  --text: #f5f3ee;
  --text-muted: #8a8d93;
  --accent: #e6ff3d;       /* lime — primary CTA */
  --accent-2: #ff3b6a;     /* hot pink — live / urgent */
  --gold: #d4a045;          /* knockout / final */
}
```

Fonts via Google Fonts: **Bebas Neue** (display), **Archivo** (body), **JetBrains Mono** (numbers/times). Carry through from the WC2026 HTML companion if you need a visual reference.

## Folder structure

```
app/
  (marketing)/          # Unauthenticated marketing surface
    page.tsx            # Landing
    pricing/page.tsx    # Pricing tiers
    layout.tsx
  (app)/                # Authenticated surfaces
    admin/              # Admin (license owner) dashboard
    league/[slug]/      # League member surfaces
    layout.tsx
  api/                  # API routes (use sparingly; prefer Server Actions)
    stripe/             # Checkout session creation + webhook
    ingest/             # Cron-hit endpoints for results ingestion
  layout.tsx
  globals.css
lib/
  db.ts                 # Supabase server client (for server components)
  db-browser.ts         # Supabase browser client
  stripe.ts             # Stripe SDK client
  email.ts              # Resend client + typed senders
  scoring.ts            # Pure scoring logic — no I/O
  tournament.ts         # Pure tournament data helpers
  auth.ts               # getUser, requireUser, requireAdmin
  pricing.ts            # Single source of truth for tier definitions
components/
  ui/                   # shadcn/ui components
  predictions-grid.tsx
  leaderboard.tsx
  ...
jobs/
  ingest-results.ts            # Polls API-Football per ACTIVE SEASON
  send-matchday-reminders.ts   # The weekly nudge
data/
  tournament-2026.json  # World Cup source data; teams now live in the DB
scripts/
  db-push.mjs                  # Applies migrations (no Supabase CLI here)
  seed-season.mjs              # Pulls a season's teams + fixtures
  create-season-league.mjs     # Makes a league from the CLI
supabase/
  migrations/           # SQL migrations (numbered, append-only)
types/
  db.ts                 # Hand-maintained: no local Supabase to generate from
```

Key season modules: `lib/season.ts` (pure matchday logic), `lib/matchday.ts` (predict view), `lib/league-standings.ts` (pure ranking + movement), `lib/reminders.ts` (who to email), `lib/competitions.ts` (what's joinable).

## Data model (canonical)

Migrations are numbered and append-only in `supabase/migrations/`, applied with `pnpm db:push`. The multi-competition model landed in 0006–0010.

- **competitions** — a timeless competition (Premier League, UEFA Champions League, FIFA World Cup). Carries the provider's league id.
- **seasons** — a concrete edition (`2026/27`). `status` of `active` is what the ingestion job and the competition picker read; nothing is hardcoded per competition.
- **teams** — clubs and national sides. Rendered as **colour + name**; crests are trademarked, so `crest_url` is stored but not displayed.
- **fixtures** — one row per fixture. `matchday` is the gameweek (PL 1–38) or league-phase matchday (UCL 1–8), and is null for knockout ties and every World Cup fixture. `stage` is text, not an enum, because one column carries league seasons, the Swiss league phase and knockout rounds alike.
- **organizations / licenses / leagues / members** — unchanged, except `leagues.season_id` and `leagues.start_matchday`.
- **predictions** — one member's predicted score for one fixture. **The column is still named `match_id`** and points at `fixtures(id)`; renaming it would touch every call site at once, so it rides along when those move.
- **matchday_points** — view, per member per matchday. Feeds both leaderboards.
- **matchday_reminders** — one row per reminder sent. Its unique constraint is the double-send guard.

> **`matches` is a VIEW, not a table.** Migration 0007 moved the World Cup into `fixtures` and left `matches` behind as a compatibility view over the World Cup season, writable through `INSTEAD OF` triggers. It is a temporary shim for the World Cup read paths and the tests that write to it. **Build nothing new on it** — new code reads `fixtures`. Fixture ids were preserved from match ids, so the two are interchangeable for World Cup rows.

### Critical invariants
- A `member` can only predict fixtures before `kickoff_utc`. Enforced in a Postgres trigger AND in application code.
- A prediction is only valid for a fixture in the league's own season, at or after the league's `start_matchday`. Checked server-side — the client chooses the fixture id and cannot be trusted with it.
- **Points are only earned from `start_matchday` onward.** Earlier fixtures are visible, read-only and score nothing. Enforced where points are written (`lib/results.ts`) and again when standings are built.
- A prediction outside the league's window is left **null**, not zero: "outside your window" is a different fact from "you scored nothing".
- `points_earned` is computed once, when a fixture transitions to `finished`. Never recompute on read. Ingestion will *not* retroactively score a fixture it missed — that repair is explicit, never a side effect of polling.
- A `league` cannot have more than its license's `max_members` members. Enforce on insert.

## Jobs

- **`jobs/ingest-results.ts`** — polls API-Football per **active season** (never a hardcoded competition), matching fixtures by `provider_fixture_id`. Inserts fixtures it doesn't have yet, which is how the UCL knockout bracket arrives after the January draw. Cron: every 5 minutes.
- **`jobs/send-matchday-reminders.ts`** — one reminder per member per matchday, in the 24h before it locks. Cron: hourly. Supports `?dry=1`.
- **`scripts/seed-season.mjs`** — pulls a season's teams and fixtures from the provider. Idempotent.
- **`lib/provider-football.ts`** — shared round/status/score mapping, so the seeder and the ingest job cannot drift. Note the trap it guards: the provider calls the August *qualifying* play-off `"Play-offs"` and February's *knockout* play-off `"Knockout Round Play-offs"`.

## Scoring rules (default)

| Outcome | Points |
|---|---|
| Exact score | 5 |
| Correct goal difference (not 0-0 vs 1-1 etc.) | 3 |
| Correct result (W/D/L) only | 2 |
| No points | 0 |

Stored as JSONB in `leagues.scoring_rules` so Enterprise customers can be customised in-DB. UI for editing rules is post-launch.

## API conventions

- **Prefer Server Actions over API routes** for in-app mutations. Use Zod for input validation. Always pass through `requireUser()` / `requireAdmin()`.
- **API routes only for:** Stripe webhooks, cron endpoints, public unauthenticated endpoints (like the demo league).
- **Every Server Action and API route returns** `{ ok: true, data: T } | { ok: false, error: string, code: string }`. Never throw raw errors back to the client.
- **Stripe webhook** is the source of truth for license state. Don't update license rows from anywhere else.

## Authentication

- Members and admins use **Supabase magic links**. No passwords.
- The first email used to pay via Stripe Checkout becomes the org's admin (stored on `organizations.owner_email`).
- A user can be the admin of one or many orgs (cross-organization membership not in v1).

## Things to never do

1. **Never** build custom payment forms. Stripe Checkout only.
2. **Never** allow a prediction write after kickoff. Both DB trigger and app code.
3. **Never** trust the `max_members` cap from the client. Always check against the license in `requireOrgMember()`.
4. **Never** log sensitive data (emails, Stripe IDs) at info level. Use `logger.debug`.
5. **Never** introduce a new dependency without updating `package.json` in the same PR and noting why in the PR description.
6. **Never** use `any` in TypeScript. Use `unknown` and narrow.
7. **Never** make the scoring logic asynchronous. `lib/scoring.ts` is pure functions, easily testable.
8. **Never** commit secrets. `.env.example` only.

## Testing

- **Vitest** for unit tests. `lib/scoring.ts` and `lib/tournament.ts` MUST have 100% test coverage. The same bar applies to the pure season modules — `lib/season.ts`, `lib/league-standings.ts`, `lib/reminders.ts` — where a bug is a member shown points they never earned, or emailed at the wrong time.
- DB-backed tests hit a **real** database via the service role. They create their own throwaway competition/season/fixtures rather than touching the seeded PL/UCL data, and must tear down in an order that respects `ON DELETE RESTRICT` on `fixtures.home_team_id` — competitions (cascading to fixtures) before teams.
- **Playwright** for one end-to-end happy path: admin buys license → creates league → invites member → member predicts → match scored → leaderboard updates.
- Skip "perfect" test coverage elsewhere. Pre-launch this is a speed game.

## Performance budgets

- Marketing pages: TTFB < 200ms, LCP < 1.5s.
- Predictions grid renders < 100ms after data arrives.
- Leaderboard polling: every 30s during a live match, every 5min otherwise.
- Postgres queries on the leaderboard view: < 50ms p99 for a league of 250 members.

## Current state

The mid-season launch MVP is complete: multi-competition data model, matchday predict view, season + matchday leaderboards, matchday reminder email, competition picker. Target is **Champions League matchday 2, 13 October 2026**.

## What is explicitly deferred

- Streaks, badges, and the post-matchday recap email
- Custom scoring rule editor UI — note `matchday_points.exact_scores` and the `leaderboard` view both hardcode 5 points for an exact score, so they need fixing together when it ships
- League branding UI (DB columns exist)
- Slack / Microsoft Teams integration — the clearest B2B differentiator
- Recurring billing (Stripe subscriptions, season-anchored). Launch is free to play
- White-label, native apps, multi-sport

## When in doubt

Default to: **whatever serves the returning weekly user.** This is a season-long product now — something visited 38 times, not filled in once. Ask whether a change makes the weekly loop better; that is the thing retention rests on.
