import { BracketScroll } from "@/components/bracket-scroll";
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

// Official FIFA 2026 bracket order, top to bottom. Our match codes are scheduled
// chronologically (R32_1..16), but the bracket tree pairs them non-sequentially
// (e.g. R16 match 89 = winners of FIFA matches 74 & 77 = our R32_3 & R32_6).
// This array lists every tie in the vertical position it occupies in the tree,
// so adjacent pairs feed the centred match in the next column. Derived from the
// official feeding map (Wikipedia: 2026 FIFA World Cup knockout stage), mapped to
// our codes by date + venue. FIFA match number in the comment beside each code.
const BRACKET_ORDER: Record<string, number> = Object.fromEntries(
  [
    // Round of 32
    "R32_3", // 74
    "R32_6", // 77
    "R32_1", // 73
    "R32_4", // 75
    "R32_12", // 83
    "R32_11", // 84
    "R32_10", // 81
    "R32_9", // 82
    "R32_2", // 76
    "R32_5", // 78
    "R32_7", // 79
    "R32_8", // 80
    "R32_15", // 86
    "R32_14", // 88
    "R32_13", // 85
    "R32_16", // 87
    // Round of 16
    "R16_2", // 89
    "R16_1", // 90
    "R16_5", // 93
    "R16_6", // 94
    "R16_3", // 91
    "R16_4", // 92
    "R16_7", // 95
    "R16_8", // 96
    // Quarter-finals
    "QF_1", // 97
    "QF_2", // 98
    "QF_3", // 99
    "QF_4", // 100
    // Semi-finals
    "SF_1", // 101
    "SF_2", // 102
    // Final
    "FINAL", // 104
  ].map((code, i) => [code, i] as const),
);

function orderOf(code: string): number {
  return BRACKET_ORDER[code] ?? 999;
}

function TeamRow({
  name,
  score,
  result,
}: {
  name: string | null;
  score: number | null;
  result?: "win" | "lose" | null;
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
        {name ?? "TBD"}
      </span>
      {score != null && <span className={styles.score}>{score}</span>}
    </div>
  );
}

function MatchCard({ m }: { m: BracketMatch }) {
  const live = m.status === "live";
  const finished = m.status === "finished";
  // Highlight the advancing team only on a decided (non-draw) 90-minute result.
  // Ties settled on penalties are a 90-minute draw here, so neither is marked.
  const decided =
    finished && m.home_score != null && m.away_score != null && m.home_score !== m.away_score;
  const homeWon = decided && m.home_score! > m.away_score!;
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
        <TeamRow
          name={m.home_team}
          score={m.home_score}
          result={decided ? (homeWon ? "win" : "lose") : null}
        />
        <TeamRow
          name={m.away_team}
          score={m.away_score}
          result={decided ? (homeWon ? "lose" : "win") : null}
        />
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
    arr.sort((a, b) => orderOf(a.match_code) - orderOf(b.match_code));
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
                    <MatchCard key={m.match_code} m={m} />
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
