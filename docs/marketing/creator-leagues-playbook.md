# Co-branded creator leagues — operating playbook

A creator (football TikToker, newsletter writer, community admin) runs their own
**branded** Verdocast league for their audience. We get their distribution and
attributed signups; they get a free, on-brand game to engage their community. The
infra is already live - branded join page, branded nav, `?ref=` attribution - so
this is an operational play, not a build. See the model and guardrails in
[`rewards-partnerships-strategy.md`](rewards-partnerships-strategy.md).

## What the creator gets
- A league carrying **their logo and colour** (applied automatically on the join
  page and through the app nav).
- A memorable **join code** (e.g. `RONS-RIVALS`) and a clean share link.
- **Attribution**: every signup via their link is tagged `?ref=<creator>` and
  shows in `/admin/stats`, so their impact is measurable.
- Optional later: a **brand-funded reward** for their league's winner (see the
  rewards strategy - keep it free-entry, skill-based, never gambling).

## What we get
- Their audience, at zero CAC, landing on a co-branded product.
- A measurable channel per creator (the `ref` tag).
- A repeatable format to scale across many creators.

## Run it in 4 steps
1. **Agree the basics** with the creator: league name, a join code, their brand
   colour (hex) and a hosted logo URL, and the `ref` tag to attribute them.
2. **Provision the league.** Generate the SQL + links:
   ```
   node scripts/create-creator-league.mjs \
     --name "Ron's Rivals" --code RONS-RIVALS --email ron@example.com \
     --color "#e6ff3d" --logo "https://.../ron.png" --ref ron --max 1000
   ```
   Paste the printed SQL into the **Supabase SQL Editor** and run it (that's how
   we write to the DB - the local service-role key is intentionally not used).
3. **Hand over the links** the script prints:
   - Join (attributed): `verdocast.com/league/RONS-RIVALS/join?ref=ron`
   - Predictions / Leaderboard links for the creator to reference.
4. **Track it.** Watch `ref=ron` signups and league activity in `/admin/stats`.

## Guardrails (protect the wedge)
- **Free entry always.** Never gate a creator league or its reward behind a
  purchase. It stays a skill game, not gambling.
- **Exposure, not data.** We never hand a creator (or a reward sponsor) member
  emails - only aggregate performance.
- **On-brand partners only.** No gambling / crypto-adjacent creators - one such
  association undoes our "not gambling" position (see the ADI competitor note).
- **Keep it inclusive.** The game rewards score prediction, not trivia, so a
  creator's non-superfan audience can still play and win.

## Good first targets
Small-to-mid football-prediction and `#footballtok` creators, football
newsletters, and community/Discord admins - inclusive and analytical over
laddish. Start now; the play needs no further engineering.
