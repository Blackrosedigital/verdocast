import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function KeepLeagueAliveBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        The group stage is done. Your team spent three weeks arguing about the
        leaderboard - and now comes the best bit. The knockouts are where the
        drama lives, and it would be a shame to let the league go quiet just as the
        football gets unmissable.
      </p>

      <h2 className={H2}>Why the knockouts are the moment</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Higher stakes, bigger reactions.</strong>{" "}
          One-off matches, extra time, penalties - every game is an event.
        </li>
        <li className={LI}>
          <strong className="text-foreground">A fresh shot for everyone.</strong> Even
          someone mid-table in the group stage can go on a knockout run and steal
          the bragging rights.
        </li>
        <li className={LI}>
          <strong className="text-foreground">It carries the energy to mid-July.</strong>{" "}
          A reason for the team to keep checking in right through to the final.
        </li>
      </ul>

      <h2 className={H2}>Keep it going in two minutes</h2>
      <p className={P}>
        Your league, members and leaderboard are already set up - there&rsquo;s
        nothing to rebuild. A few things that help engagement through the
        knockouts:
      </p>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          Drop a fresh reminder in your team channel before the Round of 32 kicks
          off.
        </li>
        <li className={LI}>
          Share the standings so far - a &ldquo;here&rsquo;s who&rsquo;s top&rdquo;
          nudge pulls stragglers back in.
        </li>
        <li className={LI}>
          Nudge anyone who hasn&rsquo;t predicted yet from your admin dashboard.
        </li>
      </ul>

      <h2 className={H2}>Not running one yet?</h2>
      <p className={`${P} text-foreground`}>
        It&rsquo;s not too late - a fresh knockout leaderboard is its own clean
        competition.{" "}
        <Link href="/start" className="text-primary underline">
          Start a free league
        </Link>{" "}
        and share one link, or read the{" "}
        <Link
          href="/blog/world-cup-2026-knockout-stage"
          className="text-primary underline"
        >
          knockout-stage format and dates
        </Link>{" "}
        first.
      </p>
    </div>
  );
}
