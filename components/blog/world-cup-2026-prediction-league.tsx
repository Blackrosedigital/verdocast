import Link from "next/link";

const H2 = "mt-10 font-display text-3xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

/** Body for the "Turn the World Cup into your team's ritual" post. */
export function WorldCupPredictionLeagueBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        The World Cup is one of the few moments in the calendar when an entire
        company genuinely cares about the same thing at the same time. For four
        weeks, the person in finance who never watches football and the colleague
        with strong opinions about the back four are suddenly in the same
        conversation.
      </p>
      <p className={P}>
        Most teams let that energy disappear into the group chat. It doesn&rsquo;t
        have to.
      </p>
      <p className={P}>
        A <strong className="text-foreground">World Cup 2026 prediction league</strong>{" "}
        captures the buzz and turns it into a daily reason for people to talk to
        each other — a shared ritual that runs from the opening match to the
        final. Here&rsquo;s why it works, and how to set one up for your team in
        about two minutes.
      </p>

      <h2 className={H2}>Prediction league vs. office sweepstake</h2>
      <p className={P}>
        The classic office sweepstake pulls a country out of a hat. It&rsquo;s fun
        for ten seconds, then most people are knocked out by the second week and
        stop caring. A prediction league is different — and better for a team:
      </p>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Everyone plays the whole tournament.</strong>{" "}
          You predict the score of every match, so you&rsquo;re never &ldquo;out&rdquo;.
        </li>
        <li className={LI}>
          <strong className="text-foreground">It&rsquo;s inclusive.</strong> You&rsquo;re
          predicting scores, not demonstrating football knowledge. The quiet one
          in the corner beats the loudmouth all the time.
        </li>
        <li className={LI}>
          <strong className="text-foreground">It rewards judgement.</strong> Closer
          predictions score more, so there are genuine bragging rights on the
          line.
        </li>
        <li className={LI}>
          <strong className="text-foreground">It&rsquo;s not gambling.</strong> No entry
          fees, no pooled cash, no bookmaker vibes — just a leaderboard and pride.
        </li>
      </ul>
      <p className={P}>
        That last point matters at work. A prediction league is a culture
        activity, not a betting pool — which makes it something HR and People
        teams can actually get behind.
      </p>

      <h2 className={H2}>How a Verdocast league works</h2>
      <p className={P}>Three steps:</p>
      <ol className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Start free.</strong> Name your company
          and your league. No card, no subscription, no IT ticket — free for the
          entire group stage.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Share one link.</strong> Drop the join
          link in your team channel. People join with a magic link — no passwords.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Watch the leaderboard.</strong> Everyone
          predicts the scores; points are scored automatically and a live
          leaderboard updates itself.
        </li>
      </ol>
      <p className={P}>
        No spreadsheets, no manual scoring, no chasing people for their picks.
      </p>

      <h2 className={H2}>How points work</h2>
      <p className={P}>
        Verdocast rewards how close you get, so it stays competitive to the final
        whistle:
      </p>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Exact score — 5 points.</strong> You
          called it precisely.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Correct goal difference — 3 points.</strong>{" "}
          Right margin, wrong score (non-draws).
        </li>
        <li className={LI}>
          <strong className="text-foreground">Correct result — 2 points.</strong> Right
          winner, or you called the draw.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Anything else — 0.</strong>
        </li>
      </ul>
      <p className={P}>
        So if a match ends 2-1: predicting 2-1 earns 5, 3-2 earns 3, and 1-0
        earns 2. Simple enough that anyone can join; deep enough that the
        leaderboard actually means something.
      </p>

      <h2 className={H2}>Perfect for hybrid and remote teams</h2>
      <p className={P}>
        &ldquo;Team building&rdquo; usually fails because it asks people to
        perform. The World Cup doesn&rsquo;t — people are already invested. A
        prediction league channels that into something a distributed team can
        share asynchronously: make your picks whenever, the leaderboard is the
        watercooler, and the banter writes itself across time zones. It&rsquo;s
        the rare engagement activity people opt into because they{" "}
        <em>want</em> to.
      </p>

      <h2 className={H2}>Set yours up before the next kick-off</h2>
      <p className={P}>
        The tournament runs until 19 July, and the group stage — free on
        Verdocast — is on right now. Browse{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          every fixture and live group table
        </Link>
        , then set your league up. The sooner you start, the more matches your
        team gets to predict.
      </p>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          Running it for your team?{" "}
          <Link href="/start" className="text-primary underline">
            Start a free league
          </Link>{" "}
          — two minutes, one link.
        </li>
        <li className={LI}>
          Just want to play?{" "}
          <Link href="/play" className="text-primary underline">
            Join the global league
          </Link>{" "}
          and take on everyone.
        </li>
      </ul>
      <p className={`${P} text-foreground`}>
        Turn the World Cup into your team&rsquo;s ritual — a free prediction
        league anyone can play, live in two minutes.
      </p>
    </div>
  );
}
