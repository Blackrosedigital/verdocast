import Link from "next/link";

const H2 = "mt-10 font-display text-3xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

/** Body for the "office sweepstake alternative" post. */
export function OfficeSweepstakeBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        The office World Cup sweepstake is a tradition: everyone chips in, names
        get pulled out of a hat, and someone who&rsquo;s never watched a match
        ends up with Brazil. It&rsquo;s a bit of fun — but as a way to keep a
        whole team engaged for a month, it has some real problems. Here&rsquo;s a
        free alternative that fixes all of them.
      </p>

      <h2 className={H2}>The trouble with a sweepstake</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Most people are out by week two.</strong>{" "}
          Once your team is knocked out, you stop caring. Engagement falls off a
          cliff exactly when you wanted it to last.
        </li>
        <li className={LI}>
          <strong className="text-foreground">It&rsquo;s pure luck.</strong> Draw a
          favourite and you&rsquo;re laughing; draw a minnow and you&rsquo;re done
          before kickoff. No skill, no comeback.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Someone has to run it.</strong> Printing
          slips, collecting money, tracking who has whom, paying out — it all
          lands on one person.
        </li>
        <li className={LI}>
          <strong className="text-foreground">The money is awkward at work.</strong>{" "}
          Cash entry plus a prize pot is, technically, gambling — not something
          most HR teams want to formally organise.
        </li>
      </ul>

      <h2 className={H2}>A better idea: a prediction league</h2>
      <p className={P}>
        A{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          prediction league
        </Link>{" "}
        keeps the fun of the sweepstake and removes the friction. Instead of
        drawing one team, everyone predicts the score of every match. You&rsquo;re
        never knocked out, it rewards judgement as well as luck, and there&rsquo;s
        no money to handle.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">Sweepstake</th>
              <th className="px-4 py-3 font-medium">Prediction league</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["Stay in the whole tournament", "No", "Yes"],
              ["Skill involved", "No", "Yes"],
              ["Admin to run", "Lots", "None"],
              ["Money / gambling", "Usually", "Never"],
              ["Works for non-fans", "Sort of", "Yes"],
            ].map(([label, a, b]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{label}</td>
                <td className="px-4 py-3">{a}</td>
                <td className="px-4 py-3 font-medium text-foreground">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={H2}>How to set one up (in two minutes)</h2>
      <p className={P}>
        With{" "}
        <Link href="/" className="text-primary underline">
          Verdocast
        </Link>{" "}
        there&rsquo;s nothing to print or collect:
      </p>
      <ol className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <Link href="/start" className="text-primary underline">
            Create a free league
          </Link>{" "}
          and name it.
        </li>
        <li className={LI}>Share the join link in your team channel.</li>
        <li className={LI}>
          Everyone predicts; the leaderboard scores itself. Done.
        </li>
      </ol>
      <p className={P}>
        It&rsquo;s free for the entire group stage, and you can browse{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          every fixture and group table
        </Link>{" "}
        before you start.
      </p>
      <p className={`${P} text-foreground`}>
        Same tradition, none of the hassle — and everyone&rsquo;s still in it on
        the final day.
      </p>
    </div>
  );
}
