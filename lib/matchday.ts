import type { PredictMatch } from "@/components/predictions-grid";
import { createAdminClient } from "@/lib/db";
import {
  matchdayState,
  resolveMatchday,
  summariseMatchdays,
  type MatchdayState,
  type MatchdaySummary,
} from "@/lib/season";

/**
 * Loads the matchday-shaped predict view for a league: which matchday to show,
 * that matchday's fixtures with the member's predictions attached, and enough
 * season context to navigate.
 *
 * Only for leagues bound to a season WITH matchdays — Premier League gameweeks
 * and Champions League league-phase matchdays. A World Cup league has a null
 * matchday on every fixture and keeps the original all-fixtures view, so
 * `isMatchdaySeason` is the branch the page switches on.
 */

export interface MatchdaySeasonInfo {
  seasonId: string;
  seasonLabel: string;
  competitionName: string;
  competitionShortName: string | null;
  /** 'league' | 'cup' | 'tournament' — decides Gameweek vs Matchday wording. */
  competitionKind: string;
  totalMatchdays: number | null;
}

/** A domestic league runs gameweeks; the UCL league phase runs matchdays.
 *  Using the crowd's own word for it matters more here than consistency. */
export function matchdayUnitLabel(competitionKind: string): string {
  return competitionKind === "league" ? "Gameweek" : "Matchday";
}

export interface MatchdayView {
  isMatchdaySeason: boolean;
  season: MatchdaySeasonInfo | null;
  matchdays: MatchdaySummary[];
  current: MatchdaySummary | null;
  state: MatchdayState | null;
  startMatchday: number | null;
  fixtures: PredictMatch[];
  prevMatchday: number | null;
  nextMatchday: number | null;
}

const EMPTY: MatchdayView = {
  isMatchdaySeason: false,
  season: null,
  matchdays: [],
  current: null,
  state: null,
  startMatchday: null,
  fixtures: [],
  prevMatchday: null,
  nextMatchday: null,
};

interface FixtureRow {
  id: string;
  code: string | null;
  kickoff_utc: string;
  matchday: number | null;
  group_label: string | null;
  stage: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  venue_city: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  short_code: string | null;
  primary_color: string | null;
  flag_emoji: string | null;
}

/** Knockout stage badges. League stages get no badge — a gameweek needs none. */
const STAGE_LABEL: Record<string, string | null> = {
  regular: null,
  league_phase: null,
  group: null,
  playoff: "PO",
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  third: "3rd",
  final: "Final",
};

export async function loadMatchdayView(opts: {
  leagueId: string;
  seasonId: string | null;
  startMatchday: number | null;
  memberId: string;
  requestedMatchday?: string | null;
  now?: Date;
}): Promise<MatchdayView> {
  if (!opts.seasonId) return EMPTY;
  const admin = createAdminClient();
  const now = opts.now ?? new Date();

  const { data: season } = await admin
    .from("seasons")
    .select("id, label, total_matchdays, competitions!inner(name, short_name, kind)")
    .eq("id", opts.seasonId)
    .maybeSingle();
  if (!season) return EMPTY;

  const competition = Array.isArray(season.competitions)
    ? season.competitions[0]
    : season.competitions;

  // Every fixture in the season, for the matchday index. Cheap: 380 narrow
  // rows for the Premier League, and it powers navigation across the season.
  const { data: all } = await admin
    .from("fixtures")
    .select("matchday, kickoff_utc, status")
    .eq("season_id", opts.seasonId);

  const matchdays = summariseMatchdays(all ?? []);
  if (matchdays.length === 0) return EMPTY;

  const currentMatchday = resolveMatchday({
    requested: opts.requestedMatchday,
    matchdays,
    startMatchday: opts.startMatchday,
    now,
  });
  const current = matchdays.find((m) => m.matchday === currentMatchday) ?? null;

  const info: MatchdaySeasonInfo = {
    seasonId: season.id,
    seasonLabel: season.label,
    competitionName: competition?.name ?? "",
    competitionShortName: competition?.short_name ?? null,
    competitionKind: competition?.kind ?? "league",
    totalMatchdays: season.total_matchdays,
  };

  if (!current) {
    return { ...EMPTY, isMatchdaySeason: true, season: info, matchdays,
      startMatchday: opts.startMatchday };
  }

  const { data: fixtureRows } = await admin
    .from("fixtures")
    .select(
      "id, code, kickoff_utc, matchday, group_label, stage, status, home_score, away_score, venue, venue_city, home_team_id, away_team_id",
    )
    .eq("season_id", opts.seasonId)
    .eq("matchday", current.matchday)
    .order("kickoff_utc", { ascending: true });

  const rows = (fixtureRows ?? []) as FixtureRow[];

  const teamIds = [
    ...new Set(
      rows.flatMap((f) => [f.home_team_id, f.away_team_id]).filter((id): id is string => !!id),
    ),
  ];
  const { data: teamRows } = teamIds.length
    ? await admin
        .from("teams")
        .select("id, name, short_code, primary_color, flag_emoji")
        .in("id", teamIds)
    : { data: [] as TeamRow[] };
  const teamById = new Map((teamRows ?? []).map((t) => [t.id, t as TeamRow]));

  const { data: preds } = await admin
    .from("predictions")
    .select("match_id, home_score, away_score, points_earned")
    .eq("member_id", opts.memberId)
    .in("match_id", rows.map((f) => f.id));
  const predByFixture = new Map((preds ?? []).map((p) => [p.match_id, p]));

  const nowMs = now.getTime();
  const fixtures: PredictMatch[] = rows.map((f) => {
    const home = f.home_team_id ? teamById.get(f.home_team_id) : undefined;
    const away = f.away_team_id ? teamById.get(f.away_team_id) : undefined;
    const pred = predByFixture.get(f.id);
    return {
      id: f.id,
      matchCode: f.code ?? f.id.slice(0, 8),
      kickoffUtc: f.kickoff_utc,
      homeTeam: home?.name ?? "TBD",
      awayTeam: away?.name ?? "TBD",
      homeFlag: home?.flag_emoji ?? "",
      awayFlag: away?.flag_emoji ?? "",
      homeCode: home?.short_code ?? "",
      awayCode: away?.short_code ?? "",
      homeColor: home?.primary_color ?? null,
      awayColor: away?.primary_color ?? null,
      venue: f.venue,
      venueCity: f.venue_city,
      groupLetter: f.group_label,
      stageLabel: STAGE_LABEL[f.stage] ?? null,
      status: f.status,
      homeScore: f.home_score,
      awayScore: f.away_score,
      locked: new Date(f.kickoff_utc).getTime() <= nowMs,
      prediction: pred
        ? {
            homeScore: pred.home_score,
            awayScore: pred.away_score,
            pointsEarned: pred.points_earned,
          }
        : null,
    };
  });

  const index = matchdays.findIndex((m) => m.matchday === current.matchday);

  return {
    isMatchdaySeason: true,
    season: info,
    matchdays,
    current,
    state: matchdayState(current, opts.startMatchday, now),
    startMatchday: opts.startMatchday,
    fixtures,
    prevMatchday: index > 0 ? matchdays[index - 1]!.matchday : null,
    nextMatchday:
      index >= 0 && index < matchdays.length - 1 ? matchdays[index + 1]!.matchday : null,
  };
}
