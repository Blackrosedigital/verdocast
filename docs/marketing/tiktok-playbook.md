# Verdocast TikTok playbook — zero to a running channel (solo, faceless)

The one definitive, do-this-then-that guide for the founder. It consolidates and sequences the three existing docs - it does not replace them. Keep them open as your reference library:

- [`tiktok-r32-launch-plan.md`](tiktok-r32-launch-plan.md) - bio options, CTA stickers, the 3-day launch schedule, every word-for-word caption (28-30 Jun), the KPI.
- [`tiktok-r32-vo-scripts.md`](tiktok-r32-vo-scripts.md) - the 4 ElevenLabs voiceover scripts (incl. Video 4 "the bracket is live"), with slide-by-slide on-screen text.
- [`tiktok-bracket-reaction-format.md`](tiktok-bracket-reaction-format.md) - the reusable per-round reaction format and the one-take bracket-scroll recording spec.

**Product truth to weave into every post:** the knockouts are live now (R32 underway, today is 28 Jun). The public bracket at `verdocast.com/world-cup-2026/knockouts` advances winners as real ties finish, and every match has its own page with line-ups and stats at `verdocast.com/world-cup-2026/match/[code]`. The tracked CTA is `verdocast.com/play?ref=tiktok` (bio only - the AI voice says "verdocast dot com slash play").

**Voice on everything:** confident, analytical, lightly editorial - The Athletic, not DraftKings. Inclusive, never laddish. No gambling language (no bet/odds/stake/wager). Hyphens, not em-dashes.

**The one KPI (read this before anything else):** link clicks to `/play?ref=tiktok` that complete a first prediction - the **activation rate**. Not views, not follows. Target 25-40% in launch week. Everything below serves that number.

---

## Phase 0 — One-time setup (do this tonight, ~90 min)

You only do Phase 0 once. Get it perfect, then never touch it again except the pinned video.

1. **Create the account.** New TikTok account, handle `@verdocast` (or closest: `@verdocast.football`, `@playverdocast`). Switch to a **Business account** in Settings (unlocks the bio link, analytics, and scheduling). Profile photo: the Verdocast mark on the dark `#0a0b0d` background. Display name: `Verdocast - World Cup predictions`.

2. **Set the bio.** Use **Option A (analyst angle)** from the launch plan for launch:
   ```
   Predicting all 104 World Cup matches. Knockouts live now.
   Free global league ↓
   verdocast.com/play?ref=tiktok
   ```
   Hold Option B (challenge angle) as your A/B test if clicks underperform in week 1.

3. **Set the link-in-bio.** Business accounts allow one clickable website link - point it straight at `verdocast.com/play?ref=tiktok`. Do not use a Linktree; one link, one job, less friction. Bio CTA wording above the link: **"Predict the knockouts free - link in bio."**

4. **Confirm the UTM/tracking works before you post anything.** Open `verdocast.com/play?ref=tiktok` in a private window, complete one prediction, and confirm the `ref=tiktok` session and the prediction event land in PostHog (and/or `/admin/stats`). **If you cannot see the activation number, do not start posting** - you would be flying blind on the only metric that matters.

5. **Draft the pinned comment once** (you paste it on every post):
   ```
   Predict every World Cup knockout match free - no money, just the call.
   Global league anyone can join 👉 verdocast.com/play?ref=tiktok
   New match drops daily. Beat the crowd.
   ```

6. **Install and set up the two tools.**
   - **ElevenLabs** - one consistent voice for the whole channel. Pick a calm, analytical English voice (not hyped). Save it as your default. This is your "presenter."
   - **CapCut** (desktop preferred for speed) - this is your editing assembly line.

7. **Build your two reusable CapCut templates now** so production is a swap-the-blanks job, not a rebuild:
   - **Template A "graphic slides"** (for predictions, penalty rule, reactions): dark `#0a0b0d` background, lime `#e6ff3d` titles, JetBrains-mono scorelines, auto-captions on, an end-card with the URL + "FREE • NO GAMBLING" + sticker slot.
   - **Template B "bracket scroll"** (for the bracket-is-live video and every per-round reaction): the on-screen-text beats from the recording spec already mapped to the timeline.

