import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { MatchdayReminderEmail } from "@/emails/matchday-reminder";

const BASE = {
  leagueName: "The Office XI",
  competitionName: "UEFA Champions League",
  unitLabel: "Matchday",
  matchday: 2,
  deadline: "Tuesday 17:45",
  predicted: 3,
  total: 18,
  predictUrl: "https://verdocast.com/league/UCL-DEV/predict?md=2",
  fixtures: [
    { home: "Arsenal", away: "Lille" },
    { home: "Inter", away: "Club Brugge KV" },
    { home: "RB Leipzig", away: "PSV Eindhoven" },
  ],
};

/**
 * The email's visible TEXT, not its markup.
 *
 * React's server renderer separates adjacent interpolated values with `<!-- -->`
 * comments, so "+ {n} more" is emitted as "+ <!-- -->15<!-- --> more" and a
 * raw-HTML assertion for "+ 15 more" fails on an email that is perfectly
 * correct. Asserting on extracted text checks what a reader actually sees.
 */
async function text(overrides: Partial<typeof BASE> = {}) {
  const markup = await render(MatchdayReminderEmail({ ...BASE, ...overrides }));
  return markup
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#8202;|&#8203;/g, " ")
    .replace(/&rsquo;|’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function html(overrides: Partial<typeof BASE> = {}) {
  return render(MatchdayReminderEmail({ ...BASE, ...overrides }));
}

describe("MatchdayReminderEmail", () => {
  it("leads with the matchday and its deadline", async () => {
    const out = await text();
    expect(out).toContain("Matchday 2 locks Tuesday 17:45");
    expect(out).toContain("UEFA Champions League");
    expect(out).toContain("The Office XI");
  });

  it("states exactly how many picks are outstanding", async () => {
    const out = await text({ predicted: 3, total: 18 });
    expect(out).toContain("3 of 18");
    expect(out).toContain("15 still to go");
  });

  it("uses different wording for someone who has picked nothing", async () => {
    const out = await text({ predicted: 0, total: 10 });
    expect(out).toContain("haven't picked any");
    expect(out).toContain("Make my picks");
    expect(out).not.toContain("still to go");
  });

  it("says 'finish' for a partly-complete member", async () => {
    const out = await text({ predicted: 5, total: 10 });
    expect(out).toContain("Finish my picks");
  });

  it("uses the competition's own word for the unit", async () => {
    const out = await text({ unitLabel: "Gameweek", matchday: 5 });
    expect(out).toContain("Gameweek 5 locks");
  });

  it("lists sample fixtures and counts the rest", async () => {
    const out = await text({ total: 18 });
    expect(out).toContain("Arsenal");
    expect(out).toContain("Club Brugge KV");
    expect(out).toContain("+ 15 more");
  });

  it("omits the overflow count when every fixture is listed", async () => {
    const out = await text({ total: 3 });
    expect(out).not.toMatch(/\+\s*\d+\s*more/);
  });

  it("links to the specific matchday, not the generic predict page", async () => {
    const out = await html();
    expect(out).toContain("predict?md=2");
  });

  // Per-match locking is more forgiving than the weekly cut-off people expect
  // from other prediction games, so the email says so.
  it("explains that later games stay open", async () => {
    const out = await text();
    expect(out).toContain("own kickoff");
  });

  it("carries the free-to-play trust line", async () => {
    const out = await text();
    expect(out).toContain("not gambling");
  });

  // The preview line is built as one template string, so it is not subject to
  // the comment-separator problem and can be asserted on raw output.
  it("renders a singular pick in the preview text", async () => {
    const out = await html({ predicted: 9, total: 10 });
    expect(out).toContain("1 pick missing");
    expect(out).not.toContain("1 picks missing");
  });
});
