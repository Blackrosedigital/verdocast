import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function FinalPredictorBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        It all comes down to one match. The World Cup final is the most-watched
        game on earth - and the perfect excuse to get your team predicting one
        last time. Here&rsquo;s how to run a quick final predictor, even if you
        never set up a league all tournament.
      </p>

      <h2 className={H2}>Why the final is the easy win</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Everyone&rsquo;s watching anyway.</strong>{" "}
          You&rsquo;re adding a layer of fun to something people already care about.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Zero commitment.</strong> One match, one
          prediction - perfect for colleagues who didn&rsquo;t want a month-long
          thing.
        </li>
        <li className={LI}>
          <strong className="text-foreground">A proper send-off.</strong> Crown a
          winner, hand out (joke) awards, and end the tournament on a high.
        </li>
      </ul>

      <h2 className={H2}>How to run it in two minutes</h2>
      <ol className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          <Link href="/start" className="text-primary underline">
            Create a free league
          </Link>{" "}
          and name it something final-worthy.
        </li>
        <li className={LI}>Share the link in your team channel before kickoff.</li>
        <li className={LI}>
          Everyone predicts the score; the leaderboard settles it automatically.
        </li>
      </ol>

      <h2 className={H2}>Predicting the final</h2>
      <p className={P}>
        Finals are famously cagey - nerves and respect tend to keep the score down.
        A tight 1-0 or 2-1, or a draw heading to extra time, is rarely a bad shout.
        And remember a correct result still scores even if you miss the exact line.
      </p>

      <p className={`${P} text-foreground`}>
        Make the last game of the tournament the one everyone remembers.{" "}
        <Link href="/start" className="text-primary underline">
          Set up your final predictor
        </Link>
        .
      </p>
    </div>
  );
}
