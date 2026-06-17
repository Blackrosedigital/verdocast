import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";

export function RecapBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        The 2026 World Cup is over, and thousands of people spent a month
        predicting it together - in offices, group chats and communities. Here are
        a few things we learned about what makes a prediction league actually work.
      </p>

      <h2 className={H2}>1. The quiet ones win</h2>
      <p className={P}>
        Time and again, the office leaderboard was topped by someone who&rsquo;d
        never claim to be a football expert. Predicting scores rewards calm
        judgement over loud opinions - which is exactly why it&rsquo;s so
        inclusive, and so fun.
      </p>

      <h2 className={H2}>2. Automatic scoring is everything</h2>
      <p className={P}>
        The leagues that thrived were the ones nobody had to run. No spreadsheets,
        no manual tallying, no chasing - just predictions in and points out. Take
        the admin away and people simply enjoy it.
      </p>

      <h2 className={H2}>3. The knockouts carried the energy</h2>
      <p className={P}>
        Engagement didn&rsquo;t fade after the groups - it spiked. Single-
        elimination drama, a fresh shot for everyone, and a tightening leaderboard
        kept teams talking right up to the final.
      </p>

      <h2 className={H2}>4. It&rsquo;s a culture win, not a gimmick</h2>
      <p className={P}>
        For hybrid and remote teams especially, a shared, low-effort ritual did
        more for connection than most organised activities. The leaderboard became
        the watercooler - exactly as intended.
      </p>

      <h2 className={H2}>Until the next one</h2>
      <p className={`${P} text-foreground`}>
        Thanks to everyone who played. The tournament may be done, but the idea
        isn&rsquo;t - and we&rsquo;ll be back for the next big one. In the
        meantime, see{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          how a prediction league works
        </Link>{" "}
        and keep it in your back pocket for your team.
      </p>
    </div>
  );
}
