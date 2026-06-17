import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function QuarterFinalsBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        Eight teams left. The quarter-finals are where contenders and pretenders
        are separated - and where prediction leagues are often won or lost. A few
        well-judged calls now can swing the whole leaderboard.
      </p>

      <h2 className={H2}>What the last eight tells us</h2>
      <p className={P}>
        By this stage the survivors usually share a few traits: a settled
        defence, a goalkeeper in form, and at least one player who can win a tight
        game on their own. The romantic underdog stories are mostly over;
        tournament know-how starts to dominate.
      </p>

      <h2 className={H2}>Predicting the quarters</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Expect tight.</strong> One-goal games
          and extra time are common - don&rsquo;t over-predict goals.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Trust momentum.</strong> A team growing
          into the tournament is a safer pick than a big name stuttering through.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Mind the minutes.</strong> Sides coming
          off a draining extra-time win can fade - fatigue is a real edge.
        </li>
      </ul>

      <h2 className={H2}>Every point counts now</h2>
      <p className={P}>
        With fewer matches left, the leaderboard tightens fast. A single exact
        score (worth 5) can leapfrog you several places. If you&rsquo;ve drifted,
        this is the moment to lock your picks back in.
      </p>

      <h2 className={H2}>Get your calls in</h2>
      <p className={`${P} text-foreground`}>
        See the bracket and live standings on the{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          fixtures hub
        </Link>
        , then{" "}
        <Link href="/start" className="text-primary underline">
          start a free league
        </Link>{" "}
        or{" "}
        <Link href="/play" className="text-primary underline">
          join the global league
        </Link>{" "}
        for the run to the final.
      </p>
    </div>
  );
}
