# Mid-season launch — Premier League + Champions League

**Status:** active build plan. Supersedes the July "Premier League launch" plan, which assumed we would ship for PL Gameweek 1 in mid-August. We didn't — the repo has been untouched since 21 July. This re-cut treats **mid-season entry as the product's normal state**, not a patch, and covers **two competitions**: the Premier League and the Champions League.

Pairs with the architecture blueprint [`tech-foundation.md`](tech-foundation.md) (competitions/seasons/fixtures model + phased migration) and the revenue thesis [`strategy-expansion.md`](strategy-expansion.md). [`CLAUDE.md`](../CLAUDE.md) stays authoritative for tech.

---

## Where the calendar actually puts us

Today is **11 September 2026**.

| | Status on 11 Sep 2026 | What's left |
|---|---|---|
| **Premier League 2026/27** | Started 21 Aug. ~3 gameweeks played of 38. | **~35 gameweeks**, through 30 May 2027 |
| **Champions League 2026/27** | League phase **Matchday 1 played 8–10 Sep**. 1 of 8 done. | **7 league-phase matchdays + the entire knockout**, through the final |

**The Champions League is the launch vehicle.** Users who join now have missed exactly one matchday out of eight, and the whole knockout phase — where our existing bracket is a finished, reusable asset — is ahead. The Premier League is the *retention* engine: a weekly ritual with 35 gameweeks of runway, but a competition you're visibly late to.

### The launch date

**Champions League Matchday 2 — 13–14 October 2026.** That is the hard target: ~4.5 weeks from today. MD2 is the last moment we can pitch "join before matchday 2" and have it mean something; after that the story degrades every matchday.

PL rides along at launch (create-a-PL-league works, gameweeks are live), but UCL MD2 is what the launch is aimed at and what the acquisition push sells.

---

## What mid-season changes vs the July plan

Five things, and the first one is structural:

1. **A league's season starts when the league starts.** Not at GW1. This is the core mechanic (see below) and it makes mid-season entry correct by design rather than an apology.
2. **Mid-season joins move from "deferred decision" to MVP.** Every single user at launch is a mid-season joiner. It cannot be a v2 edge case.
3. **Past results are context, not score.** We ingest and display completed fixtures for form, standings and match pages — they never enter anyone's points total.
4. **The knockout bracket is a bigger carry-over than we credited.** UCL knockout playoffs → R16 → QF → SF → final is the same shape as the WC tree we already built and debugged. `home_source_fixture_id` / `away_source_fixture_id` in the target model wire it directly.
5. **Two competitions from day one, not PL-then-maybe-CL.** The data model was always multi-competition; launching both proves it immediately and gives UCL-only users a reason to stay (PL) and PL-only users a reason to come back (UCL knockouts).

---

## The core mechanic: `leagues.start_matchday`

A league is bound to a season **and to the matchday its scoring window opens**.

- Points are counted for fixtures where `matchday >= leagues.start_matchday`.
- Earlier fixtures are visible, read-only, with real results — good for context, worth zero.
- A company that buys in February gets a fair league starting in February. This is permanent infrastructure, not launch scaffolding.

This resolves the July plan's open decision 2 ("mid-season joins") cleanly for B2B: **everyone in an office league starts on the same matchday**, so there is no unfairness to normalise.

For **consumer/public leagues**, where members trickle in across weeks, we add the normaliser:

- Rank by **total points** (the headline), with **points-per-matchday** shown alongside and available as a sort.
- A member's card shows "joined MD4 · 5 matchdays played".
- Late joiners are never retro-credited and never see a locked-out leaderboard — points-per-matchday keeps them legible against early joiners.

---

## Build phases

### Phase 1 — Data foundation *(week 1, non-negotiable, in progress)*
Execute tech-foundation Phases 1–2, additive and non-breaking.

