import type { TeamLineup } from "@/lib/api-football";
import { getTeam } from "@/lib/tournament";

function TeamLineupCard({ team }: { team: TeamLineup }) {
  const flag = getTeam(team.teamName)?.flag;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          {flag && <span className="text-lg">{flag}</span>}
          {team.teamName}
        </span>
        {team.formation && (
          <span className="font-mono text-xs text-muted-foreground">
            {team.formation}
          </span>
        )}
      </div>

      <ol className="mt-4 space-y-1.5">
        {team.startXI.map((p, i) => (
          <li key={`${p.name}-${i}`} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-right font-mono text-xs text-muted-foreground">
              {p.number ?? ""}
            </span>
            <span className="flex-1 text-foreground">{p.name}</span>
            {p.pos && (
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {p.pos}
              </span>
            )}
          </li>
        ))}
      </ol>

      {team.substitutes.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Substitutes
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {team.substitutes.map((p, i) => (
              <li key={`${p.name}-${i}`}>
                <span className="mr-2 font-mono text-xs">{p.number ?? ""}</span>
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {team.coach && (
        <p className="mt-4 text-xs text-muted-foreground">
          Coach: <span className="text-foreground">{team.coach}</span>
        </p>
      )}
    </div>
  );
}

export function MatchLineups({ lineups }: { lineups: TeamLineup[] }) {
  return (
    <section className="mt-6">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Line-ups
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {lineups.map((team, i) => (
          <TeamLineupCard key={`${team.teamName}-${i}`} team={team} />
        ))}
      </div>
    </section>
  );
}
