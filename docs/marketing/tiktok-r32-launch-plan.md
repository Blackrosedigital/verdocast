# TikTok R32 launch plan — bio, CTA stickers & 3-day schedule

Companion to [`tiktok-r32-vo-scripts.md`](tiktok-r32-vo-scripts.md) (the 3 voiceover scripts) and the slides in `og-exports/matches/r32/`. CTA target: `verdocast.com/play?ref=tiktok`. Brand: confident, analytical, editorial - no gambling language, hyphens not em-dashes.

---

## 1. Bio + CTA sticker copy

### TikTok bio options
**A — analyst angle (recommended for launch)**
```
Predicting all 104 World Cup matches. Knockouts live now.
Free global league ↓
verdocast.com/play?ref=tiktok
```
**B — challenge angle (most click-driving)**
```
Can you call the knockouts? Prove it. Free, no money.
Join the global league ↓
verdocast.com/play?ref=tiktok
```
**C — editorial angle (most distinctive)**
```
The thinking fan's prediction game. R32 → Final.
Play free ↓
verdocast.com/play?ref=tiktok
```

### "Link in bio" CTA wording
> **Predict the knockouts free - link in bio.**

### On-video CTA sticker text (last 2-3 seconds, bottom third)
1. `Predict free - link in bio`
2. `Your turn. Call the knockouts ↓`
3. `Think you can do better? Link in bio`
4. `Free global league - link in bio`
5. `No money. Just bragging rights ↓`
6. `Beat my bracket - link in bio`

Pairing: #6 on Video 1 (predictions); #2/#4 on Video 2 (explainer); #3 on Video 3 (penalty rule).

### Pinned-comment template (drop on every post)
```
Predict every World Cup knockout match free - no money, just the call.
Global league anyone can join 👉 verdocast.com/play?ref=tiktok
New match drops daily. Beat the crowd.
```

---

## 2. Three-day posting schedule (28-30 Jun BST)

**Launch sequence (28 Jun, in order):** pin **Video 2** (explainer) first → post **Video 1** (predictions) as the hero → hold **Video 3** (penalty rule) for 29 Jun. Solo-founder cap: 2-3 posts/day.

### Saturday 28 Jun — launch day · *South Africa v Canada 8:00pm*
- **9:00am — Video 2 (PIN it).** Caption: "The whole game in 10 seconds. Knockouts go live today." `#worldcup2026 #predictions #footballtiktok #knockouts #worldcup` · sticker #4.
- **12:30pm — Video 1 (hero).** Caption: "My calls for all 16 R32 ties. Screenshot it, then beat me. SA v Canada kicks us off tonight." `#worldcup2026 #r32 #footballpredictions #southafrica #canada` · sticker #6.
- **10:15pm — Reaction (SA v Canada FT).** Caption: "Called it / got that wrong. One down, fifteen to go. Brazil v Japan tomorrow." `#worldcup2026 #southafrica #canada #r32 #fulltime` · sticker #2.

### Sunday 29 Jun — *Brazil v Japan 6:00pm · Germany v Paraguay 9:30pm*
- **10:00am — Video 3 (penalty rule).** Caption: "The scoring rule almost everyone misreads. Get it right before Brazil v Japan." `#worldcup2026 #penalties #footballtiktok #predictions #knockoutrules` · sticker #3.
- **1:00pm — Pre-match (both ties).** Caption: "Brazil v Japan 6pm, my call: [score]. Germany v Paraguay later - lock both." `#brazil #japan #worldcup2026 #r32 #footballpredictions` · sticker #1.
- **11:45pm — Reaction (both, after GER-PAR FT).** Caption: "Two more in the books - how my calls held up. Big Monday ahead." `#worldcup2026 #brazil #germany #r32 #fulltime` · sticker #5. *(If fading, defer to a 30 Jun 8:00am recap.)*

### Monday 30 Jun — *Netherlands v Morocco 2:00am · Ivory Coast v Norway 6:00pm · France v Sweden 10:00pm*
- **8:30am — Recap (NED v MAR, overnight).** Caption: "While you slept: Netherlands v Morocco. Ivory Coast and France still to come." `#netherlands #morocco #worldcup2026 #r32 #fulltime` · sticker #4.
- **1:00pm — Pre-match (both evening ties).** Caption: "Two big calls tonight: Ivory Coast v Norway 6pm, France v Sweden 10pm. My scores below." `#france #sweden #ivorycoast #worldcup2026 #r32` · sticker #6.
- **12:15am (into 1 Jul) — Reaction (France v Sweden FT).** Caption: "Did the favourites deliver? My call vs reality. How's your bracket holding up?" `#france #sweden #worldcup2026 #r32 #fulltime` · sticker #2. *(Defer to next-morning recap if fading.)*

> The 2:00am NED v MAR is unwatchable live for a solo founder - treat it as a morning recap, not a live slot.

---

## The one KPI
**Link clicks to `/play?ref=tiktok` → completed first prediction (activation rate).** Not views/follows. Track in PostHog: `ref=tiktok` sessions → % submitting ≥1 prediction. **Target 25-40%** in launch week.

- **Working:** clicks convert 25%+ and the pinned Video 2 is your top traffic source → repeat the penalty-rule + reaction formats with new matches.
- **Not working:** high views, low clicks → move the sticker earlier, say "free" in the first 3 seconds, test bio Option B. High clicks, low activation → the friction is on-site (the `/play` flow), fix that first.

## Priority order
1. **Tonight:** Video 2 export-ready + pinned comment drafted.
2. **28 Jun 9:00am:** pin Video 2, then Video 1 at 12:30pm.
3. **Instrument `ref=tiktok` in PostHog before posting** - the activation number is the only one that matters.
