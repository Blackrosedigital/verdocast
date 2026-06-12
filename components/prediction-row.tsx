"use client";

import { useEffect, useRef, useState } from "react";
import { submitPrediction } from "@/lib/predictions";
import { useToast } from "@/hooks/use-toast";
import { GroupPill } from "@/components/group-pill";
import type { PredictMatch } from "@/components/predictions-grid";

type SaveState = "idle" | "saving" | "saved" | "error";

const DOT: Record<SaveState, { color: string; label: string } | null> = {
  idle: null,
  saving: { color: "var(--amber)", label: "Saving" },
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
      className="h-10 w-11 rounded-md border border-border bg-surface-2 text-center font-mono text-lg text-foreground outline-none focus:border-ring disabled:opacity-60 sm:w-12"
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

  const TimeCol = (
    <div className="w-12 shrink-0 sm:w-16">
      <div className="font-mono text-[11px] text-foreground sm:text-xs">{time}</div>
      <div className="hidden truncate font-mono text-[10px] text-muted-foreground sm:block">
        {match.venueCity}
      </div>
    </div>
  );

  const HomeTeam = (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
      <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
        {match.homeCode}
      </span>
      <span className="truncate text-sm font-medium text-foreground">
        {match.homeTeam}
      </span>
      <span className="text-lg leading-none">{match.homeFlag}</span>
    </div>
  );

  const AwayTeam = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="text-lg leading-none">{match.awayFlag}</span>
      <span className="truncate text-sm font-medium text-foreground">
        {match.awayTeam}
      </span>
      <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
        {match.awayCode}
      </span>
    </div>
  );

  // ---- Locked row (kickoff passed) ----
  if (match.locked) {
    const finished = match.status === "finished";
    const live = match.status === "live";
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 opacity-90 sm:gap-3 sm:px-4">
        <GroupPill letter={match.groupLetter} />
        {TimeCol}
        {HomeTeam}
        <div className="flex w-20 shrink-0 flex-col items-center">
          {finished || live ? (
            <span className="font-mono text-lg text-foreground">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Locked
            </span>
          )}
          {live && (
            <span
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: "var(--accent-2)" }}
            >
              Live
            </span>
          )}
        </div>
        {AwayTeam}
        <span className="hidden w-20 shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:block">
          {match.prediction
            ? `you ${match.prediction.homeScore}-${match.prediction.awayScore}${
                match.prediction.pointsEarned != null
                  ? ` · ${match.prediction.pointsEarned}pt`
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
    <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
      <GroupPill letter={match.groupLetter} />
      {TimeCol}
      {HomeTeam}
      <div className="flex shrink-0 items-center gap-1.5">
        <ScoreInput
          value={home}
          label={`${match.homeTeam} score`}
          onChange={(v) => {
            setHome(v);
            scheduleSave(v, away);
          }}
        />
        <span className="text-muted-foreground">-</span>
        <ScoreInput
          value={away}
          label={`${match.awayTeam} score`}
          onChange={(v) => {
            setAway(v);
            scheduleSave(home, v);
          }}
        />
      </div>
      {AwayTeam}
      <span className="flex w-6 shrink-0 items-center justify-end gap-1.5 sm:w-20">
        {dot && (
          <>
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: dot.color }}
            />
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              {dot.label}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
