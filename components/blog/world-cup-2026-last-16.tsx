import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function LastSixteenBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        The field has narrowed. The Round of 32 has trimmed the World Cup to the
        last 16, and from here every match is a final in miniature. Here&rsquo;s
        how to read the run-in - and how to predict it.
      </p>

      <h2 className={H2}>What changes in the last 16</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Margins get thin.</strong> The gap
          between sides shrinks; low-scoring, cagey games become the norm.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Extra time is in play.</strong> Level
          after 90 means another 30 minutes, then penalties - worth factoring into
          your score predictions.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Form &gt; reputation.</strong> The team
          peaking right now often beats the bigger name on paper.
        </li>
      </ul>

      <h2 className={H2}>How to predict knockout games</h2>
      <p className={P}>
        Three rules of thumb that tend to pay off:
      </p>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          Lean towards <strong className="text-foreground">lower scorelines</strong> -
          knockout games are tighter than groups.
        </li>
        <li className={LI}>
          Back <strong className="text-foreground">defensive solidity</strong> over
          flair when a side just needs to get through.
        </li>
        <li className={LI}>
          Remember a correct result still scores - you don&rsquo;t have to nail the
          exact score to climb (see{" "}
          <Link
            href="/blog/prediction-league-scoring-explained"
            className="text-primary underline"
          >
            how scoring works
          </Link>
          ).
        </li>
      </ul>

      <h2 className={H2}>Follow it live</h2>
      <p className={`${P} text-foreground`}>
        Track the bracket and live tables on the{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          fixtures hub
        </Link>
        , and keep your picks coming -{" "}
        <Link href="/start" className="text-primary underline">
          start a free league
        </Link>{" "}
        or{" "}
        <Link href="/play" className="text-primary underline">
          join the global one
        </Link>
        .
      </p>
    </div>
  );
}