8. **Capture the one reusable bracket scroll** following the recording spec in the reaction-format doc (phone portrait, Do Not Disturb on, ~28s continuous scroll of `verdocast.com/world-cup-2026/knockouts`, top → R32 → pause on a resolved tie → R16/QF → pause on Final → hold). This single take feeds **Video 4 and every Reaction** - capture it once, reuse all tournament.

**End state of Phase 0:** account live, bio + link set, tracking verified, both tools ready, two CapCut templates built, one bracket-scroll capture in the can.

---

## Phase 1 — The faceless production assembly line (~25-35 min per video once warm)

Every video runs through the same five stations. Never skip captions (most TikTok is watched on mute).

1. **CAPTURE (5-10 min).** Get the raw visual:
   - *Predictions / penalty rule (Video 1, 3):* pull the match slides from `og-exports/matches/r32/`, or screenshot a match page (`/world-cup-2026/match/[code]`) for line-ups and stats as b-roll.
   - *Explainer / bracket (Video 2, 4):* screen-record the app - the `/play` flow for Video 2, the bracket page for Video 4 (you already have the reusable scroll).
   - *Reactions:* screen-record the resolved tie on the bracket page + your own prediction row.

2. **VO (5 min).** Paste the matching script's **VOICEOVER block** into ElevenLabs (default voice), generate, download. Never let the voice read the `?ref=tiktok` param - the script already says only "verdocast dot com slash play."

3. **EDIT (10-15 min).** Drop the capture into the right CapCut template, lay the VO on top, snap the on-screen text to the beats from the script's slide table, add a TikTok-native sound at low volume (see sound notes in each script), end-card on the last 2-3s.

