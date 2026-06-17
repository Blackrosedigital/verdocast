import Link from "next/link";

const H2 = "mt-10 font-display text-2xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

export function EnglandCroatiaBody() {
  return (
    <div>
      <p className={`${P} mt-0`}>
        It&rsquo;s the pick of the Group L openers:{" "}
        <Link
          href="/world-cup-2026/team/england"
          className="text-primary underline"
        >
          England
        </Link>{" "}
        face{" "}
        <Link
          href="/world-cup-2026/team/croatia"
          className="text-primary underline"
        >
          Croatia
        </Link>{" "}
        at AT&amp;T Stadium in Arlington. Kick-off is 9:00pm BST (3:00pm ET).
        Here&rsquo;s the lowdown - and how to get your score prediction in before
        the whistle.
      </p>

      <h2 className={H2}>A rivalry with history</h2>
      <p className={P}>
        These two don&rsquo;t need much introduction to each other. Croatia ended
        England&rsquo;s run in the 2018 World Cup semi-final; England got a measure
        of revenge at Euro 2020. Thomas Tuchel&rsquo;s England against Zlatko
        Dalić&rsquo;s Croatia is a proper tournament opener - two sides that
        know how to navigate a long summer.
      </p>

      <h2 className={H2}>What to expect</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">Midfield is the battleground.</strong>{" "}
          Croatia&rsquo;s control versus England&rsquo;s energy will likely decide
          the tempo.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Openers are often cagey.</strong> First
          games in a group tend to be tight - nobody wants to lose the opener.
        </li>
        <li className={LI}>
          <strong className="text-foreground">Group L is wide open.</strong> With Ghana
          and Panama to come, a positive start matters for all four sides.
        </li>
      </ul>

      <h2 className={H2}>How to predict it</h2>
      <p className={P}>
        Tournament openers between well-matched sides rarely produce a hatful of
        goals - a tight 1-0, 2-1, or a 1-1 draw are all sensible calls. And
        remember, you don&rsquo;t need the exact score to score points: a correct
        result still earns you 2 (see{" "}
        <Link
          href="/blog/prediction-league-scoring-explained"
          className="text-primary underline"
        >
          how scoring works
        </Link>
        ).
      </p>

      <h2 className={H2}>Get your prediction in</h2>
      <p className={`${P} text-foreground`}>
        Don&rsquo;t just watch it - call it. Check the{" "}
        <Link
          href="/world-cup-2026/group/l"
          className="text-primary underline"
        >
          Group L table and fixtures
        </Link>
        , then{" "}
        <Link href="/start" className="text-primary underline">
          start a free league
        </Link>{" "}
        for your team or{" "}
        <Link href="/play" className="text-primary underline">
          join the global league
        </Link>{" "}
        and predict England v Croatia before kick-off.
      </p>
    </div>
  );
}
