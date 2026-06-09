# Production runbook

How to take Verdocast from the dev project to a live, paid-customer deployment.

## 1. Database (Supabase)

1. Create a production Supabase project (or promote the current one).
2. Apply migrations in order against the prod database:
   - `supabase/migrations/0001_initial.sql`
   - `supabase/migrations/0002_prediction_lockdown.sql`
   - `supabase/migrations/0003_rls.sql`
   - `supabase/migrations/0004_refunds.sql`
   Use `pnpm db:push` (needs a working `DATABASE_URL`) or paste each file into the SQL Editor.
3. Seed tournament matches: `pnpm seed` (uses the service-role key).
4. Confirm RLS is enabled on all tables and the policies from `0003` exist.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Set every key from `.env.example` for the Production environment:

- `NEXT_PUBLIC_SITE_URL` = your production domain (e.g. `https://verdocast.com`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (live: `sk_live_…`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`), `STRIPE_WEBHOOK_SECRET` (from step 4)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (from a verified domain)
- `JOIN_LINK_SECRET`, `CRON_SECRET` (each `openssl rand -hex 32`)
- `API_FOOTBALL_KEY` (paid tier before the tournament)
- `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (optional)

## 3. Stripe (live mode)

1. Switch the dashboard to **live mode**; copy live keys into Vercel.
2. (Optional) Create a Product/Price per tier and set `STRIPE_PRICE_STARTER/_PRO/_TEAM`; otherwise checkout uses inline pricing from `lib/pricing.ts`.
3. **Webhook**: add an endpoint `https://<domain>/api/stripe/webhook` subscribed to `checkout.session.completed` and `charge.refunded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Enable the **Customer Portal** (Settings → Billing → Customer portal) so `/admin/billing` works.

## 4. Resend (email)

1. Verify your sending domain; set `RESEND_FROM_EMAIL` to an address on it.
2. (Optional) Point Supabase Auth SMTP at Resend so magic-link emails send reliably and aren't rate-limited.

## 5. Vercel deploy

1. Import the repo, framework auto-detected (Next.js).
2. Deploy; map the custom domain; set `NEXT_PUBLIC_SITE_URL` to match.
3. **Cron**: `vercel.json` registers `/api/ingest/results` every 5 minutes. Every-5-min crons require a **Pro** plan. Vercel injects `CRON_SECRET` as a Bearer automatically.
4. Update `NEXT_PUBLIC_SITE_URL` and Supabase Auth → URL Configuration → Redirect URLs to include `https://<domain>/**` (for magic-link `/auth/callback`).

## 6. Observability

- **PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`. Analytics only initialise after cookie consent (see `components/analytics/cookie-consent.tsx`).
- **Sentry**: `lib/observability.ts#captureException` is the single call site. To enable, `pnpm add @sentry/nextjs`, run the wizard (adds `instrumentation.ts` + wraps `next.config`), set `SENTRY_DSN`, and forward from `captureException`.

## 7. Smoke test (live)

1. `/` and `/pricing` load fast; `/demo` is interactive.
2. Buy a tier with a real card (or live test) → onboarding → admin dashboard.
3. Invite yourself → join → predict.
4. Trigger `checkout.session.completed` is handled (org/license exist).
5. `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/ingest/results` returns a summary.
6. Refund a charge in Stripe → license expires, league soft-deleted.

## 8. Pre-tournament checklist (before 11 June 2026)

- Switch `API_FOOTBALL_KEY` to the paid tier.
- Verify `jobs/ingest-results.ts` team-name matching against live API fixtures; fix aliases as needed.
- Confirm cron is firing and scoring populates `points_earned` after the first finished match.
