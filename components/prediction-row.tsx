"use client";

import { useEffect, useRef, useState } from "react";
import { submitPrediction } from "@/lib/predictions";
import { useToast } from "@/hooks/use-toast";
import type { PredictMatch } from "@/components/predictions-grid";

type SaveState = "idle" | "saving" | "saved" | "error";

const DOT: Record<SaveState, { color: string; label: string } | null> = {
  idle: null,
  saving: { color: "var(--amber)", label: "Saving…" },
  saved: { color: "var(--green)", label: "Saved" },
  error: { color: "var(--accent-2)", label: "Retry" },
};

function ScoreInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-12 rounded-md border border-border bg-surface-2 text-center font-mono text-lg text-foreground outline-none focus:border-ring disabled:opacity-60"
    />
  );
}

export function PredictionRow({
  leagueCode,
  match,
  onSaved,
}: {
  leagueCode: string;
  match: PredictMatch;
  onSaved: (matchId: string) => void;
}) {
  const { toast } = useToast();
  const [home, setHome] = useState(
    match.prediction ? String(match.prediction.homeScore) : "",
  );
  const [away, setAway] = useState(
    match.prediction ? String(match.prediction.awayScore) : "",
  );
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const kickoff = new Date(match.kickoffUtc);
  const time = kickoff.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  function scheduleSave(h: string, a: string) {
    if (timer.current) clearTimeout(timer.current);
    const hi = Number.parseInt(h, 10);
    const ai = Number.parseInt(a, 10);
    if (h === "" || a === "" || Number.isNaN(hi) || Number.isNaN(ai)) {
      setState("idle");
      return;
    }
    if (hi < 0 || hi > 20 || ai < 0 || ai > 20) {
      setState("error");
      return;
    }
    setState("saving");
    timer.current = setTimeout(async () => {
      const res = await submitPrediction({
        leagueCode,
        matchId: match.id,
        homeScore: hi,
        awayScore: ai,
      });
      if (res.ok) {
        setState("saved");
        onSaved(match.id);
      } else {
        setState("error");
        toast({
          title: "Couldn’t save prediction",
          description: res.error,
          variant: "destructive",
        });
      }
    }, 500);
  }

  // ---- Locked row (kickoff passed) ----
  if (match.locked) {
    const finished = match.status === "finished";
    return (
      <div className="flex items-center gap-3 px-4 py-3 opacity-80">
        <span className="w-12 font-mono text-xs text-muted-foreground">
          {time}
        </span>
        <span className="flex-1 truncate text-right text-sm text-foreground">
          {match.homeTeam}
        </span>
        <div className="flex items-center gap-2">
          {finished ? (
            <span className="font-mono text-lg text-foreground">
              {match.homeScore}–{match.awayScore}
            </span>
          ) : (
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Locked
            </span>
          )}
        </div>
        <span className="flex-1 truncate text-left text-sm text-foreground">
          {match.awayTeam}
        </span>
        <span className="w-24 text-right font-mono text-xs text-muted-foreground">
          {match.prediction
            ? `you ${match.prediction.homeScore}–${match.prediction.awayScore}${
                match.prediction.pointsEarned != null
                  ? ` · ${match.prediction.pointsEarned} pt`
                  : ""
              }`
            : "no pick"}
        </span>
      </div>
    );
  }

  // ---- Open row (editable) ----
  const dot = DOT[state];
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-12 font-mono text-xs text-muted-foreground">
        {time}
      </span>
      <span className="flex-1 truncate text-right text-sm font-medium text-foreground">
        {match.homeTeam}
      </span>
      <div className="flex items-center gap-1.5">
        <ScoreInput
          value={home}
          label={`${match.homeTeam} score`}
          onChange={(v) => {
            setHome(v);
            scheduleSave(v, away);
          }}
        />
        <span className="text-muted-foreground">–</span>
        <ScoreInput
          value={away}
          label={`${match.awayTeam} score`}
          onChange={(v) => {
            setAway(v);
            scheduleSave(home, v);
          }}
        />
      </div>
      <span className="flex-1 truncate text-left text-sm font-medium text-foreground">
        {match.awayTeam}
      </span>
      <span className="flex w-24 items-center justify-end gap-1.5">
        {dot && (
          <>
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: dot.color }}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {dot.label}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
