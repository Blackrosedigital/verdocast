import { createAdminClient } from "@/lib/db";
import { sendMatchdayReminder } from "@/lib/email";
import { matchdayUnitLabel } from "@/lib/matchday";
import {
  formatDeadline,
  nextReminderMatchday,
  selectReminderTargets,
  REMINDER_WINDOW_HOURS,
} from "@/lib/reminders";
import { summariseMatchdays } from "@/lib/season";

/**
 * The weekly ritual: one reminder per member per matchday, in the 24 hours
 * before it locks.
 *
 * Driven by active seasons, like ingestion — no competition is named in code.
 * Every send is recorded in `matchday_reminders`, whose unique constraint is
 * what keeps a 15-minute cron from emailing the same person all day.
 *
 * Sends are sequential on purpose. This is the one job that touches real
 * people's inboxes, so a provider failure partway through should stop after
 * one bad send rather than fan out; and the volume (a league's unpredicted
 * members, once a week) never justifies the concurrency.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Fixtures listed in the email body before "+ N more". */
const FIXTURE_PREVIEW = 3;

export interface ReminderLeagueSummary {
  league: string;
  competition: string;
  matchday: number;
  eligible: number;
  sent: number;
  failed: number;
}

export interface ReminderSummary {
  ok: boolean;
  reason?: string;
  leagues: ReminderLeagueSummary[];
  sent: number;
  failed: number;
}

export async function sendMatchdayReminders(opts?: {
  now?: Date;
  windowHours?: number;
  /** Log what would be sent without sending or recording anything. */
  dryRun?: boolean;
}): Promise<ReminderSummary> {
  const now = opts?.now ?? new Date();
  const windowHours = opts?.windowHours ?? REMINDER_WINDOW_HOURS;
  const dryRun = opts?.dryRun ?? false;

  const admin = createAdminClient();

  const { data: seasons } = await admin
    .from("seasons")
    .select("id, label, competitions!inner(name, kind)")
    .eq("status", "active");

  if (!seasons || seasons.length === 0) {
    return { ok: true, reason: "no active seasons", leagues: [], sent: 0, failed: 0 };
  }

  const summaries: ReminderLeagueSummary[] = [];

  for (const season of seasons) {
    const competition = Array.isArray(season.competitions)
      ? season.competitions[0]
      : season.competitions;
    const competitionName = competition?.name ?? "";
    const unitLabel = matchdayUnitLabel(competition?.kind ?? "league");

    const { data: seasonFixtures } = await admin
      .from("fixtures")
      .select("matchday, kickoff_utc, status")
      .eq("season_id", season.id);

    const due = nextReminderMatchday(
      summariseMatchdays(seasonFixtures ?? []).map((m) => ({
        matchday: m.matchday,
        firstKickoff: m.firstKickoff,
      })),
      now,
      windowHours,
    );
    if (!due) continue;

    const { data: fixtures } = await admin
      .from("fixtures")
      .select("id, home_team_id, away_team_id, kickoff_utc")
      .eq("season_id", season.id)
      .eq("matchday", due.matchday)
      .order("kickoff_utc", { ascending: true });
    const fixtureIds = (fixtures ?? []).map((f) => f.id);
    if (fixtureIds.length === 0) continue;

    const teamIds = [
      ...new Set(
        (fixtures ?? [])
          .flatMap((f) => [f.home_team_id, f.away_team_id])
          .filter((id): id is string => !!id),
      ),
    ];
    const { data: teams } = teamIds.length
      ? await admin.from("teams").select("id, name").in("id", teamIds)
      : { data: [] };
    const teamName = new Map((teams ?? []).map((t) => [t.id, t.name]));
    const preview = (fixtures ?? []).slice(0, FIXTURE_PREVIEW).map((f) => ({
      home: (f.home_team_id && teamName.get(f.home_team_id)) || "TBD",
      away: (f.away_team_id && teamName.get(f.away_team_id)) || "TBD",
    }));

    // Leagues playing this season whose window has already opened. A league
    // starting at matchday 6 is not reminded about matchday 4.
    const { data: leagues } = await admin
      .from("leagues")
      .select("id, name, join_code, start_matchday")
      .eq("season_id", season.id)
      .is("deleted_at", null);

    for (const league of leagues ?? []) {
      if (league.start_matchday != null && due.matchday < league.start_matchday) continue;

      const [membersRes, predsRes, sentRes] = await Promise.all([
        admin.from("members").select("id, email, display_name").eq("league_id", league.id),
        admin
          .from("predictions")
          .select("member_id, match_id")
          .in("match_id", fixtureIds),
        admin
          .from("matchday_reminders")
          .select("member_id")
          .eq("league_id", league.id)
          .eq("matchday", due.matchday),
      ]);

      const memberRows = membersRes.data ?? [];
      if (memberRows.length === 0) continue;

      const predictedCount = new Map<string, number>();
      for (const p of predsRes.data ?? []) {
        predictedCount.set(p.member_id, (predictedCount.get(p.member_id) ?? 0) + 1);
      }

      const targets = selectReminderTargets({
        members: memberRows.map((m) => ({
          id: m.id,
          email: m.email,
          displayName: m.display_name,
          predicted: predictedCount.get(m.id) ?? 0,
        })),
        totalFixtures: fixtureIds.length,
        alreadyRemindedMemberIds: (sentRes.data ?? []).map((r) => r.member_id),
      });

      const summary: ReminderLeagueSummary = {
        league: league.name,
        competition: competitionName,
        matchday: due.matchday,
        eligible: targets.length,
        sent: 0,
        failed: 0,
      };

      if (!dryRun) {
        const deadline = formatDeadline(due.firstKickoff);
        const predictUrl = `${SITE_URL}/league/${league.join_code}/predict?md=${due.matchday}`;

        for (const target of targets) {
          const result = await sendMatchdayReminder(target.email, {
            leagueName: league.name,
            competitionName,
            unitLabel,
            matchday: due.matchday,
            deadline,
            predicted: target.predicted,
            total: fixtureIds.length,
            predictUrl,
            fixtures: preview,
          });

          if (result.ok) {
            // Recorded only after a successful send: a member who was never
            // emailed because the provider was down should be picked up by the
            // next run, not marked done.
            await admin.from("matchday_reminders").insert({
              league_id: league.id,
              member_id: target.memberId,
              matchday: due.matchday,
              outstanding: target.outstanding,
            });
            summary.sent += 1;
          } else if (!("skipped" in result && result.skipped)) {
            summary.failed += 1;
          }
        }
      }

      summaries.push(summary);
    }
  }

  return {
    ok: true,
    leagues: summaries,
    sent: summaries.reduce((n, s) => n + s.sent, 0),
    failed: summaries.reduce((n, s) => n + s.failed, 0),
  };
}
