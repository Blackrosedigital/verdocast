import Link from "next/link";
import { BracketScroll } from "@/components/bracket-scroll";
import { KickoffLabel } from "@/components/kickoff-label";
import { bracketOrderOf, KO_FEEDERS } from "@/lib/knockout";
import { getTeam } from "@/lib/tournament";
import styles from "@/components/bracket.module.css";

export interface BracketMatch {
  match_code: string;
  stage: string;
  home_team: string | null;
  away_team: string | null;
  kickoff_utc: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
}

// The bracket tree (third-place play-off is shown separately).
const ROUNDS = [
  { key: "r32", label: "Round of 32" },
  { key: "r16", label: "Round of 16" },
  { key: "qf", label: "Quarter-finals" },
  { key: "sf", label: "Semi-finals" },
  { key: "final", label: "Final" },
] as const;

const SHORT_STAGE: Record<string, string> = {
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final",
};

/** The team that has advanced from a feeder tie, once it is decided on the
 * 90-minute result. Null while the tie is unplayed or level (a pen shootout is
 * a 90-minute draw here, so the winner is unknown from our data). */
function slotWinner(
  feederCode: string | undefined,
  byCode: Map<string, BracketMatch>,
): string | null {
  if (!feederCode) return null;
  const f = byCode.get(feederCode);
  if (!f || f.status !== "finished") return null;
  if (f.home_score == null || f.away_score == null) return null;
  if (f.home_score === f.away_score) return null;
  return f.home_score > f.away_score ? f.home_team : f.away_team;
}

/** Label for an undecided slot: "NED / MAR" if the feeder tie has teams, else
 * "R16 winner" etc. The slot's winner comes from that feeder match. */
function feederLabel(
  feederCode: string | undefined,
  byCode: Map<string, BracketMatch>,
): string | null {
  if (!feederCode) return null;
  const f = byCode.get(feederCode);
  if (!f) return null;
  if (f.home_team && f.away_team) {
    const a = getTeam(f.home_team)?.code ?? f.home_team;
    const b = getTeam(f.away_team)?.code ?? f.away_team;
    return `${a} / ${b}`;
  }
  return `${SHORT_STAGE[f.stage] ?? "Match"} winner`;
}

function TeamRow({
  name,
  score,
  result,
  feeder,
}: {
  name: string | null;
  score: number | null;
  result?: "win" | "lose" | null;
  feeder?: string | null;
}) {
  const team = name ? getTeam(name) : undefined;
  const resultClass =
    result === "win" ? styles.win : result === "lose" ? styles.lose : "";
  return (
    <div className={`${styles.team} ${resultClass}`}>
      {team?.flag ? (
        <span className={styles.flag}>{team.flag}</span>
      ) : name ? (
        <span className={styles.flag} />
      ) : (
        <span className={styles.placeholder} />
      )}
      <span className={`${styles.name} ${name ? "" : styles.tbd}`}>
        {name ?? feeder ?? "TBD"}
      </span>
      {score != null && <span className={styles.score}>{score}</span>}
    </div>
  );
}

function MatchCard({
  m,
  byCode,
}: {
  m: BracketMatch;
  byCode: Map<string, BracketMatch>;
}) {
  const live = m.status === "live";
  const finished = m.status === "finished";
  // Highlight the advancing team only on a decided (non-draw) 90-minute result.
  // Ties settled on penalties are a 90-minute draw here, so neither is marked.
  const decided =
    finished && m.home_score != null && m.away_score != null && m.home_score !== m.away_score;
  const homeWon = decided && m.home_score! > m.away_score!;
  const feeders = KO_FEEDERS[m.match_code];
  // Use our resolved team if ingestion has filled it; otherwise advance the
  // feeder tie's winner the moment it is decided, before the official draw.
  const homeName = m.home_team ?? slotWinner(feeders?.[0], byCode);
  const awayName = m.away_team ?? slotWinner(feeders?.[1], byCode);
  return (
    <div className={styles.match}>
      <Link
        href={`/world-cup-2026/match/${m.match_code.toLowerCase()}`}
        className={styles.card}
        aria-label={`Match details: ${homeName ?? "TBD"} versus ${awayName ?? "TBD"}`}
      >
        <div className={styles.kickoff}>
          {live ? (
            <span style={{ color: "var(--accent-2)" }}>LIVE</span>
          ) : finished ? (
            "Full time"
          ) : (
            <KickoffLabel iso={m.kickoff_utc} />
          )}
        </div>
        <TeamRow
          name={homeName}
          score={m.home_score}
          result={decided ? (homeWon ? "win" : "lose") : null}
          feeder={feederLabel(feeders?.[0], byCode)}
        />
        <TeamRow
          name={awayName}
          score={m.away_score}
          result={decided ? (homeWon ? "lose" : "win") : null}
          feeder={feederLabel(feeders?.[1], byCode)}
        />
      </Link>
    </div>
  );
}

export function KnockoutBracket({ matches }: { matches: BracketMatch[] }) {
  const byStage = new Map<string, BracketMatch[]>();
  const byCode = new Map<string, BracketMatch>();
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
    byCode.set(m.match_code, m);
  }
  for (const arr of byStage.values()) {
    arr.sort((a, b) => bracketOrderOf(a.match_code) - bracketOrderOf(b.match_code));
  }
  const third = byStage.get("third")?.[0];

  return (
    <div>
      <BracketScroll>
        <div className={styles.bracket}>
          {ROUNDS.map((round) => {
            const ties = byStage.get(round.key) ?? [];
            if (ties.length === 0) return null;
            return (
              <div key={round.key} className={styles.round}>
                <div className={styles.title}>{round.label}</div>
                <div className={styles.body}>
                  {ties.map((m) => (
                    <MatchCard key={m.match_code} m={m} byCode={byCode} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </BracketScroll>

      {third && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Third-place play-off
          </p>
          <Link
            href={`/world-cup-2026/match/${third.match_code.toLowerCase()}`}
            className="mt-2 block max-w-xs rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <div className="mb-1.5 font-mono text-[11px] text-muted-foreground">
              {third.status === "live" ? (
                <span style={{ color: "var(--accent-2)" }}>LIVE</span>
              ) : third.status === "finished" ? (
                "Full time"
              ) : (
                <KickoffLabel iso={third.kickoff_utc} />
              )}
            </div>
            <TeamRow name={third.home_team} score={third.home_score} />
            <TeamRow name={third.away_team} score={third.away_score} />
          </Link>
        </div>
      )}
    </div>
  );
}
