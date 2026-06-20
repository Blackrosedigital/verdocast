# Knockout launch bundle — 28 June (R32)

Ready-to-send copy for the moment the knockouts go live. **Non-gambling language; hyphens not em-dashes.** Swap `{League}` / `{CODE}` and use the tracked links. Pairs with [`office-b2b-playbook.md`](office-b2b-playbook.md).

**Links:**
- Members (already in a league): `verdocast.com/league/{CODE}/predict`
- Acquisition (new people): `verdocast.com/play?ref=<channel>` (e.g. `?ref=ko-linkedin`)
- Standings to share: `verdocast.com/league/{CODE}/standings`

---

## 1. Member email — "The knockouts are live" (the key asset)

**Subject options:**
- The knockouts are live - predict the Round of 32
- Group stage's done. The real drama starts now.
- Your {League} knockouts are open - get your picks in

**Body:**
> The group stage is over - and the best bit starts now.
>
> The Round of 32 is set, and your **{League}** predictions are open. Call the scores, climb the leaderboard, and don't get knocked out of the banter.
>
> 👉 Make your R32 predictions: verdocast.com/league/{CODE}/predict
>
> A few things for the run to the final:
> - Every knockout match is worth points - predict them all before kickoff.
> - Knockout games are scored on the **90-minute result** (extra time and penalties don't count).
> - **Top players qualify for the prize** - check where you sit on the leaderboard.
>
> One slip and a team's out. Don't let that be you. See you at the top of the table.

---

## 2. LinkedIn (office / HR angle)

> The World Cup group stage is done - and this is the moment office leagues live for.
>
> The knockouts are single-elimination: one bad afternoon and a favourite's gone. Which means everyone's prediction league just got tense.
>
> If your team's been glued to the leaderboard, keep it going for the run to the final. Free, two minutes, no football knowledge required.
>
> Start or continue your league 👉 verdocast.com/play?ref=ko-linkedin
>
> #WorldCup2026 #TeamCulture #EmployeeEngagement

*(Tip: link in the first comment for more reach; ask people to comment "knockouts".)*

## 3. X / Twitter

> The World Cup knockouts are HERE 🏆
>
> Round of 32. Single elimination. Every game a final.
>
> Predict the scores, climb a live leaderboard, settle who actually knows football. Free: verdocast.com/play?ref=ko-x
>
> My R32 banker? Drop yours 👇 #WorldCup2026

## 4. WhatsApp / Telegram

> 🏆 Knockouts are live - Round of 32 starts today. Predict every score, free, live leaderboard. Get your picks in before kickoff 👉 verdocast.com/play?ref=ko-wa

## 5. Instagram story caption

> THE KNOCKOUTS ARE HERE 🏆
> Predict every R32 score · free · live leaderboard
> Tap the link - who's your dark horse?
> (link: verdocast.com/play?ref=ko-ig)

## 6. Reply / DM snippet (for "knockouts" commenters)

> You're on 👉 verdocast.com/play?ref=ko-social - predict the Round of 32, climb the board, free to play. Good luck 🍀

---

## Cadence after launch (per round, to 19 Jul)
R32 (28 Jun) → R16 (4 Jul) → QF (9 Jul) → SF (14 Jul) → Final (19 Jul). Each round: a **fixture-graphic post + a pre-round reminder + a "who's still qualifying" standings share**. The queued blog posts (knockout-stage guide, last-16, quarter-finals, final predictor) auto-publish alongside.

## Operational checklist for 28 Jun
- [ ] **Run the rewards migration** (below) so the prize / "Q" qualification shows.
- [ ] Admins set their **prize + top-N qualify** on the dashboard.
- [ ] Confirm R32 fixtures resolved with correct teams (the ingestion fills them in - eyeball the predict page).
- [ ] Send the member email; post the social set; pin the predict/standings link.

### Rewards migration (Supabase SQL Editor)
```sql
alter table leagues
  add column if not exists prize text,
  add column if not exists qualify_count int not null default 0
    check (qualify_count >= 0 and qualify_count <= 50);
```

### Fixture graphics (once R32 is drawn)
The match-graphic generator reads `data/tournament-2026.json`, where knockout teams are null until the draw. After R32 is set, regenerate the tournament data with resolved teams, then run `node scripts/gen-match-og.mjs 2026-06-28` (and per knockout date) to produce the round's graphics. *(Wiring the generator to read resolved teams from the DB is a small follow-up if you want it fully automatic.)*
