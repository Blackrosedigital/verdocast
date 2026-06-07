# PRS.md — Verdocast build sequence

Ten PRs in priority order. Each is one PR's worth of work (typically a half-day to a day for a focused engineer using Claude Code). Don't combine them; small PRs review faster and rebuild better.

Each PR has:
- **Goal** — one sentence.
- **Acceptance criteria** — how you know it's done.
- **Files** — what to expect to be created/changed.
- **Claude Code prompt** — paste this verbatim into Claude Code.

**MVP cut line is after PR 8.** That's the demoable product. PR 9–10 are required for taking paying customers.

---

## PR 1 — Repo scaffold & dependencies

**Goal:** A working Next.js 15 + TypeScript + Tailwind + shadcn/ui project that builds and deploys to Vercel.

**Acceptance criteria:**
- `pnpm install && pnpm dev` boots a Next.js app at `localhost:3000` showing a placeholder home page.
- TypeScript strict mode on, Vitest configured, Playwright configured.
- shadcn/ui initialised, with `button`, `input`, `card`, `dialog`, `toast` components installed.
- `.env.example` lists every env var the project will need (commented).
- `pnpm build` succeeds with zero errors.
- Vercel deploy works (Vercel link added to README).

**Files:** `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`, `playwright.config.ts`, `components.json`, `.env.example`, `.gitignore`.

