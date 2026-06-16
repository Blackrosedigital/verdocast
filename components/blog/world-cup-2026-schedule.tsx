import Link from "next/link";
import { getAllTeams, getMatchesByGroup } from "@/lib/tournament";

const H2 = "mt-10 font-display text-3xl tracking-wide text-foreground";
const P = "mt-4 text-lg leading-relaxed text-muted-foreground";
const LI = "text-lg leading-relaxed text-muted-foreground";

const GROUPS = "ABCDEFGHIJKL".split("");

/** First-last date range for a group, e.g. "11-24 Jun". UTC for determinism. */
function groupDates(letter: string): string {
  const ms = getMatchesByGroup(letter).map((m) =>
    new Date(m.kickoff_utc).getTime(),
  );
  if (ms.length === 0) return "";
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const lo = fmt(Math.min(...ms));
  const hi = fmt(Math.max(...ms));
  return lo === hi ? lo : `${lo} - ${hi}`;
}

/** Body for the WC2026 schedule post. Renders live group/team data. */
export function ScheduleBody() {
  const teams = getAllTeams();
  const byGroup = GROUPS.map((letter) => ({
    letter,
    dates: groupDates(letter),
    teams: teams.filter((t) => t.group_letter === letter),
  }));

  return (
    <div>
      <p className={`${P} mt-0`}>
        The 2026 World Cup is the biggest ever: <strong className="text-foreground">48
        teams</strong>, <strong className="text-foreground">12 groups</strong>, and{" "}
        <strong className="text-foreground">72 group-stage matches</strong> across
        the United States, Canada and Mexico. Here&rsquo;s the full group-stage
        schedule — and the easiest way to predict every game.
      </p>

      <h2 className={H2}>How the group stage works</h2>
      <ul className="mt-4 space-y-3 pl-5">
        <li className={LI}>
          <strong className="text-foreground">12 groups (A–L)</strong> of four teams
          each, playing three matches apiece.
        </li>
        <li className={LI}>
          The group stage runs <strong className="text-foreground">11–27 June 2026</strong>.
        </li>
        <li className={LI}>
          The <strong className="text-foreground">top two from every group</strong>,
          plus the <strong className="text-foreground">eight best third-placed teams</strong>,
          advance to a 32-team knockout round.
        </li>
        <li className={LI}>
          Knockouts begin <strong className="text-foreground">28 June</strong>; the
          final is <strong className="text-foreground">19 July 2026</strong>.
        </li>
      </ul>

      <h2 className={H2}>Every group</h2>
      <p className={P}>
        Tap any group for its live table and full fixture list, or a team for its
        squad and matches.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {byGroup.map((g) => (
          <div
            key={g.letter}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/world-cup-2026/group/${g.letter.toLowerCase()}`}
                className="font-display text-2xl tracking-wide text-foreground hover:text-primary"
              >
                Group {g.letter}
              </Link>
              <span className="font-mono text-xs text-muted-foreground">
                {g.dates}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {g.teams.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/world-cup-2026/team/${t.slug}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  >
                    <span className="leading-none">{t.flag ?? ""}</span>
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className={H2}>Turn the schedule into a game</h2>
      <p className={P}>
        Knowing the fixtures is one thing — having a stake in them is better. With
        a free{" "}
        <Link
          href="/blog/world-cup-2026-prediction-league"
          className="text-primary underline"
        >
          prediction league
        </Link>{" "}
        you forecast the score of every match on this schedule, points are scored
        automatically, and a live leaderboard tracks who&rsquo;s calling it best.
      </p>
      <p className={`${P} text-foreground`}>
        <Link href="/start" className="text-primary underline">
          Start a free league
        </Link>{" "}
        for your office or mates, or{" "}
        <Link href="/play" className="text-primary underline">
          join the global league
        </Link>{" "}
        and take on everyone.
      </p>
    </div>
  );
}
