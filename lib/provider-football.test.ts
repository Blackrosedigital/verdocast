import { describe, expect, it } from "vitest";
import {
  mapProviderStatus,
  mapRound,
  ninetyMinuteScore,
  resultChar,
} from "@/lib/provider-football";

describe("mapRound", () => {
  it("maps Premier League gameweeks to regular/matchday", () => {
    expect(mapRound("Regular Season - 1")).toEqual({ stage: "regular", matchday: 1 });
    expect(mapRound("Regular Season - 38")).toEqual({ stage: "regular", matchday: 38 });
  });

  it("maps Champions League league-phase matchdays", () => {
    expect(mapRound("League Stage - 2")).toEqual({ stage: "league_phase", matchday: 2 });
    expect(mapRound("League Stage - 8")).toEqual({ stage: "league_phase", matchday: 8 });
  });

  // The trap: the provider calls the AUGUST QUALIFYING play-off "Play-offs",
  // and February's knockout play-off "Knockout Round Play-offs". Matching
  // loosely on "play-off" silently pulls 14 qualifying fixtures into the
  // season; these two cases must never converge.
  it("rejects the August qualifying play-off but keeps February's knockout play-off", () => {
    expect(mapRound("Play-offs")).toBeNull();
    expect(mapRound("play-offs")).toBeNull();
    expect(mapRound("Playoffs")).toBeNull();
    expect(mapRound("Knockout Round Play-offs")).toEqual({
      stage: "playoff",
      matchday: null,
    });
  });

  it("rejects every qualifying round", () => {
    expect(mapRound("1st Qualifying Round")).toBeNull();
    expect(mapRound("2nd Qualifying Round")).toBeNull();
    expect(mapRound("3rd Qualifying Round")).toBeNull();
  });

  it("maps knockout rounds, checking the -finals before the bare Final", () => {
    expect(mapRound("Round of 16")).toEqual({ stage: "r16", matchday: null });
    expect(mapRound("Quarter-finals")).toEqual({ stage: "qf", matchday: null });
    expect(mapRound("Semi-finals")).toEqual({ stage: "sf", matchday: null });
    expect(mapRound("3rd Place Final")).toEqual({ stage: "third", matchday: null });
    expect(mapRound("Final")).toEqual({ stage: "final", matchday: null });
  });

  it("returns null for rounds it does not recognise", () => {
    expect(mapRound("")).toBeNull();
    expect(mapRound("Friendlies")).toBeNull();
    expect(mapRound("Regular Season - abc")).toBeNull();
  });
});

describe("mapProviderStatus", () => {
  it("treats extra time and penalties as finished", () => {
    for (const s of ["FT", "AET", "PEN"]) {
      expect(mapProviderStatus(s)).toBe("finished");
    }
  });

  it("maps in-play codes to live", () => {
    for (const s of ["1H", "HT", "2H", "ET", "LIVE"]) {
      expect(mapProviderStatus(s)).toBe("live");
    }
  });

  it("maps abandonments and postponements to postponed", () => {
    for (const s of ["PST", "CANC", "ABD"]) {
      expect(mapProviderStatus(s)).toBe("postponed");
    }
  });

  // Unknown codes must default to scheduled, so the prediction window stays
  // governed by kickoff time rather than by a code we don't recognise.
  it("defaults unknown codes to scheduled", () => {
    expect(mapProviderStatus("NS")).toBe("scheduled");
    expect(mapProviderStatus("WHAT")).toBe("scheduled");
  });
});

describe("ninetyMinuteScore", () => {
  // A tie won in extra time or on penalties is a DRAW for prediction
  // purposes: `goals` includes extra time, so a finished fixture must read
  // score.fulltime.
  it("uses the 90-minute score for a finished fixture that went to extra time", () => {
    const fx = {
      goals: { home: 3, away: 2 },
      score: { fulltime: { home: 1, away: 1 } },
    };
    expect(ninetyMinuteScore(fx, "finished")).toEqual({ home: 1, away: 1 });
  });

  it("falls back to live goals when there is no fulltime score yet", () => {
    const fx = { goals: { home: 2, away: 0 }, score: { fulltime: null } };
    expect(ninetyMinuteScore(fx, "live")).toEqual({ home: 2, away: 0 });
  });

  it("does not use fulltime for a live fixture", () => {
    const fx = {
      goals: { home: 1, away: 0 },
      score: { fulltime: { home: null, away: null } },
    };
    expect(ninetyMinuteScore(fx, "live")).toEqual({ home: 1, away: 0 });
  });
});

describe("resultChar", () => {
  it("returns H/D/A", () => {
    expect(resultChar(2, 1)).toBe("H");
    expect(resultChar(1, 1)).toBe("D");
    expect(resultChar(0, 2)).toBe("A");
  });

  it("returns null when the score is incomplete", () => {
    expect(resultChar(null, 1)).toBeNull();
    expect(resultChar(1, null)).toBeNull();
  });
});
