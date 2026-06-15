# Verdocast — Product Requirements Document

**Status:** Living reference · reflects the product as built and live.
**Last updated:** 15 Jun 2026.
**Owner:** Christopher Mensah (founder).
**Canonical architecture contract:** [`CLAUDE.md`](../CLAUDE.md) (authoritative for tech/architecture; this PRD covers product intent, journeys, and scope).

---

## 1. Summary

Verdocast turns a football tournament into a shared prediction game. For the **FIFA World Cup 2026** (11 Jun – 19 Jul 2026), anyone can create a free league, share one link, and have their office, friends, or community predict every match score and climb a live, auto-scored leaderboard.

One backend powers three pricing surfaces: **B2B office leagues**, a **consumer tournament pass**, and an **editorial subscription**. The launch wedge is **free group-stage play** (acquisition) with **knockout-stage monetization** (conversion).

**Brand voice:** confident, analytical, lightly editorial — *The Athletic, not DraftKings*. The name is *verdict* + *forecast*. Never gambling language.

---

## 2. Problem & opportunity

- Big tournaments are rare moments when a whole company/community cares about the same thing at once. That energy is usually wasted (ad-hoc spreadsheets, WhatsApp threads, paper sweepstakes).
- HR / People / Internal-Comms teams want low-effort culture wins, especially for hybrid/remote teams. Existing options are clunky, gambling-adjacent, or US-sportsbook-flavoured.
- Opportunity: a polished, inclusive, free-to-start prediction game that's effortless to run, works for non-football fans, and monetizes at the natural excitement spike (the knockouts).

---

## 3. Goals & non-goals

### Goals (v1, this tournament)
1. Let anyone create and run a league in minutes, free for the group stage.
2. Make predicting and following the leaderboard smooth, mobile-first, and inclusive.
3. Score automatically and reliably from live results.
4. Build a viral acquisition loop (share links, public standings, per-creator referral leagues).
5. Convert engaged leagues to paid at the knockout cutover (28 Jun).

### Non-goals (v1)
- Custom payment forms (Stripe Checkout/Portal only).
- Knockout-stage *predictions* with draw logic (see §13 v2).
- In-app cash prizes / pooled money (gambling-regulated — never custody funds).
- Multi-tournament support (single-tournament product).
- Native mobile apps; Slack/Teams integrations.

---

## 4. Users & personas

| Persona | Who | Primary jobs-to-be-done |
|---|---|---|
| **League admin (B2B)** | HR / People / Internal-Comms / office manager / EA | Create connection across a (often hybrid) team with near-zero effort; a visible culture win; inclusive of non-football people; no IT/procurement. |
| **Member / player** | Employee, friend, community member | Predict quickly, follow the leaderboard, banter, not miss matches. |
| **Consumer organiser** | Individual running a friends/community league | Same as admin but self-pays; no org behind them. |
| **Creator** | Football content creator with an audience | Run a branded league for their community; trackable referral. |
| **Platform admin** | Founder (christophermensah@gmail.com, christopher@emtech.com) | Operate the platform: stats, member data, moderation. |

---

## 5. Product pillars

1. **Effortless to run** — one link, no spreadsheets, automatic scoring.
2. **Everyone can play** — score predictions, not football trivia; non-fans win.
3. **Built for groups** — the leaderboard is the new watercooler; works for hybrid teams.
4. **Free to start, pay for the payoff** — group stage free; knockouts are the monetized moment.

---

## 6. Monetization

**Model:** freemium gated on the tournament phase. Group stage is **free for everyone**; the knockouts are the paid moment. Stripe is wired but **dormant during the free launch**; billing surfaces from **28 Jun (R32)**.

Recommended stream design (one backend, segmented motion):
- **B2B / office → admin-paid per-league knockout unlock**, priced by size (reuse `licenses.max_members` tiers). One buyer monetizes the whole team; players never pay → preserves the viral engine. **This is the primary revenue line.**
- **Consumer / creator leagues → £4.99 per-player knockout pass** (the tournament-pass surface) where there's no org to foot the bill.
- **Editorial £5/month** — separate lane, cross-sold but not conflated with the game unlock.
- **Sweepstake (proposed, free)** — a random-team allocation layer at the R16 cutover as a re-engagement/funnel feature; never paid (lottery law). Not yet built.

**Hard rule:** money is for *access to the game*, never a pooled prize.

See [`docs/marketing/office-b2b-playbook.md`](marketing/office-b2b-playbook.md) for the go-to-market detail.

---

## 7. Key user journeys

