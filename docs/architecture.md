# Verdocast — Architecture

Branded diagram (regenerate with `node scripts/gen-architecture.mjs`):

![Verdocast system architecture](../public/architecture.png)

Live: https://verdocast.com/architecture.png · vector: [architecture.svg](./architecture.svg)

## How it hangs together

- **Next.js 15 (App Router) on Vercel** is the whole app:
  - **Marketing** pages are static (fast, SEO/OG cards): `/`, `/pricing`, `/demo`, `/privacy`, `/terms`.
  - **App pages** are dynamic React Server Components: `/start`, `/onboarding/[session]`, `/admin*`, `/league/[code]/predict`, `/league/[code]/leaderboard`, `/login`.
  - **Server Actions** do the mutations (Zod-validated, service-role DB access): `createFreeLeague`, `startCheckout`, `completeOnboarding`, `sendInvitations`, `joinLeague`, `submitPrediction`, `getLeaderboard`.
  - **Route handlers + Cron**: `/api/stripe/webhook` (license source of truth), `/api/ingest/results` (live scoring), `/auth/callback`, `/auth/signout`; Vercel Cron hits ingest every 5 min.
- **Supabase** is Postgres (the data model + `leaderboard` view + RLS + triggers) and Auth (magic link, email OTP, Google OAuth; custom SMTP via Resend).
- **External services**: Stripe (Checkout + webhooks), Resend (email + auth SMTP), API-Football (live results), Google (OAuth), PostHog (consent-gated analytics).

## Key flows

- Browser ⇄ Next.js over HTTPS; Server Actions/RSC ⇄ Postgres with the service role (RLS is defense-in-depth).
- Stripe `checkout.session.completed` / `charge.refunded` → webhook → license state.
- Cron `*/5` → ingest job → API-Football → on a match finishing, the pure scoring engine writes `points_earned` → leaderboard.
- Auth via Google or email OTP; auth + invitation emails send through Resend.

## Mermaid source

```mermaid
flowchart TB
  U["Users — Browser<br/>visitors · admins · members"]

  subgraph V["Vercel · Next.js 15 (App Router) + Cron"]
    M["Marketing (static)<br/>/ · /pricing · /demo · /privacy · /terms"]
    A["App pages (RSC)<br/>/start · /onboarding · /admin · /league predict + leaderboard"]
    SA["Server Actions<br/>createFreeLeague · startCheckout · sendInvitations<br/>joinLeague · submitPrediction · getLeaderboard"]
    R["Route handlers + Cron<br/>/api/stripe/webhook · /api/ingest/results<br/>/auth/callback · cron */5"]
  end

  subgraph SB["Supabase"]
    PG[("Postgres<br/>orgs · licenses · leagues · members<br/>matches · predictions · leaderboard view · RLS")]
    AU["Auth<br/>magic link · email OTP · Google OAuth"]
  end

  ST["Stripe<br/>Checkout + webhooks"]
  RS["Resend<br/>email + auth SMTP"]
  AF["API-Football<br/>live results"]
  GO["Google OAuth"]
  PH["PostHog<br/>analytics (consent)"]

  U -->|HTTPS| V
  U -->|OAuth / OTP| AU
  U -.->|consent| PH
  A --> PG
  SA -->|service role| PG
  SA --> ST
  SA --> RS
  AU --> RS
  AU --> GO
  ST -->|webhook| R
  R <-->|cron poll| AF
  R -->|auto-score| PG

  classDef brand fill:#14161a,stroke:#2a2d33,color:#f5f3ee;
  classDef ext fill:#1c1f24,stroke:#3a3d44,color:#f5f3ee;
  class U,M,A,SA,R,PG,AU brand;
  class ST,RS,AF,GO,PH ext;
```
