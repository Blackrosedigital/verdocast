import { KickoffLabel } from "@/components/kickoff-label";
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

/** Numeric suffix of a match code (e.g. "R32_5" -> 5) for canonical ordering. */
function codeIndex(code: string): number {
  const n = Number.parseInt(code.split("_")[1] ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

function TeamRow({
  name,
  score,
}: {
  name: string | null;
  score: number | null;
}) {
  const team = name ? getTeam(name) : undefined;
  return (
    <div className={styles.team}>
      {team?.flag ? (
        <span className={styles.flag}>{team.flag}</span>
      ) : name ? (
        <span className={styles.flag} />
      ) : (
        <span className={styles.placeholder} />
      )}
      <span className={`${styles.name} ${name ? "" : styles.tbd}`}>
        {name ?? "TBD"}
      </span>
      {score != null && <span className={styles.score}>{score}</span>}
    </div>
  );
}

function MatchCard({ m }: { m: BracketMatch }) {
  const live = m.status === "live";
  const finished = m.status === "finished";
  return (
    <div className={styles.match}>
      <div className={styles.card}>
        <div className={styles.kickoff}>
          {live ? (
            <span style={{ color: "var(--accent-2)" }}>LIVE</span>
          ) : finished ? (
            "Full time"
          ) : (
            <KickoffLabel iso={m.kickoff_utc} />
          )}
        </div>
        <TeamRow name={m.home_team} score={m.home_score} />
        <TeamRow name={m.away_team} score={m.away_score} />
      </div>
    </div>
  );
}

export function KnockoutBracket({ matches }: { matches: BracketMatch[] }) {
  const byStage = new Map<string, BracketMatch[]>();
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }
  for (const arr of byStage.values()) {
    arr.sort((a, b) => codeIndex(a.match_code) - codeIndex(b.match_code));
  }
  const third = byStage.get("third")?.[0];

  return (
    <div>
      <div className={styles.scroll}>
        <div className={styles.bracket}>
          {ROUNDS.map((round) => {
            const ties = byStage.get(round.key) ?? [];
            if (ties.length === 0) return null;
            return (
              <div key={round.key} className={styles.round}>
                <div className={styles.title}>{round.label}</div>
                <div className={styles.body}>
                  {ties.map((m) => (
                    <MatchCard key={m.match_code} m={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {third && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Third-place play-off
          </p>
          <div className="mt-2 max-w-xs rounded-xl border border-border bg-surface p-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