### 7.1 Admin (create → activate → convert)
1. **Create** — `/start` → magic-link/OTP/Google sign-in → name org + league → free league provisioned (org + free license + league + owner auto-added as a member). Redirects to the dashboard with a `?welcome=` celebration.
2. **Dashboard** (`/admin/league/[slug]`) — first-run **setup checklist** (create → predict → invite), live stats (members, prediction completion %, group matches), **knockout countdown** banner, top scorers, **invite** (copyable link + join code + one-click share message + invite-by-email), **members roster** (display names + prediction progress + remove; **emails are platform-admin only**), **nudge non-predictors** (batch reminder email), league **branding** (accent colour + logo).
3. **Multi-league** — `/admin` is a **leagues hub** listing every league the owner runs + "create another league" (shares the free license; each league independently capped).
4. **Convert** — at the 28 Jun cutover, billing surfaces (knockout unlock). *(Unlock flow is the next build.)*

### 7.2 Member (join → play → return)
1. **Join** — `/league/[code]/join` (public, branded). Two ways in: signed email invite (email locked) or general shared link (self-serve). Enter email + display name → joined → **auto signed-in server-side** (no email round-trip) → success screen → Predict / Leaderboard.
2. **Predict** — `/league/[code]/predict` — mobile-first grid grouped by date; **autosave** per score (debounced, with saving/saved/error feedback); locks at each kickoff; **progress bar**, first-visit **coach mark**, **all-caught-up** affirmation, **scoring legend**, **knockout countdown**, **self-service display-name** edit.
3. **Leaderboard** — `/league/[code]/leaderboard` — live (polls every 30s during live matches, 5 min otherwise), tap a player to see their predictions, "you're playing as" + share line, scoring legend.
4. **Member hub** — `/leagues` lists every league the member belongs to.
5. **Return** — logged-out access to a league page routes to `/login?next=…` and returns the member to where they were (not the marketing home).

### 7.3 Visitor / viral
- **Public standings** — `/league/[code]/standings` — no-auth, read-only, branded leaderboard with scoring legend + Join CTA. "I'm #3, beat me" shares point here.
- **SEO surface** — `/world-cup-2026` hub, 12 group pages (live tables + fixtures), 48 team pages (squads + details), all interlinked; `sitemap.ts`, `robots.ts`, OG images.
- **Global league** — `/play` (→ `/league/GLOBAL/join`), public league anyone can join; `?ref=` attribution for creators/channels.

---

## 8. Features (current state)

| Area | Capability | Status |
|---|---|---|
| Onboarding | Free league creation; magic-link/OTP/Google sign-in; owner auto-membership | Live |
| Predictions | Autosave grid, per-match kickoff lock (DB trigger + app), flags, local times | Live |
| Scoring | Pure engine, computed once on match `finished`; default 5/3/2/0 | Live |
| Results ingestion | API-Football via Vercel Cron (*/5) → `jobs/ingest-results` → scoring | Live |
| Leaderboard | Live polling, per-member drill-down, public standings | Live |
| Admin dashboard | Checklist, stats, roster, nudge, countdown, invite, branding | Live |
| Multi-league | Leagues hub + create-another (per-org) | Live |
| Invitations | Resend email (signed links) + shareable general link | Live |
| Branding | Per-league accent colour + logo (body + nav + join + standings) | Live |
| Growth | Per-creator branded leagues, `?ref=` referral tracking, share cards | Live |
| Marketing site | Landing (how-it-works, how-points-work, pricing, FAQ), WC2026 SEO pages | Live |
| Legal | Privacy + Terms pages | Live |
| Analytics/observability | PostHog + Sentry | Live |
| Billing | Stripe Checkout + webhook + Customer Portal | Wired, dormant |
| Knockout unlock flow | Paid gating of knockout features | **Planned (next)** |
| Knockout predictions | R32+ with draw logic | v2 |
| Sweepstake layer | Random-team allocation, free | Proposed |

---

## 9. Scoring rules (default)

Stored as JSONB on `leagues.scoring_rules` (per-league customisable in-DB; editor UI is post-launch). Defaults:

| Outcome | Points |
|---|---|
| Exact score | 5 |
| Correct goal difference (non-draws only) | 3 |
| Correct result (W/D/L), incl. wrong-score draw | 2 |
| Otherwise | 0 |

The goal-difference bonus excludes draws (every draw has GD 0). Logic lives in pure, 100%-tested `lib/scoring.ts`. The values surface in the UI from `DEFAULT_RULES` (single source of truth) on the landing page and as a collapsible legend on predict/leaderboard/standings.

