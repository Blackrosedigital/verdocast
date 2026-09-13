import { afterEach, describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/db";
import {
  formatDeadline,
  isInReminderWindow,
  nextReminderMatchday,
  selectReminderTargets,
  type ReminderMember,
} from "@/lib/reminders";

const NOW = new Date("2026-10-12T10:00:00Z");

describe("isInReminderWindow", () => {
  it("is true inside the 24 hours before kickoff", () => {
    expect(isInReminderWindow("2026-10-13T09:00:00Z", NOW)).toBe(true);
    expect(isInReminderWindow("2026-10-12T10:30:00Z", NOW)).toBe(true);
  });

  it("is false more than 24 hours out", () => {
    expect(isInReminderWindow("2026-10-14T09:00:00Z", NOW)).toBe(false);
  });

  // A reminder about a deadline that has passed is a taunt, not a nudge.
  it("is false once the deadline has passed", () => {
    expect(isInReminderWindow("2026-10-12T09:59:00Z", NOW)).toBe(false);
    expect(isInReminderWindow("2026-10-01T00:00:00Z", NOW)).toBe(false);
  });

  it("is false exactly at kickoff", () => {
    expect(isInReminderWindow("2026-10-12T10:00:00Z", NOW)).toBe(false);
  });

  it("respects a custom window", () => {
    expect(isInReminderWindow("2026-10-12T14:00:00Z", NOW, 2)).toBe(false);
    expect(isInReminderWindow("2026-10-12T11:30:00Z", NOW, 2)).toBe(true);
  });

  it("is false for an unparseable date rather than throwing", () => {
    expect(isInReminderWindow("not-a-date", NOW)).toBe(false);
  });
});

describe("nextReminderMatchday", () => {
  it("picks the earliest matchday inside the window", () => {
    const due = nextReminderMatchday(
      [
        { matchday: 3, firstKickoff: "2026-10-13T09:00:00Z" },
        { matchday: 2, firstKickoff: "2026-10-12T16:45:00Z" },
      ],
      NOW,
    );
    expect(due?.matchday).toBe(2);
  });

  it("returns null when nothing is due", () => {
    expect(
      nextReminderMatchday([{ matchday: 9, firstKickoff: "2026-11-01T00:00:00Z" }], NOW),
    ).toBeNull();
    expect(nextReminderMatchday([], NOW)).toBeNull();
  });

  it("ignores matchdays that have already locked", () => {
    const due = nextReminderMatchday(
      [
        { matchday: 1, firstKickoff: "2026-10-01T00:00:00Z" },
        { matchday: 2, firstKickoff: "2026-10-12T16:45:00Z" },
      ],
      NOW,
    );
    expect(due?.matchday).toBe(2);
  });
});

describe("selectReminderTargets", () => {
  const members: ReminderMember[] = [
    { id: "ana", email: "ana@example.com", displayName: "Ana", predicted: 0 },
    { id: "ben", email: "ben@example.com", displayName: "Ben", predicted: 7 },
    { id: "cal", email: "cal@example.com", displayName: "Cal", predicted: 10 },
  ];

  it("emails members with picks outstanding", () => {
    const targets = selectReminderTargets({
      members, totalFixtures: 10, alreadyRemindedMemberIds: [],
    });
    expect(targets.map((t) => t.memberId)).toEqual(["ana", "ben"]);
    expect(targets[0]).toMatchObject({ predicted: 0, outstanding: 10 });
    expect(targets[1]).toMatchObject({ predicted: 7, outstanding: 3 });
  });

  // "You're all set" is not a reminder; it is what gets a weekly email muted.
  it("never emails a member who has predicted everything", () => {
    const targets = selectReminderTargets({
      members, totalFixtures: 10, alreadyRemindedMemberIds: [],
    });
    expect(targets.some((t) => t.memberId === "cal")).toBe(false);
  });

  // The cron runs every 15 minutes across a window hours wide.
  it("never emails a member twice for the same matchday", () => {
    const targets = selectReminderTargets({
      members, totalFixtures: 10, alreadyRemindedMemberIds: ["ana"],
    });
    expect(targets.map((t) => t.memberId)).toEqual(["ben"]);
  });

  it("sends nothing when everyone has been reminded", () => {
    expect(
      selectReminderTargets({
        members, totalFixtures: 10, alreadyRemindedMemberIds: ["ana", "ben", "cal"],
      }),
    ).toEqual([]);
  });

  // A matchday with no fixtures loaded would otherwise make everyone look
  // like they had picks outstanding.
  it("sends nothing when the matchday has no fixtures", () => {
    expect(
      selectReminderTargets({ members, totalFixtures: 0, alreadyRemindedMemberIds: [] }),
    ).toEqual([]);
  });

  it("sends nothing for an empty league", () => {
    expect(
      selectReminderTargets({ members: [], totalFixtures: 10, alreadyRemindedMemberIds: [] }),
    ).toEqual([]);
  });
});

describe("formatDeadline", () => {
  it("reads as a person would say it", () => {
    // 16:45 UTC on a Tuesday in October is 17:45 British Summer Time.
    expect(formatDeadline("2026-10-13T16:45:00Z")).toBe("Tuesday 17:45");
  });

  it("honours the timezone it is given", () => {
    expect(formatDeadline("2026-10-13T16:45:00Z", "UTC")).toBe("Tuesday 16:45");
  });
});

/**
 * The double-send guard is ultimately a UNIQUE constraint (migration 0010),
 * not application logic, so it is worth proving against a real database. The
 * failure it prevents — one member emailed every time an hourly cron runs
 * across a 24-hour window — is the worst outcome this feature has.
 */
const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const dbDescribe = hasDbEnv ? describe : describe.skip;

dbDescribe("matchday_reminders constraint", () => {
  const admin = createAdminClient();
  let orgId: string | null = null;

  afterEach(async () => {
    if (orgId) await admin.from("organizations").delete().eq("id", orgId);
    orgId = null;
  });

  async function makeMember() {
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const { data: org } = await admin
      .from("organizations")
      .insert({ name: `RM ${token}`, owner_email: `rm-${token}@example.com` })
      .select()
      .single();
    orgId = org!.id;

    const { data: license } = await admin
      .from("licenses")
      .insert({
        organization_id: org!.id,
        tier: "starter",
        max_members: 50,
        amount_paid_pence: 0,
        expires_at: "2027-12-31T00:00:00Z",
      })
      .select()
      .single();

    const { data: league } = await admin
      .from("leagues")
      .insert({
        organization_id: org!.id,
        license_id: license!.id,
        name: `RM League ${token}`,
        slug: `rm-league-${token}`,
        join_code: `RM-${token}`.toUpperCase(),
        created_by_email: `rm-${token}@example.com`,
      })
      .select()
      .single();

    const { data: member } = await admin
      .from("members")
      .insert({
        league_id: league!.id,
        email: `rm-member-${token}@example.com`,
        display_name: "Reminded",
      })
      .select()
      .single();

    return { league: league!, member: member! };
  }

  it("rejects a second reminder for the same member and matchday", async () => {
    const { league, member } = await makeMember();
    const row = { league_id: league.id, member_id: member.id, matchday: 5, outstanding: 4 };

    const first = await admin.from("matchday_reminders").insert(row);
    expect(first.error).toBeNull();

    const second = await admin.from("matchday_reminders").insert(row);
    expect(second.error).not.toBeNull();
    expect(second.error!.code).toBe("23505"); // unique_violation
  });

  it("allows the same member to be reminded about a different matchday", async () => {
    const { league, member } = await makeMember();
    const base = { league_id: league.id, member_id: member.id, outstanding: 1 };

    expect((await admin.from("matchday_reminders").insert({ ...base, matchday: 5 })).error).toBeNull();
    expect((await admin.from("matchday_reminders").insert({ ...base, matchday: 6 })).error).toBeNull();

    const { data } = await admin
      .from("matchday_reminders")
      .select("matchday")
      .eq("member_id", member.id);
    expect(data?.map((r) => r.matchday).sort()).toEqual([5, 6]);
  });

  it("removes reminders with the member, so a deleted league leaves nothing", async () => {
    const { league, member } = await makeMember();
    await admin
      .from("matchday_reminders")
      .insert({ league_id: league.id, member_id: member.id, matchday: 7, outstanding: 2 });

    await admin.from("organizations").delete().eq("id", orgId!);
    orgId = null;

    const { data } = await admin
      .from("matchday_reminders")
      .select("id")
      .eq("member_id", member.id);
    expect(data).toEqual([]);
  });
});
