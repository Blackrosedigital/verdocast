# Verdocast — Starter

**Forecast every match. Settle every debate.**

A B2B SaaS that lets companies run branded World Cup 2026 prediction leagues for their employees, with a consumer tournament pass and an editorial layer riding the same data.

## TL;DR

- **Customer (primary):** HR / People / Internal-Comms manager at a 50–5,000-person company who wants tournament engagement without building it.
- **Product:** Self-serve setup — pay, get a shareable join link, employees predict every match, live leaderboard, admin dashboard.
- **Pricing (B2B):** Starter £199 (≤50), Pro £499 (≤250), Team £999 (≤1,000), Enterprise from £2,500.
- **Pricing (consumer):** Tournament Pass £4.99 one-time.
- **Pricing (editorial):** £5/month or £25 for the tournament.
- **Window to launch:** Tournament starts **11 June 2026**. Today is 25 May. **17 days.**

## The name

**Verdocast** = *verdict* + *forecast / broadcast*. Decisive prediction. The brand voice is **confident, analytical, slightly editorial** — the way a sharp football pundit reads the game on a Sunday morning. Not bro-y. Not bookmaker-y. Closer to The Athletic than to DraftKings.

Brand colours (carry over from the WC2026 HTML companion that started this project):
- Background: `#0a0b0d`
- Accent: `#e6ff3d` (lime — primary CTA, predictions)
- Accent 2: `#ff3b6a` (hot pink — live / urgent)
- Gold: `#d4a045` (knockout / final)

Typography:
- Display: **Bebas Neue** (condensed, broadcast feel)
- Body: **Archivo** (clean, neutral, legible)
- Numbers / times: **JetBrains Mono** (tabular)

Tagline candidates to A/B-test on the marketing page:
- "Forecast every match. Settle every debate."
- "Your verdict on every match."
- "Predictions, made decisive."
- "The office World Cup tournament, sorted in five minutes."

## How to use this starter

1. Read `CLAUDE.md` end to end. It's the architecture brief Claude Code reads on every task — keep it accurate.
2. Read `PRS.md`. Your build sequence. Ten PRs, ordered. The MVP cut line is after PR 8.
3. Run `schema.sql` against a fresh Supabase Postgres instance.
4. Open the repo in Claude Code. For each PR, paste its prompt verbatim. Don't combine PRs.
5. After PR 8 you can demo. After PR 10 you can ship paid customers.

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR for marketing SEO + API routes |
| Language | TypeScript (strict) | Type safety keeps Claude Code accurate |
| DB | Supabase Postgres | Free tier sufficient, includes auth + realtime |
| Auth | Supabase magic links | No password UI to build |
| Payments | Stripe Checkout + Customer Portal | Zero PCI work |
| Email | Resend | Modern, simple, cheap |
| UI | Tailwind + shadcn/ui | Fastest path to polished UI |
| Hosting | Vercel | Native Next.js, free tier OK at launch |
| Analytics | PostHog | Product analytics + session replay free tier |
| Errors | Sentry | Free hobby tier |
| Live data | API-Football (free tier first, paid £30/mo at launch) | Cheaper than Sportradar for MVP |

Total infra cost to launch: **£0–£50/month**. Stripe takes 1.5% + 20p per transaction.

## Things this starter explicitly does NOT build

- Knockout bracket predictions (group stage only in v1; add post-launch)
- Tiebreakers like top scorer / yellow cards (post-launch)
- Native mobile apps (PWA only)
- Real-time websockets (polling every 30s during matches is plenty)
- Custom scoring rules UI (sensible defaults; override via DB for Enterprise tier)
- Internationalisation
- Two-sided marketplace mechanics

## Money path

1. PR 1–3: foundation. No demos yet.
2. PR 4–6: marketing site live, Stripe live in test mode, can show prospects a wireframe.
3. PR 7–8: a working demo league. Start cold outreach.
4. PR 9–10: paid customer onboarding works end to end.

Cold-outreach script, target-list criteria, demo runbook → in `docs/sales-playbook.md` (ask me to scope this next).