---

## 10. Data model (canonical)

See `supabase/migrations/0001_initial.sql`. Core tables:

- **organizations** — a company/group; one Stripe customer; `owner_email` is the admin.
- **licenses** — a purchase/plan; `max_members` cap; `expires_at`. Free launch uses a £0 license.
- **leagues** — belongs to an org; unique `join_code` (e.g. `MIGHTY-LIONS`) and `(organization_id, slug)`; `brand_color`, `brand_logo_url`, `scoring_rules`, `is_demo`, soft-delete via `deleted_at`.
- **members** — people in a league, email-identified, unique `(league_id, email)`; `display_name`, `is_admin`, `referral_source`.
- **matches** — 104 tournament matches (group + knockout); `kickoff_utc`, `status`, scores.
- **predictions** — one member's score for one match, unique `(member, match)`; editable until kickoff; cached `points_earned`.

**Invariants:** predictions only before `kickoff_utc` (DB trigger + app); `points_earned` computed once on transition to `finished` (never recomputed on read); league size enforced **per league** against the license cap (trigger); member emails exposed only to platform admins.

---

## 11. Architecture (summary)

Next.js 15 App Router (RSC default, Server Actions for mutations), TypeScript strict. Supabase (Postgres + Auth + Realtime, RLS hardened, email-based policies + SECURITY DEFINER helpers; service-role admin client for trusted server paths). Stripe (Checkout + webhook as source of truth for license state). Resend (transactional email + custom SMTP). API-Football (live results). shadcn/ui + Tailwind with brand tokens. Zod at every boundary. PostHog + Sentry. Vitest (100% on `lib/scoring.ts`, `lib/tournament.ts`, `lib/standings.ts`) + Playwright happy path. Full detail in `CLAUDE.md`.

**API conventions:** prefer Server Actions; every action/route returns `{ ok: true, data } | { ok: false, error, code }`; auth via `requireUser()` (now supports sign-in-return `next`) / platform-admin via `isSuperAdmin()`.

---

## 12. Timeline (WC2026)

- **11 Jun** — tournament starts; group stage live (free).
- **~27 Jun** — group stage ends.
- **28 Jun** — knockouts (R32) begin → billing/knockout monetization surfaces.
- **19 Jul** — final.
- License grace: tournament end + 90 days.

---

## 13. Roadmap

**Shipped (v1):** everything in §8 marked Live — full free group-stage product, growth loop, SEO, admin + member journeys, public standings, multi-league.

**Near-term (pre/at 28 Jun):**
- Knockout unlock flow (admin-paid per-league; £4.99 consumer pass) — activates dormant Stripe.
- Conversion lifecycle emails (deadline/early-bird) per the B2B playbook.

**v2 / post-launch:**
- Knockout-stage predictions (R32+, needs draw logic).
- Sweepstake re-engagement layer (free).
- Custom scoring-rule editor UI; branding UI polish.
- Slack / Microsoft Teams integration; native apps.
- Multi-tournament support; tiebreakers (top scorer, cards); group-of-death/wildcard predictions.

---

## 14. Metrics / KPIs

Funnel (admin dashboard + `/admin/stats`): leagues created → **activation** (% leagues with ≥60% members predicting) → habit (predictions/member) → **knockout-unlock conversion** (north star) → retention (knockout-round return) → referral-attributed joins (`?ref=`).

Performance budgets: marketing TTFB <200ms / LCP <1.5s; predictions grid <100ms after data; leaderboard query <50ms p99 at 250 members.

---

## 15. Privacy, security, trust

- Magic-link/OTP/Google auth; no passwords. Email-only member identity.
- **Member emails are platform-admin-only** — league owners see display names + progress, never emails.
- No sensitive data logged at info level. No pooled prize money (not gambling).
- RLS on member-data tables; public reads limited to non-sensitive surfaces (matches, leaderboard standings = names + points only).
- Stripe webhook is the only writer of license state.

---

## 16. Open questions / risks

- **Knockout unlock pricing** (per-league tiers, early-bird, risk-reversal) — to finalise before 28 Jun.
- **Conversion timing** — the whole B2B model hinges on activating free leagues before the cutover.
- **Email deliverability** at scale for invites/nudges (Resend limits; nudge is batched at 100/run).
- **Sweepstake** — decide whether to build as the free re-engagement layer.
- **Data accuracy** — squads/fixtures sourced mid-tournament; spot-checks ongoing (e.g. the midnight-ET kickoff fix).
