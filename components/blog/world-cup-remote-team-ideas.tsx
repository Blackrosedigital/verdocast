import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";

/** Body for the remote/hybrid team ideas listicle. */
export function RemoteTeamIdeasBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        For a few weeks every four years, a major tournament gives distributed
        teams something rare: a shared moment everyone actually cares about. You
        don&rsquo;t have to manufacture engagement - you just have to channel it.
        Here are seven low-effort ways to bring a remote or hybrid team together
        around the World Cup.
      </p>

      <h2 className={H2}>1. Run a prediction league (the easy winner)</h2>
      <p className={P}>
        The single best option for a distributed team: everyone predicts the
        scores, points are scored automatically, and a live leaderboard becomes
        the new watercooler. It&rsquo;s async by nature (make your picks whenever),
        inclusive (no football knowledge needed), and takes two minutes to set up.{" "}
        <Link href="/start" className="text-primary underline">
          Start a free league
        </Link>{" "}
        and share one link - or read{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          how to run one
        </Link>
        .
      </p>

      <h2 className={H2}>2. A virtual watch party</h2>
      <p className={P}>
        Pick a marquee fixture, open a video call or a dedicated chat channel, and
        watch &ldquo;together&rdquo; apart. A live reactions thread does most of
        the work.
      </p>

      <h2 className={H2}>3. A no-cash sweepstake</h2>
      <p className={P}>
        The classic draw-a-country game - just skip the money (keep it at work-
        friendly bragging rights). Better yet, see why a{" "}
        <Link
          href="/blog/world-cup-2026-office-sweepstake"
          className="text-primary underline"
        >
          prediction league beats a sweepstake
        </Link>
        .
      </p>

      <h2 className={H2}>4. Adopt-a-nation</h2>
      <p className={P}>
        Assign each team or department a country to cheer for the tournament.
        Instant rivalries, and a reason to decorate a Slack channel.
      </p>

      <h2 className={H2}>5. Match-day trivia</h2>
      <p className={P}>
        Drop a quick question in the channel on big match-days - a kit, a stadium,
        a record. Five seconds of fun, zero setup.
      </p>

      <h2 className={H2}>6. Kit-colour Fridays</h2>
      <p className={P}>
        Encourage people to wear their (adopted) team&rsquo;s colours on call.
        Silly, visible, and surprisingly good for belonging.
      </p>

      <h2 className={H2}>7. A final-day send-off</h2>
      <p className={P}>
        Wrap the tournament with a short call: crown your prediction-league
        champion, hand out (joke) awards, and let the banter land before everyone
        moves on.
      </p>

      <h2 className={H2}>Start with the one that runs itself</h2>
      <p className={`${P} text-foreground`}>
        If you only do one thing, make it the prediction league - it&rsquo;s the
        lowest effort and the longest-lasting.{" "}
        <Link href="/start" className="text-primary underline">
          Set one up free
        </Link>
        , or{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          browse the fixtures
        </Link>{" "}
        first.
      </p>
    </div>
  );
}
