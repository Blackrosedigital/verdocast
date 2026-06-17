import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function PredictionVsFantasyBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        Fantasy football and prediction leagues are both great ways to get a group
        invested in the game - but they&rsquo;re very different beasts. If
        you&rsquo;re choosing one for your team, here&rsquo;s how they compare.
      </p>

      <h2 className={H2}>Fantasy football</h2>
      <p className={P}>
        You draft a squad of real players and score based on their real-world
        performances - goals, assists, clean sheets. It&rsquo;s deep and rewarding,
        but it asks a lot: you need to know players, manage transfers, and keep up
        week to week. For a casual or mixed group, that&rsquo;s a high barrier, and
        the less football-literate quickly fall behind.
      </p>

      <h2 className={H2}>Prediction league</h2>
      <p className={P}>
        You predict the score of each match. That&rsquo;s it. No squads, no
        transfers, no homework. Anyone can join and do well - the person who never
        watches football beats the die-hard all the time. It&rsquo;s lighter, more
        inclusive, and far easier to run for a whole team.
      </p>

      <h2 className={H2}>Which should a team pick?</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Want maximum depth for keen fans?</strong>{" "}
          Fantasy football.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Want everyone to take part, with zero
          admin?</strong>{" "}
          A prediction league - especially for a one-off tournament.
        </li>
      </ul>
      <p className={P}>
        For an office, a friend group, or a community where football knowledge
        varies wildly, inclusivity usually wins. A prediction league gets everyone
        to the table; fantasy tends to reward the few.
      </p>

      <h2 className={H2}>Try the inclusive one</h2>
      <p className={`${P} text-foreground`}>
        <Link href="/start" className="text-primary underline">
          Start a free prediction league
        </Link>{" "}
        in two minutes, or read{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          how to run one
        </Link>
        .
      </p>
    </div>
  );
}