- `0006` — create `competitions`, `seasons`, `teams`, `fixtures`; add `leagues.season_id` + `leagues.start_matchday`. Nothing reads them yet.
- `0007` — backfill WC2026 as one competition/season/fixture set from `matches` + `data/tournament-2026.json`; repoint `predictions.match_id → fixture_id`; keep `matches` as a compatibility **view** so live WC pages keep working. *(The one irreversible step — checkpoint before applying.)*
- Seed **Premier League 2026/27** (API-Football league 39) and **Champions League 2026/27** (league 2): competitions, seasons, teams, full fixture lists. `fixtures.matchday` = gameweek / league-phase matchday.
- Extend `jobs/ingest-results.ts` to poll **per active season**, idempotent upsert, gameweek-aware. Backfill the already-played PL GW1–3 and UCL MD1 as finished fixtures.

### Phase 2 — The matchday prediction experience *(weeks 2–3)*
- Matchday-scoped predict view: the current gameweek/matchday's fixtures, defaulting to the next open one.
- Per-match lock (already built and enforced in-DB) + a surfaced **matchday deadline** countdown anchored to the first kickoff.
- Navigation across matchdays; past ones read-only with results; pre-`start_matchday` ones visibly "before your league started".
- Auto-save + "you've predicted 7/10 this matchday".
- Fixture context: club form (WDL) and league position, from standings.
- Club identity: colours + names. **No crests** — trademarked, and we never market data as official.

### Phase 3 — Leaderboards & the weekly loop *(week 3)*
- Two dimensions: **season-to-date** (from `start_matchday`) and **this matchday**.
- Matchday winner + position movement.
- Points-per-matchday normaliser for public leagues.
- One pre-deadline reminder email per matchday. This is the habit loop; it ships at launch.
- Defer: streaks, badges, recap emails.

### Phase 4 — Launch *(week 4)*
- Competition picker in `/start`: create a **Champions League 2026/27** or **Premier League 2026/27** league, with `start_matchday` defaulted to the next unplayed one.
- Free-to-play consumer leagues, carried straight over from the WC pivot. The "Free to play · No money · Not gambling" trust line is more valuable year-round, not less.
- Soft-launch to the World Cup email list: *"You picked the World Cup. Now pick the Champions League — starts matchday 2, 13 October."*

### Phase 5 — After launch
Recurring billing (Stripe subscriptions, season-anchored), Slack/Teams reminders, streaks/badges/recaps, sponsorship + creator leagues (already specced), white-label.

---

## MVP cut line for 13 October

Ship: Phase 1 complete · Phase 2 predict flow · Phase 3 season + matchday leaderboards and one reminder email · create-a-league with the competition picker · existing join flow.

Defer past launch: recurring billing (launch free), streaks/badges, recap emails, Slack/Teams, white-label, any third competition.

---

## Decisions carried forward (unchanged from July)

1. **Free-to-play for consumers**, monetise B2B + premium + sponsorship. Free is how we out-acquire.
2. **Per-match lock**, with a surfaced matchday deadline for nudges. No hard single cut-off.
3. **Club colours and names, never crests.** Never market data as "official".

## Decisions this re-cut makes

4. **`leagues.start_matchday`** — a league's scoring window opens at its own matchday. Permanent.
5. **UCL is the hero competition**, PL is the retention engine. Both ship, the pitch leads with UCL.
6. **Past fixtures are ingested and shown, never scored.**
7. **Total points leads, points-per-matchday normalises** — for public leagues only; office leagues share a `start_matchday` and need no normaliser.

---

## Honest risk note

Four and a half weeks, solo, for a data-model migration plus a new prediction surface plus two seeded competitions. The migration is the risk: it is the irreversible part and it is first, which is correct. If week 3 slips, the thing to cut is the PL surface — launch UCL-only for MD2 and add PL a week later. What must not be cut is the data foundation, because rushing it is the one mistake that can't be undone later in the season.

**Sources for the calendar:** [UEFA — 2026/27 Champions League dates & format](https://www.uefa.com/uefachampionsleague/news/02a6-20d57cfcd03e-407c22a7f465-1000--2026-27-champions-league-teams-dates-draws-format-final/) · [UEFA — league phase fixtures](https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--2026-27-champions-league-all-the-league-phase-fixtures/) · [Premier League — all 380 fixtures for 2026/27](https://www.premierleague.com/en/news/4675097/all-380-fixtures-for-202627-premier-league-season) · [Wikipedia — 2026–27 Premier League](https://en.wikipedia.org/wiki/2026%E2%80%9327_Premier_League)
