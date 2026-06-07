# CLAUDE.md

This file is the architectural contract for the Verdocast codebase. Claude Code reads it on every task. Keep it accurate; when you change the architecture, update this file in the same PR.

## Product

**Verdocast** is a B2B SaaS that lets companies run World Cup 2026 prediction leagues for their employees, with a consumer tournament pass and an editorial subscription riding the same backend.

- Primary customer: HR / People / Internal-Comms manager. They pay once for the tournament, share a join link, employees predict the 72 group-stage matches, a leaderboard tracks scores.
- Tournament dates: 11 June – 19 July 2026.
- Brand voice: confident, analytical, slightly editorial. Closer to The Athletic than to DraftKings. The name is *verdict* + *forecast*: decisive prediction.
- The product evolves three pricing surfaces from one backend: B2B office leagues, a £4.99 consumer tournament pass, and a £5/month editorial subscription.

## Tech stack (locked for v1)

- **Next.js 15** App Router, server components by default, client components only when needed for interactivity. TypeScript strict mode.
- **Supabase** for Postgres + Auth (magic links) + Realtime. Use the `@supabase/ssr` package for cookie-based auth on server components.
- **Stripe** for payments. Always use Stripe Checkout (hosted) and Stripe Customer Portal. Never build custom payment forms.
- **Resend** for transactional email via the `resend` npm package.
- **shadcn/ui** + Tailwind for components. Install components on demand via the shadcn CLI; don't manually write what shadcn provides.
- **Zod** for runtime validation at every API boundary.
- **PostHog** for product analytics, **Sentry** for error tracking.
- **API-Football** (`api-football.com`) for live results during the tournament. Free tier for development, paid tier (~£30/mo) before tournament starts.

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
  ingest-results.ts     # Polls API-Football, writes match results
  score-predictions.ts  # Runs after a match finishes
data/
  tournament-2026.json  # Static tournament data
supabase/
  migrations/           # SQL migrations (numbered, append-only)
  seed.sql              # Tournament data seed
types/
  index.ts              # Shared TypeScript types
```

## Data model (canonical)

See `supabase/migrations/0001_initial.sql` (from `schema.sql`). Tables:

- **organizations** — a company that bought a license. Has one Stripe customer.
- **licenses** — a Stripe purchase. Tier defines `max_members` cap. Has `expires_at` (= tournament end + 90 day grace).
- **leagues** — an org can have multiple leagues. Each has a unique `join_code` like `MIGHTY-LIONS`.
- **members** — employees, identified by email. Unique per league.
- **matches** — the 104 tournament matches (group stage in v1; knockouts stored but predictions disabled).
- **predictions** — one member's predicted score for one match. Unique (member, match). Editable until kickoff.
- **scores** — derived, cached on the prediction row as `points_earned`.

### Critical invariants
- A `member` can only predict matches before `kickoff_utc`.
- `points_earned` is computed once and only once, when match `status` transitions to `finished`. Never recompute on read.
- A `league` cannot have more than its license's `max_members` members. Enforce on insert.
- A `prediction` cannot be created/updated after the match's `kickoff_utc`. Enforce in a Postgres trigger AND in application code.

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

- **Vitest** for unit tests. `lib/scoring.ts` and `lib/tournament.ts` MUST have 100% test coverage.
- **Playwright** for one end-to-end happy path: admin buys license → creates league → invites member → member predicts → match scored → leaderboard updates.
- Skip "perfect" test coverage elsewhere. Pre-launch this is a speed game.

## Performance budgets

- Marketing pages: TTFB < 200ms, LCP < 1.5s.
- Predictions grid renders < 100ms after data arrives.
- Leaderboard polling: every 30s during a live match, every 5min otherwise.
- Postgres queries on the leaderboard view: < 50ms p99 for a league of 250 members.

## What ships in v1 (MVP cut line)

After PR 8 you have a working demo. After PR 10 you have a sellable product. Anything past PR 10 is post-launch.

## What is explicitly v2

- Knockout-stage predictions (R32 onward; needs draw logic)
- Custom scoring rule editor UI
- League branding (logo upload, custom colour) UI (DB columns exist; UI is post-launch)
- Slack / Microsoft Teams integration
- Native mobile apps
- Multi-tournament support (this is a single-tournament product)
- Top-scorer / yellow-card tiebreakers
- Group-of-Death / "wildcard" predictions

## When in doubt

Default to: **whatever ships fastest while not boxing us in for v2.** This is a 17-day sprint, not a 6-month project.
