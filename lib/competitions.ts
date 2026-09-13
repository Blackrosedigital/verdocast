import { createAdminClient } from "@/lib/db";
import { matchdayUnitLabel } from "@/lib/matchday";
import { firstFullyOpenMatchday, summariseMatchdays } from "@/lib/season";

/**
 * The competitions someone can start a league in, and where that league would
 * begin.
 *
 * Driven by active seasons, so adding a competition is a row plus a seed run,
 * never a code change — the same principle the ingestion job follows.
 */

export interface JoinableCompetition {
  seasonId: string;
  competitionSlug: string;
  competitionName: string;
  shortName: string | null;
  seasonLabel: string;
  /** "Gameweek" or "Matchday". */
  unitLabel: string;
  /** Where a league created now would start scoring. Null if none are left. */
  startMatchday: number | null;
  totalMatchdays: number | null;
  /** Matchdays left to play from startMatchday — the honest size of the offer. */
  remainingMatchdays: number;
  /** ISO first kickoff of that matchday, for a "starts in N days" line. */
  startsAt: string | null;
  /** Season end, for the license expiry a league created now should get. */
  endsOn: string | null;
}

export async function listJoinableCompetitions(
  now: Date = new Date(),
): Promise<JoinableCompetition[]> {
  const admin = createAdminClient();

  const { data: seasons } = await admin
    .from("seasons")
    .select(
      "id, label, ends_on, total_matchdays, competitions!inner(slug, name, short_name, kind)",
    )
    .eq("status", "active");

  if (!seasons || seasons.length === 0) return [];

  const out: JoinableCompetition[] = [];

  for (const season of seasons) {
    const competition = Array.isArray(season.competitions)
      ? season.competitions[0]
      : season.competitions;
    if (!competition) continue;

    const { data: fixtures } = await admin
      .from("fixtures")
      .select("matchday, kickoff_utc, status")
      .eq("season_id", season.id);

    const matchdays = summariseMatchdays(fixtures ?? []);
    // A season with no matchdays is a tournament (the World Cup), which this
    // flow does not create leagues for.
    if (matchdays.length === 0) continue;

    const startMatchday = firstFullyOpenMatchday(matchdays, now);
    const start = matchdays.find((m) => m.matchday === startMatchday) ?? null;

    out.push({
      seasonId: season.id,
      competitionSlug: competition.slug,
      competitionName: competition.name,
      shortName: competition.short_name,
      seasonLabel: season.label,
      unitLabel: matchdayUnitLabel(competition.kind),
      startMatchday,
      totalMatchdays: season.total_matchdays,
      remainingMatchdays:
        startMatchday == null
          ? 0
          : matchdays.filter((m) => m.matchday >= startMatchday).length,
      startsAt: start?.firstKickoff ?? null,
      endsOn: season.ends_on,
    });
  }

  // Soonest to start first: the competition someone can act on this week is
  // the one worth offering first.
  return out.sort((a, b) => {
    if (a.startsAt && b.startsAt) return a.startsAt.localeCompare(b.startsAt);
    if (a.startsAt) return -1;
    if (b.startsAt) return 1;
    return a.competitionName.localeCompare(b.competitionName);
  });
}

/**
 * License expiry for a league in this season: the season's end plus 90 days'
 * grace, so standings stay readable after the final matchday.
 *
 * Falls back to a year out when a season has no recorded end — the Champions
 * League's is not confirmed, and a license that expires too early is worse
 * than one that expires too late.
 */
export function licenseExpiryFor(
  endsOn: string | null,
  now: Date = new Date(),
): string {
  if (endsOn) {
    const end = new Date(endsOn);
    if (!Number.isNaN(end.getTime())) {
      end.setDate(end.getDate() + 90);
      return end.toISOString();
    }
  }
  const fallback = new Date(now);
  fallback.setFullYear(fallback.getFullYear() + 1);
  return fallback.toISOString();
}