4. **CAPTION + STICKER (3 min).** Turn on auto-captions and fix any team names. Add the on-video CTA **sticker** for the last 2-3s (pairings: #6 on predictions, #2/#4 on explainer, #3 on penalty rule, #7 on bracket, #8 on reactions - full list in the launch plan).

5. **POST (3 min).** Paste the **word-for-word caption** for that slot from the launch plan, add the hashtags from the script, post, then immediately **paste the pinned comment** and pin it.

> Realistic timing: first few videos ~45 min each; by day 3 you'll be at ~25-30 min. Batch-produce: do all CAPTURE + VO for a day's posts in one sitting, then edit/schedule.

---

## Phase 2 — Posting cadence and content calendar (R32 → Final)

**Cap: 2-3 posts/day, every day.** Quality and the activation number beat volume. The rhythm has two layers: **per-match posts** (the daily drama) and a **per-round bracket reaction** (the weekly zoom-out). Map of which existing asset goes when:

### Launch window — exact, paste-ready (28-30 Jun)
Run the **3-day launch schedule verbatim** from the launch plan. Order of operations on day one: **pin Video 2 (explainer) first → Video 4 (bracket is live) → Video 1 (R32 predictions, hero) → evening reaction.** Every slot's time, caption, hashtags, and sticker are already written there - do not improvise launch week.

- **Sat 28 Jun:** 9:00 Video 2 (pin) · 11:00 Video 4 · 12:30 Video 1 · 22:15 SA v Canada reaction.
- **Sun 29 Jun:** 10:00 Video 3 (penalty rule) · 13:00 pre-match (Brazil v Japan, Germany v Paraguay) · 23:45 reaction.
- **Mon 30 Jun:** 8:30 overnight recap (NED v MAR) · 13:00 pre-match (Ivory Coast v Norway, France v Sweden) · 00:15 reaction.

> The 2:00am ties are recaps, not live posts - never wreck your sleep for a slot a morning recap covers better.

### Steady state — rest of R32, then R16 → QF → SF → Final
Once the launch window ends, run the **repeatable daily pattern** for every match day:

1. **Pre-match post** (~1pm, before the day's ties): your call(s) for tonight, one bold/underdog angle. Sticker #6/#1. Use match-page stats and line-ups as the visual hook.
2. **Reaction post** (after FT, or next-morning recap if it finishes late): your call vs reality, "how's your bracket holding up?" Sticker #2/#5.
3. **One evergreen/utility slot when you have room:** re-cut the penalty-rule explainer for a new tie, or a "how it works" clip - keeps a top-of-funnel post in the mix that isn't result-dependent.

**Per-round Reaction (the weekly beat):** the **morning after each round's last tie finishes**, post the bracket reaction using the reusable format - "{teams left} teams left, my bracket vs reality, how's yours holding up?" Fewer teams = higher stakes = audio escalates (stating-facts beat for R32/R16 → higher tension for QF/SF/Final). The **Final** becomes a wrap-up variant: "my bracket vs the whole tournament."

As the bracket narrows, the per-match volume naturally drops (16 ties → 8 → 4 → 2 → 1), so the per-round Reaction becomes the anchor post and you lean more on evergreen re-cuts to hold cadence.

---

## Phase 3 — The solo-founder operating rhythm (daily / weekly)

**The cap is 2-3 posts/day - protect it.** Burnout kills channels faster than a flop.

### Each match day (repeat)
1. **Morning (~30 min):** post the overnight recap if a tie finished late; reply to every comment on yesterday's posts; check the activation number for the prior day.
2. **Midday batch (~60-75 min):** CAPTURE + VO + EDIT today's pre-match post (and prep the reaction template so FT is a 10-min fill-in-the-blank). Post the pre-match at ~1pm.
3. **First 60 min after each post:** this is the algorithm window - reply to every comment fast (see Phase 4).
4. **Post-FT (~15 min):** fill the reaction blanks, post, pin comment. If the tie finishes after ~11pm and you're fading, **defer to a next-morning recap** - the plan explicitly allows this.

### Each week
- **Sun/Mon (round-resolution morning):** the per-round bracket **Reaction is the priority post** that day.
- **Weekly review (~30 min):** pull the KPI (Phase 6), decide kill/scale on each format, plan next round's pre-match angles.
- **Refill the tank:** re-capture a fresh bracket scroll if the bracket has advanced a lot (so the "live" proof is current).

---

## Phase 4 — Engagement protocol

Engagement is not optional - it's the cheapest growth lever you have and it directly feeds activation.

1. **First 60 minutes (every post):** reply to every single comment. Early engagement velocity is what the algorithm rewards. Ask a question back ("what's your call?") to pull more comments.
2. **Pinned comment:** paste and pin the league CTA on every post the moment it goes live (template in Phase 0). This is your in-comment link to the join flow.
3. **Reply templates (on-brand, no gambling language):**
   - To a prediction: "Bold. Lock it in the free league and we'll see who's right - link in bio."
   - To "is this gambling?": "Nope - no money, ever. Just the call and a leaderboard. Free to play."
   - To a hot take: "Strong shout. The bracket's live, go put your name to it - link in bio."
   - To "how does it work?": "Pick a score, climb the leaderboard as the real matches play out. 10 seconds, free."
4. **Duets / stitches:** stitch big football moments (a shock R32 result, a viral hot take) with your reaction - "here's what that does to your bracket." Duet other creators' predictions with yours side by side. This borrows their audience and is inherently on-format.
5. **Treat the comments as a mini-league:** call back to commenters' predictions in your next reaction video ("a few of you called this one - respect"). Recognition drives repeat engagement and word of mouth.

---

## Phase 5 — Growth levers

Pull these in order of leverage; don't try all at once.

1. **Hooks (highest leverage).** The first line/3 seconds decide everything. Every script already leads with a hook; the rule across all of them: **say a concrete claim or "free" inside the first 3 seconds** ("This is every World Cup knockout match - and it's filling in live."). If clicks are high but activation is low, the on-site flow is the problem, not the hook. If views are high but clicks low, **move the sticker earlier and say "free" sooner.**
2. **Hashtags.** Each script ships its own set - use them. Pattern: one big-reach tag (`#WorldCup2026`), one format tag (`#predictions`/`#bracket`), one community tag (`#footballtok`), and rotate **team tags** to the day's fixtures (`#brazil #japan` etc.) to ride match-day search.
3. **Trends / sounds.** Use TikTok-native trending sounds at low volume under the VO where they fit the mood (the scripts specify a sound family per video). Jump on match-day moments fast - a stitch of a shock result posted within the hour rides the spike.
4. **Posting times.** Anchor to the football: pre-match ~1pm, reaction at/after FT, recaps ~8:30am. These ride the natural search and attention spikes around real kickoffs - the calendar already aligns to them.
5. **Collabs / creators.** Once you have a few posts up, reach out to small football-prediction and `#footballtok` creators for duets or a "build your bracket vs mine" collab. Inclusive, analytical creators over laddish ones - protect the brand.
6. **Cross-post to Reels + Shorts (free reach, near-zero extra work).** Every faceless 9:16 video re-posts natively to Instagram Reels and YouTube Shorts. Re-upload the file (don't share a TikTok-watermarked link - it gets suppressed), keep the caption, swap the CTA to "link in bio" / pinned-comment URL per platform. This roughly triples distribution for ~3 min of extra work per video.

---

## Phase 6 — Measurement: the one KPI, weekly checks, kill/scale rules

**The one KPI:** `/play?ref=tiktok` clicks → completed first prediction = **activation rate.** Target **25-40%** in launch week. Track in PostHog: `ref=tiktok` sessions → % submitting ≥1 prediction.

### Check weekly (not hourly)
- Activation rate from `ref=tiktok` sessions (the number).
- Which video is your top traffic source (pinned Video 2 should rank high).
- Click-through rate per post (views → bio clicks) to spot hook/sticker problems.
- Best-performing format and best-performing posting time.

### Kill / scale rules
- **Format works (clicks convert 25%+):** double down. Repeat that format with new matches each round. If the penalty-rule explainer or a reaction style is converting, re-cut it for the next tie.
- **High views, low clicks:** the hook works but the CTA doesn't. Move the sticker earlier, say "free" in the first 3 seconds, and A/B test **bio Option B** (challenge angle).
- **High clicks, low activation:** TikTok is doing its job - the friction is on-site. **Fix the `/play` flow first** before making more videos.
- **A format flops twice (low views and low clicks):** kill it, don't keep feeding it. Reallocate that slot to your best-converting format.

---

## Week 1 checklist — start tomorrow

**Tonight (Phase 0):**
- [ ] Create `@verdocast` Business account; set profile photo, display name.
- [ ] Set bio (Option A) + link-in-bio to `verdocast.com/play?ref=tiktok`.
- [ ] Verify `ref=tiktok` click → prediction event lands in PostHog. (Blocker - don't post until this works.)
- [ ] Install ElevenLabs (pick + save the voice) and CapCut (build Template A + Template B).
- [ ] Capture the one reusable bracket scroll (recording spec).
- [ ] Produce **Video 2 (pin)**; draft the pinned comment.

**Sat 28 Jun (launch day):**
- [ ] 9:00 post + **pin Video 2** · 11:00 Video 4 · 12:30 Video 1 (hero) · 22:15 SA v Canada reaction.
- [ ] Paste the pinned comment on all four; reply to every comment in the first 60 min.

**Sun 29 Jun:**
- [ ] 10:00 Video 3 (penalty rule) · 13:00 pre-match (Brazil v Japan + Germany v Paraguay) · 23:45 reaction (or defer to a 30 Jun 8am recap).
- [ ] Cross-post Videos 2 and 4 to Reels + Shorts.

**Mon 30 Jun:**
- [ ] 8:30 overnight recap (NED v MAR) · 13:00 pre-match (Ivory Coast v Norway + France v Sweden) · 00:15 reaction (or next-morning recap).

**End of week 1:**
- [ ] First weekly review: pull activation rate, identify top format + best posting time, apply the kill/scale rules.
- [ ] Prep the **R32 bracket Reaction** for the morning after the last R32 tie.

---

*Reference library: launch plan (bio, stickers, schedule, captions, KPI) · VO scripts (the 4 ElevenLabs scripts) · bracket-reaction format (per-round template + recording spec). This playbook sequences them - the detail lives there.*
