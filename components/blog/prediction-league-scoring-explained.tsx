import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function ScoringExplainedBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        A good prediction league lives or dies on its scoring. Get it right and
        everyone stays in the hunt to the final whistle; get it wrong and the
        league is decided by week one. Here&rsquo;s how Verdocast scores
        predictions, and why it keeps things competitive.
      </p>

      <h2 className={H2}>The scoring system</h2>
      <p className={P}>
        You predict the exact score of every match. The closer you are, the more
        you score:
      </p>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Exact score - 5 points.</strong> You
          called the precise scoreline.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Correct goal difference - 3 points.</strong>{" "}
          Right margin, wrong score (for non-draws).
        </li>
        <li className={LI}>
          <strong className="text-foreground">Correct result - 2 points.</strong> Right
          winner, or you called the draw.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Anything else - 0.</strong>
        </li>
      </ul>

      <h2 className={H2}>A worked example</h2>
      <p className={P}>
        Say a match ends <strong className="text-foreground">2-1</strong>. Predict
        2-1 and you bank 5. Predict 3-2 (right margin, wrong score) and you get 3.
        Predict 1-0 (right winner) and you get 2. Predict a draw or an away win
        and you get 0.
      </p>
      <p className={P}>
        One nuance: the goal-difference bonus only applies to non-draws. Every
        draw has a goal difference of zero, so predicting 1-1 for a 0-0 earns the
        result points (2), not the goal-difference bonus.
      </p>

      <h2 className={H2}>Why it works</h2>
      <p className={P}>
        It&rsquo;s simple enough that anyone can join without knowing a thing about
        football, but layered enough that judgement is rewarded - calling a tight
        2-1 is worth more than a vague punt on the winner. And because every match
        is worth points, nobody is ever mathematically out. The leaderboard stays
        alive, and so does the banter.
      </p>

      <h2 className={H2}>See it in action</h2>
      <p className={`${P} text-foreground`}>
        <Link href="/start" className="text-primary underline">
          Start a free league
        </Link>{" "}
        for your team, or{" "}
        <Link href="/play" className="text-primary underline">
          join the global league
        </Link>{" "}
        - scores update automatically the moment matches finish. New to it all?
        Read{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          how to run a prediction league
        </Link>
        .
      </p>
    </div>
  );
}
