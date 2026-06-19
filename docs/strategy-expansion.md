# Verdocast — Expansion Strategy (beyond the World Cup)

**Status:** Strategy reference, grounded in market research (Jun 2026). Pairs with [`docs/PRD.md`](PRD.md) (product) and [`docs/marketing/office-b2b-playbook.md`](marketing/office-b2b-playbook.md) (GTM).
**Thesis in one line:** the World Cup is the *wedge*; the business is a **year-round, multi-competition, workplace-first** prediction platform on **recurring revenue**.

> Figures below are tagged with confidence. **High** = official/primary source; **Medium** = analyst/secondary; **Soft** = dated or vendor-reported. Sources listed in §7.

---

## 1. The opportunity

The same engine (predict scores → auto-score from live results → leaderboards → branded private leagues) works for any competition with a fixture list. The strategic move is turning a one-month spike into a **season-long, recurring** product.

**Demand is enormous (the acquisition pool):**
- **FPL: 11.5M+ participants (2024/25 record, growing)** — High. Massive proven appetite for season-long football games.
- **Premier League: 1.9bn followers worldwide; 1.45bn live viewers** — High.

**The B2B category is real and growing (the money):**
- **Employee-engagement software ≈ $1.2bn (2024) → $3.26bn (2034), ~10% CAGR** — Medium (IMARC).
- **~46,000 UK firms with 50+ employees** (37,800 medium [50–249] + 8,250 large [250+]) — High (gov.uk BPE 2024). ~1.4M of 5.5M UK businesses have employees, so SMEs (10–49) are a large secondary pool.

**Recurring B2B subscription is a proven model here:**
- **Kicktipp's company predictor: €9.90–€999.90 / month** (recurring) — High. Direct evidence a year-round workplace predictor monetises on subscription.

---

## 2. Competitive landscape

Two tiers (all scale figures vendor-reported unless noted).

### Tier 1 — large free incumbents (the structural threat)
- **Superbru** — free, non-gambling score predictor; ~2.85M cumulative users since 2006 (only **>1.5M registered verified, 2018** — Soft), 862M predictions, 80+ tournaments/12 sports year-round. Monetises ads/sponsorship/referrals + **Premium £2.99/mo or £33.48/yr** (convenience, no pay-to-win). B2B = "Megapools" (co-branded section *inside* superbru.com, not standalone white-label). Workplace = a soft, free feature.
- **Kicktipp** — DACH market leader, ~1.3M MAU (Germany, 2016 — Soft); year-round multi-competition; free up to 300 players; ad-free ~€4.99/yr; **sells a white-label company predictor (€9.90–€999.90/mo)** with logo/custom rules/embed.
- **FPL** — 11.5M+ players, but a **different mechanic** (squad management, not score prediction) and consumer-only. Context/competitor for attention, not a direct substitute.

### Tier 2 — direct B2B rivals (mostly one-off WC2026)
| Competitor | Pricing | Note |
|---|---|---|
| **Sweepup** | one-time £49 / £99 / £199 / custom | Near-identical to Verdocast; HR-first; white-label at Pro |
| **Office World Cup** | one-time £0 / £49 / £129 / £399 | **Slack + Google Chat** integration |
| **Football-Predictor.net** | £10–£15 / user (per-seat) | True white-label; internal + customer sites |
| **Convert** (acq. Riddle) | quote-based to 20,000+ | Most established white-label; 200+ brands (Daimler/Toyota/Tefal); employee-engagement + marketing |

**Key insight:** the dedicated HR-first rivals are **one-off World Cup products** likely to fade after July; the year-round incumbents treat workplace as an afterthought. That leaves a real gap.

---

## 3. Positioning & differentiation

**Don't compete as "another predictor"** (Superbru/Kicktipp/FPL own free consumer). Position as the **workplace engagement platform that happens to use prediction** — sold to HR/People, recurring, branded.

