import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function KnockoutStageBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        With the group stage wrapping up, the 2026 World Cup gets serious. For the
        first time the knockouts start at a <strong className="text-foreground">Round
        of 32</strong> - here&rsquo;s how the bracket works, the key dates, and how
        to keep predicting all the way to the final.
      </p>

      <h2 className={H2}>How teams qualify</h2>
      <p className={P}>
        From the 12 groups, the <strong className="text-foreground">top two in each</strong>{" "}
        go through, joined by the{" "}
        <strong className="text-foreground">eight best third-placed teams</strong> -
        32 teams in total into a straight knockout.
      </p>

      <h2 className={H2}>The rounds and dates</h2>
      <ul className="mt-4 space-y-2 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Round of 32</strong> - 28 June to 3 July
        </li>
        <li className={LI}>
          <strong className="text-foreground">Round of 16</strong> - 4 to 7 July
        </li>
        <li className={LI}>
          <strong className="text-foreground">Quarter-finals</strong> - 9 to 11 July
        </li>
        <li className={LI}>
          <strong className="text-foreground">Semi-finals</strong> - 14 and 15 July
        </li>
        <li className={LI}>
          <strong className="text-foreground">Third-place play-off</strong> - 18 July
        </li>
        <li className={LI}>
          <strong className="text-foreground">Final</strong> - 19 July
        </li>
      </ul>

      <h2 className={H2}>One slip and you&rsquo;re out</h2>
      <p className={P}>
        Knockout football is single-elimination: no second chances, extra time and
        penalties if level. That&rsquo;s what makes it the most dramatic - and the
        most fun to predict - part of the tournament. A group leader can be gone by
        teatime; an underdog can ride a hot goalkeeper to the semis.
      </p>

      <h2 className={H2}>Keep your league going</h2>
      <p className={`${P} text-foreground`}>
        Don&rsquo;t let your prediction league fizzle out when the groups end - the
        knockouts are when it gets tense. Check the{" "}
        <Link href="/world-cup-2026" className="text-primary underline">
          fixtures and live tables
        </Link>
        , and{" "}
        <Link href="/start" className="text-primary underline">
          start a free league
        </Link>{" "}
        if you haven&rsquo;t already.
      </p>
    </div>
  );
}