**Claude Code prompt:**
> Scaffold a Next.js 15 App Router project with TypeScript strict mode at the repository root. Install Tailwind, shadcn/ui (initialise it and install `button`, `input`, `card`, `dialog`, `toast`), Vitest, Playwright, Zod, `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `resend`. Create `.env.example` with every variable we'll need (Supabase URL, anon key, service role key, Stripe publishable, secret, webhook secret, Resend API key, NEXT_PUBLIC_SITE_URL, API_FOOTBALL_KEY). Add a minimal `app/page.tsx` placeholder. Configure `pnpm` scripts: `dev`, `build`, `start`, `lint`, `test`, `e2e`. Read `CLAUDE.md` first and respect every convention in it.

---

## PR 2 — Database schema & Supabase wiring

**Goal:** The data model from `schema.sql` lives in Supabase, and the app can read/write through a typed Supabase client.

**Acceptance criteria:**
- Run `supabase/migrations/0001_initial.sql` on a fresh Supabase project — all tables, types, triggers, indexes, and the leaderboard view exist.
- `lib/db.ts` exports a server-side Supabase client using `@supabase/ssr` cookie-based auth.
- `lib/db-browser.ts` exports a browser client.
- `types/db.ts` generated via Supabase CLI (`supabase gen types typescript`).
- A `lib/db.test.ts` Vitest test that creates a row in each table and verifies the lockdown trigger blocks a post-kickoff prediction.

**Files:** `supabase/migrations/0001_initial.sql` (copy from `schema.sql`), `lib/db.ts`, `lib/db-browser.ts`, `types/db.ts`.

**Claude Code prompt:**
> Move the contents of `schema.sql` into `supabase/migrations/0001_initial.sql`. Create `lib/db.ts` (server-side Supabase client using `@supabase/ssr`) and `lib/db-browser.ts` (browser client). Generate TypeScript types into `types/db.ts` (assume `pnpm gen-types` runs `supabase gen types typescript --local`). Write Vitest tests in `lib/db.test.ts` that: (a) insert a fake organization, license, league, member, match; (b) confirm the `enforce_prediction_lockdown` trigger throws when inserting a prediction for a match whose `kickoff_utc` is in the past; (c) confirm the `enforce_member_cap` trigger throws when exceeding the license cap. Use a test schema with cleanup in `afterEach`.

---

## PR 3 — Tournament data seed

**Goal:** All 104 matches, 16 venues, and 48 teams from World Cup 2026 live in the database, ready to be predicted.

**Acceptance criteria:**
- `data/tournament-2026.json` contains every match (group + knockout), venue, team — sourced from the existing `wc2026.html` data.
- `supabase/seed.sql` (or a Node seed script `pnpm seed`) populates the `matches` table.
- All 72 group-stage matches have known `home_team` and `away_team`. The 32 knockout matches have `home_team = null`.
- Match `match_code` is unique and stable (e.g. `GROUP_A_1`, `GROUP_A_2`, … `R32_1`, `FINAL`).
- Add a `lib/tournament.ts` module with helpers: `getMatchesByStage`, `getMatchesByGroup`, `getMatchByCode`. 100% test coverage on these.

**Files:** `data/tournament-2026.json`, `scripts/seed.ts`, `lib/tournament.ts`, `lib/tournament.test.ts`.

**Claude Code prompt:**
> Read the existing `wc2026.html` file (paste it into context or read from disk). Extract every match (group and knockout), every venue, every team from the JS data. Write `data/tournament-2026.json` with this structure (you decide the shape, but it must include all 104 matches with match_code, kickoff_utc, stage, group_letter, home_team, away_team, venue, venue_city). Write a `scripts/seed.ts` script (using `tsx`) that connects with the Supabase service role key and inserts all matches if not already present (idempotent: skip on conflict). Add `pnpm seed` to package.json. Build `lib/tournament.ts` with pure helpers `getMatchesByStage(stage)`, `getMatchesByGroup(letter)`, `getMatchByCode(code)`. Write Vitest tests covering all helpers.

---

## PR 4 — Marketing site & pricing page

**Goal:** A pretty, fast, SSR'd marketing page that explains the product and a pricing page with three tiers wired to Stripe Checkout (test mode).

**Acceptance criteria:**
- `app/(marketing)/page.tsx`: hero, "how it works" 3-step, social proof placeholder, FAQ, CTA. SSR'd. Lighthouse score 95+ on performance.
- `app/(marketing)/pricing/page.tsx`: three tiers (Starter £199 / ≤50, Pro £499 / ≤250, Team £999 / ≤1,000) and an "Enterprise" contact tile (mailto).
- `lib/pricing.ts` is the single source of truth for tier definitions (id, name, price_pence, max_members, stripe_price_id, marketing_features[]).
- Clicking "Buy" hits a server action that creates a Stripe Checkout Session (test mode) and redirects to it.
- Stripe success URL goes to `/onboarding/[session_id]` (PR 5 fills this in; for now it just shows the session ID).

**Files:** `app/(marketing)/page.tsx`, `app/(marketing)/pricing/page.tsx`, `app/(marketing)/layout.tsx`, `lib/pricing.ts`, `lib/stripe.ts`, `app/api/stripe/checkout/route.ts`, `components/pricing-card.tsx`, `components/marketing/hero.tsx`, etc.

**Claude Code prompt:**
> Build the marketing surface under `app/(marketing)`. Landing page should have: hero ("Run your office's World Cup 2026 predictor in 5 minutes"), three-step how-it-works (Buy → Share link → Watch leaderboard), pricing summary, FAQ. The design should match the aesthetic of the existing `wc2026.html` (dark background, Bebas Neue display + body sans-serif, group-colour accents) — fonts via Google Fonts. Pricing page lists the three tiers from `lib/pricing.ts` plus an Enterprise contact tile. "Buy" buttons call a Server Action `startCheckout(tierId)` that creates a Stripe Checkout Session in payment mode (one-time payment) and returns the URL for client-side redirect. Success URL: `/onboarding/{CHECKOUT_SESSION_ID}`. Cancel URL: `/pricing?canceled=1`. Use test mode Stripe keys from env. Make sure marketing pages are server components and statically renderable. Include schema.org structured data for SEO.

---

## PR 5 — Onboarding: org + first league creation

**Goal:** After Stripe Checkout succeeds, the admin is walked through naming their organization, naming their first league, and getting a shareable join link.

**Acceptance criteria:**
- `/onboarding/[session_id]` reads the Stripe Checkout Session, extracts customer email and amount, creates an `organizations` row and a `licenses` row.
- Admin is then prompted: "What's your company called?" → "What should we call your league?" → done.
- A unique `join_code` like `MARKETING-LIONS` is generated (memorable adjective-noun, slugged).
- Admin sees a "Your league is ready" screen with the join URL (`/league/{join_code}/join`), a "Copy link" button, and a "Send invitations by email" CTA.
- An admin auth session is created (magic link sent to the Stripe email; for v1 they're auto-signed-in for 1h via Supabase admin auth).

**Files:** `app/(app)/onboarding/[session_id]/page.tsx`, `lib/onboarding.ts`, `lib/auth.ts`, `lib/join-codes.ts`.

**Claude Code prompt:**
> Build the post-checkout onboarding flow at `app/(app)/onboarding/[session_id]/page.tsx`. On load, the server component: (1) calls `stripe.checkout.sessions.retrieve(session_id)`; (2) validates payment_status === 'paid' (otherwise redirect to /pricing); (3) idempotently creates an `organizations` row (key off `stripe_customer_id`) and a `licenses` row (key off `stripe_session_id`); (4) signs the user in via Supabase using the customer email (admin user). Render a 2-step wizard: step 1 collects org name, step 2 collects first league name. On submit, create a `leagues` row with a generated `join_code` from `lib/join-codes.ts` (format: ADJECTIVE-NOUN, e.g. MIGHTY-LIONS, generated from word lists). On completion, redirect to `/admin/league/{slug}` with a toast showing the join URL.

---

## PR 6 — Email invitations via Resend

**Goal:** Admin can paste a list of employee emails (or upload a CSV) and the system sends each one a magic-link invitation to join the league.

**Acceptance criteria:**
- `/admin/league/[slug]/invite` page: a textarea ("Paste emails, one per line"), or drag-drop CSV.
- On submit, for each email, send a Resend email with subject "{Org} World Cup 2026 Predictor — you're invited" and a link to `/league/{join_code}/join?email={email}` (signed with HMAC so emails can't be spoofed).
- The clicked link auto-fills email and prompts for display name → creates a member row → starts a magic-link auth session.
- `lib/email.ts` has typed senders: `sendInvitation(to, leagueName, joinUrl)`. Templates are React Email (via `@react-email/components`) compiled to HTML.
- Resend webhook (`/api/email/webhook`) marks delivered/bounced status (optional for v1 — log only).

**Files:** `app/(app)/admin/league/[slug]/invite/page.tsx`, `lib/email.ts`, `emails/invitation.tsx`, `lib/sign-url.ts`, `app/league/[code]/join/page.tsx`.

**Claude Code prompt:**
> Build the invitation flow. Admin page `app/(app)/admin/league/[slug]/invite/page.tsx` accepts a list of emails (textarea, one per line; also support CSV paste). On submit, server action `sendInvitations(leagueId, emails[])` validates: caller is the league admin, count + current members ≤ license cap. For each email, generate a signed join URL using HMAC (secret in env var `JOIN_LINK_SECRET`) so emails can't be tampered with: `/league/{join_code}/join?email={email}&sig={hmac}`. Use Resend (typed sender `sendInvitation` in `lib/email.ts`) with a React Email template at `emails/invitation.tsx`. The join page validates the signature, prompts for a display name, creates a `members` row, then sends a Supabase magic link for ongoing auth. Show clear error if signature invalid or cap reached.

---

## PR 7 — Predictions UI

**Goal:** A logged-in league member sees every group-stage match and can submit/edit a predicted score for each, with kickoff lockdown.

**Acceptance criteria:**
- `/league/[code]/predict` shows all 72 group-stage matches grouped by day.
- Each match has two `<input type="number">` boxes for home/away.
- Locked matches (kickoff passed) show the actual final score and the user's points earned, greyed out.
- Submitting saves via a Server Action `submitPrediction(matchId, homeScore, awayScore)`. Optimistic update; revert + toast on error.
- Visual indicator per match: "saved" / "saving…" / "locked".
- Mobile-friendly (matches the wc2026.html responsive patterns).
- A "your progress" pill at top: "23 / 72 predictions made".

**Files:** `app/(app)/league/[code]/predict/page.tsx`, `components/predictions-grid.tsx`, `components/prediction-row.tsx`, `lib/predictions.ts`.

**Claude Code prompt:**
> Build the predictions UI at `app/(app)/league/[code]/predict/page.tsx`. Server component fetches all group-stage matches and the current member's predictions in two parallel queries. Render via a client component `components/predictions-grid.tsx`. Each row has team names, kickoff time, two score inputs. If `kickoff_utc < now()`, the row is locked: show actual score (if finished), and the user's prediction with points earned. Saving is via a Server Action `submitPrediction({matchId, homeScore, awayScore})` — debounce 500ms, optimistic UI, toast on error. Visual states: idle / saving / saved (green dot) / locked / error. Group matches by day with sticky day headers. Show "X of 72 predictions" badge at top. Style to match the existing `wc2026.html` aesthetic.

---

## PR 8 — Scoring engine & live results ingestion

**Goal:** When a match finishes, predictions for that match are scored automatically and the leaderboard updates.

**Acceptance criteria:**
- `lib/scoring.ts` is a pure module with one function: `scorePrediction({predicted, actual, rules})` → `number`. 100% test coverage including edge cases (0-0, 1-1 exact, correct GD wrong score, etc).
- `jobs/ingest-results.ts` polls API-Football for tournament fixtures, updates `matches` rows whose external_id matches.
- When a match status transitions to `finished` for the first time, a Postgres function (or app-level trigger) computes `points_earned` for every prediction on that match.
- `/api/ingest/results` endpoint authenticated via a cron secret (env var `CRON_SECRET`). Vercel Cron hits it every 5 minutes during the tournament.
- The leaderboard view returns correct totals.

**Files:** `lib/scoring.ts`, `lib/scoring.test.ts`, `jobs/ingest-results.ts`, `app/api/ingest/results/route.ts`, `vercel.json` (cron config).

**Claude Code prompt:**
> Build the scoring + ingestion pipeline. (1) `lib/scoring.ts` exports `scorePrediction({predicted: {h,a}, actual: {h,a}, rules: {exact, goal_diff, result}}) -> number`. Rules: exact match → exact points. Same goal diff (but not exact) AND not 0-0 vs 1-1 case → goal_diff points. Same result (W/D/L) but different score and different goal diff → result points. Otherwise 0. Write `lib/scoring.test.ts` with at least 12 cases covering every branch. (2) `jobs/ingest-results.ts` connects to API-Football, fetches the 2026 World Cup fixtures, and for each fixture matches it by date + teams to a row in our `matches` table (you'll need to populate `external_id` on first run). Update `status`, `home_score`, `away_score`, `result`, `finalised_at`. (3) When a match transitions to `finished` (status was not `finished` before, is now), compute `points_earned` for every prediction on that match using `scorePrediction`. (4) Expose this as `app/api/ingest/results/route.ts` (POST). Validate `Authorization: Bearer ${CRON_SECRET}`. (5) Add Vercel cron config in `vercel.json` to call this every 5 minutes between 2026-06-11 and 2026-07-19.

---

## ━━━━━━━━━━ MVP CUT LINE ━━━━━━━━━━

**After PR 8 you have a working demo.** You can show a prospect: a marketing page, pricing, simulated checkout (use Stripe test mode), an admin creating a league, an employee predicting matches, scoring working when match results are entered (manually for the demo). That's enough to close cold-outreach sales for the tournament window.

PRs 9 and 10 are required before taking real paying customers.

---

## PR 9 — Leaderboard, admin dashboard, and RLS hardening

**Goal:** Members see a live leaderboard. Admins see league health (signups, predictions, top scorers). Database access is properly secured.

**Acceptance criteria:**
- `/league/[code]/leaderboard` — fetched via the `leaderboard` view, rank, name, points, exact-scores count. Polls every 30s during a live match window, every 5min otherwise.
- Each row clickable → drawer showing that member's predictions vs actuals.
- `/admin/league/[slug]` dashboard: members joined (X / cap), predictions submitted, top 5 leaderboard, "Invite more" CTA.
- Row-Level Security policies on `members`, `predictions`, `leagues`: a member can only see members + predictions in leagues they belong to. An admin can see everything in their org's leagues. Server actions use service role; client-side fetches use anon key + RLS.
- Add tests for RLS via Supabase's local dev tooling.

**Files:** `app/(app)/league/[code]/leaderboard/page.tsx`, `app/(app)/admin/league/[slug]/page.tsx`, `components/leaderboard.tsx`, `supabase/migrations/0002_rls.sql`.

**Claude Code prompt:**
> Build the leaderboard at `app/(app)/league/[code]/leaderboard/page.tsx` querying the `leaderboard` view, ordered by total_points desc then exact_scores desc. Render via a client component that polls every 30 seconds when a match is currently live (use `getMatchesLive()`), 5 minutes otherwise. Each row clickable opens a drawer showing the member's predictions for every group-stage match, with actual results side-by-side. Build the admin dashboard at `app/(app)/admin/league/[slug]/page.tsx` showing member count vs cap, prediction-completion percentage, top 5 by points, and link to invite page. Add `supabase/migrations/0002_rls.sql` with RLS policies: members can SELECT from their own leagues; admins can SELECT/UPDATE in their org's leagues. Document policy logic with comments. Add Vitest tests for RLS using Supabase's `auth.uid()` switching.

---

## PR 10 — Stripe webhook, customer portal, polish

**Goal:** Stripe webhooks are the source of truth for license state. Admins can manage their billing. Live-mode keys work end-to-end.

**Acceptance criteria:**
- `/api/stripe/webhook` handles `checkout.session.completed`, `customer.subscription.deleted`, `charge.refunded` (refund → soft-delete the league). Verifies signatures.
- `/admin/billing` redirects to Stripe Customer Portal for invoice download and refund requests.
- A simple `app/(marketing)/demo/page.tsx` public demo league (`is_demo = true`) anyone can play without signing up — used in sales pitches.
- Sentry wired up. PostHog wired up. Both behind cookie consent.
- README has a "deploy to production" runbook: domain, env vars, Stripe live mode, Vercel cron, monitoring.
- One Playwright end-to-end test: buy → onboard → invite self → predict → score → see leaderboard.

**Files:** `app/api/stripe/webhook/route.ts`, `app/(app)/admin/billing/page.tsx`, `app/(marketing)/demo/page.tsx`, `lib/observability.ts`, `e2e/happy-path.spec.ts`, `docs/runbook.md`.

**Claude Code prompt:**
> Finalise the product. (1) `app/api/stripe/webhook/route.ts` verifies signature using `STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed` (idempotently create org+license — match PR 5 logic), `charge.refunded` (set `licenses.expires_at = now()` and soft-delete the league via a `deleted_at` column — add it via migration), and logs unhandled events. (2) Add `/admin/billing` that calls `stripe.billingPortal.sessions.create` and redirects. (3) Create a public demo league (`is_demo = true` seeded in migration 0003) and a `/demo` page that lets anonymous users predict the first 4 group matches against demo data — used as a sales hook. (4) Wire Sentry (`@sentry/nextjs`) and PostHog (`posthog-js`) both with cookie consent (use shadcn's banner pattern). (5) Write a Playwright e2e in `e2e/happy-path.spec.ts` covering: Stripe Checkout test card → onboarding → invite self → join → predict 1 match → admin marks match finished via test helper → score appears on leaderboard. (6) Write `docs/runbook.md` with the production checklist: custom domain, Stripe live keys swap, webhook URL configuration, Vercel cron activation, Sentry/PostHog projects, customer support email forwarder.

---

## What's NOT in these 10 PRs (do not let scope creep here)

- Knockout-stage predictions (post-launch)
- League branding / logo upload UI (DB columns exist; UI is v2)
- Custom scoring rules UI (Enterprise tier hand-tuned via DB for now)
- Slack/Teams notifications
- Native mobile apps
- Push notifications (browser only via existing PWA pattern)
- Tiebreakers on top scorer / yellow cards
- Multi-tournament support

Each of these is a tempting "just one more thing" that will eat days you don't have.

## Suggested daily rhythm

- **Day 1 (Mon):** PR 1 + 2
- **Day 2 (Tue):** PR 3 + 4
- **Day 3 (Wed):** PR 5 + 6
- **Day 4 (Thu):** PR 7
- **Day 5 (Fri):** PR 8 → **start cold outreach this evening**, you have a demo
- **Day 6–7 (weekend):** PR 9
- **Day 8 (Mon):** PR 10 + polish
- **Day 9–10:** Bug fixes from first paying customers
- **Day 11–17:** Sales push, support, scoring rules tweaks based on real customer requests

Sales is what determines whether this works, not engineering. After PR 8, every hour spent on cold outreach beats every hour spent on code.