Four defensible edges:
1. **Year-round / multi-competition** — PL season + CL + Euros + tournaments, so a workplace never has a dead month. (Direct rivals are seasonal one-offs.)
2. **HR-first product depth** — admin dashboards, invites, nudges, rosters, prizes, multi-league, branding (largely built). The incumbents' workplace UX is thin.
3. **True white-label** — custom branding/domain per client (Convert/Football-Predictor charge for this; the bigger incumbents don't really offer it).
4. **Non-gambling, workplace-safe** — a *feature*: sells where betting can't, and is the trustworthy choice for HR.

Obvious near-term gaps to seize: **Slack/Teams integration** (only Office World Cup has it) and a genuinely **HR-grade** experience.

---

## 4. Revenue model & pricing (benchmarked)

Center of gravity = **recurring B2B subscription**. One-off office-predictor pricing is already commoditising (£49–£399 flat, even a free tier), so anchor on annual value, not per-tournament fees.

| Stream | Model | Benchmark / rationale |
|---|---|---|
| **B2B subscription (core)** | Annual per-company, tiered by size; unlimited competitions | Kicktipp proves recurring (€10–€1,000/mo); reuse `licenses.max_members` tiers |
| **Per-seat / white-label (high ACV)** | £10–£15/user or quote-based enterprise | Football-Predictor £10–15/user; Convert quote-based |
| **Consumer premium / season pass** | Cheap convenience sub | Superbru £2.99/mo–£33.48/yr; Kicktipp ~€5/yr |
| **Sponsorship / branded prizes** | Brand funds prize/competition | Ties to the rewards mechanic (PRD §7); high margin |
| **Editorial subscription** | £5/mo content + predictions | Differentiates on voice |

Avoid the race to the bottom on one-off flat fees; lead with the annual, multi-competition subscription.

---

## 5. Product/tech foundation required

The engine is reusable; the lift is **generalising one tournament → many competitions** (the CLAUDE.md "explicitly v2: multi-tournament" item):
- A **`competitions`** model (PL season, CL, Euros…), fixtures per competition, leagues bound to a competition (today `matches` = the 104 WC games).
- **Season-long mechanics** — gameweeks, ongoing leaderboards, mid-season joins, monthly/round prizes.
- **Recurring billing** — Stripe *subscriptions* (today: one-off Checkout).
- **Slack/Teams integration** (net-new; a clear differentiator).
- Data ingestion already generalises — API-Football covers all these competitions (cost scales with calls).

Everything else (scoring, leaderboards, branding, admin, referrals, public standings, blog, rewards) carries over.

---

## 6. Sequenced roadmap

1. **Now (WC2026):** land-grab + build the email list + prove the model.
2. **Aug 2026 (PL kickoff):** convert that audience into **season-long Premier League leagues**; launch the **B2B annual subscription**. *This is the spike→recurring pivot.*
3. **Layer CL/Euros** + sponsorship inventory.
4. **White-label + Slack/Teams + other sports** once the recurring core is proven.

### Illustrative B2B TAM sketch (UK, not a forecast)
~46,000 UK firms (50+ staff) × a ~£250–£1,000/yr ACV. At 1% penetration ≈ 460 firms × ~£500 ≈ **~£230k ARR**; at 5% ≈ **~£1.15M ARR** — before SMEs, consumer, sponsorship, or white-label, and inside a market growing ~10%/yr.

---

## 7. Risks & sources

**Risks:**
- **Free incumbents** (Superbru, Kicktipp, FPL) already offer free workplace/social play — can't win on "free predictor"; win on HR depth, white-label, year-round, non-gambling.
- **Commoditised one-off pricing** (£49–£399) anchors buyer expectations — counter with recurring annual value.
- **Seasonality** — mitigated precisely by going multi-competition/year-round.
- **Data costs** scale with competitions/calls (API-Football paid tier).

**Open / still-unverified:** incumbents' *current UK MAU*; UK per-head team-building budgets; a clean fan-engagement-platform market size. Revisit before finalising forecasts.

**Key sources:** Premier League Annual Report 24/25 & FPL stats (High); gov.uk Business Population Estimates 2024 (High); IMARC employee-engagement software market (Medium); Kicktipp / Superbru / Sweepup / Office World Cup / Football-Predictor.net / Convert vendor pages (pricing High, scale Soft); Deloitte sports/digital-media outlooks (Medium). Full cited research in the workflow task outputs.
