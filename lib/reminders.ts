/**
 * Who gets a matchday reminder, and when.
 *
 * Pure, no I/O. Deciding whom to email is exactly the logic that must not be
 * discovered to be wrong in production: the failure mode is not a broken page,
 * it is a real person emailed at 3am, or emailed five times, or emailed about
 * a gameweek that already locked. All of that is decided here and tested.
 */

/** How long before the first kickoff the nudge goes out. */
export const REMINDER_WINDOW_HOURS = 24;

export interface ReminderMatchdayCandidate {
  matchday: number;
  /** ISO first kickoff of the matchday — the deadline. */
  firstKickoff: string;
}

/**
 * Is this matchday inside its reminder window?
 *
 * True only while the deadline is still AHEAD. A matchday that locked an hour
 * ago is not a reminder, it is a taunt — and the "some games are still open"
 * case is deliberately not chased here, because a nudge about a gameweek you
 * already partly missed reads as a failure, not a prompt.
 */
export function isInReminderWindow(
  firstKickoff: string,
  now: Date = new Date(),
  windowHours: number = REMINDER_WINDOW_HOURS,
): boolean {
  const kickoff = new Date(firstKickoff).getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(kickoff)) return false;
  const msUntil = kickoff - nowMs;
  return msUntil > 0 && msUntil <= windowHours * 60 * 60 * 1000;
}

/**
 * The next matchday due a reminder, or null.
 *
 * Picks the EARLIEST matchday inside the window. Two matchdays can qualify at
 * once mid-week in the Champions League; the one about to lock is the one
 * worth an email.
 */
export function nextReminderMatchday(
  candidates: ReminderMatchdayCandidate[],
  now: Date = new Date(),
  windowHours: number = REMINDER_WINDOW_HOURS,
): ReminderMatchdayCandidate | null {
  const due = candidates
    .filter((c) => isInReminderWindow(c.firstKickoff, now, windowHours))
    .sort((a, b) => a.firstKickoff.localeCompare(b.firstKickoff));
  return due[0] ?? null;
}

export interface ReminderMember {
  id: string;
  email: string;
  displayName: string;
  /** How many of this matchday's fixtures they have predicted. */
  predicted: number;
}

export interface ReminderTarget {
  memberId: string;
  email: string;
  displayName: string;
  predicted: number;
  outstanding: number;
}

/**
 * Which members to email for a matchday.
 *
 * Two exclusions, both deliberate:
 *  - Members who have predicted everything. "You're all set" is not a
 *    reminder, it is noise, and noise is what gets a weekly email muted.
 *  - Members already reminded for this matchday, via the unique constraint in
 *    0010. The cron runs every 15 minutes across a window hours wide, so this
 *    is the difference between one email and dozens.
 */
export function selectReminderTargets(opts: {
  members: ReminderMember[];
  totalFixtures: number;
  alreadyRemindedMemberIds: Iterable<string>;
}): ReminderTarget[] {
  const { members, totalFixtures } = opts;
  const sent = new Set(opts.alreadyRemindedMemberIds);

  if (totalFixtures <= 0) return [];

  return members
    .filter((m) => !sent.has(m.id))
    .filter((m) => m.predicted < totalFixtures)
    .map((m) => ({
      memberId: m.id,
      email: m.email,
      displayName: m.displayName,
      predicted: m.predicted,
      outstanding: totalFixtures - m.predicted,
    }));
}

/**
 * The deadline as a person reads it: "Saturday 12:30".
 *
 * Formatted server-side because an email has no browser to ask. That means it
 * is rendered in ONE timezone for every recipient — the competition's, which
 * is a better guess than the server's UTC for a league playing in it, but is
 * still a guess for anyone watching from elsewhere.
 */
export function formatDeadline(
  iso: string,
  timeZone = "Europe/London",
  locale = "en-GB",
): string {
  return new Date(iso).toLocaleString(locale, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}
