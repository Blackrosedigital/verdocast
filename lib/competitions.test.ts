import { describe, expect, it } from "vitest";
import { licenseExpiryFor, listJoinableCompetitions } from "@/lib/competitions";

const hasDbEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const dbDescribe = hasDbEnv ? describe : describe.skip;

describe("licenseExpiryFor", () => {
  it("gives 90 days' grace after a season ends, so standings stay readable", () => {
    const expiry = new Date(licenseExpiryFor("2027-05-30"));
    expect(expiry.toISOString().slice(0, 10)).toBe("2027-08-28");
  });

  // The Champions League final date is not confirmed, so its season has no
  // end. A licence that expires too early is worse than one that expires late.
  it("falls back to a year out when a season has no recorded end", () => {
    const now = new Date("2026-09-13T00:00:00Z");
    expect(licenseExpiryFor(null, now).slice(0, 10)).toBe("2027-09-13");
  });

  it("falls back rather than throwing on an unparseable end date", () => {
    const now = new Date("2026-09-13T00:00:00Z");
    expect(licenseExpiryFor("not-a-date", now).slice(0, 10)).toBe("2027-09-13");
  });
});

dbDescribe("listJoinableCompetitions", () => {
  it("offers the seeded season competitions, not the finished World Cup", async () => {
    const out = await listJoinableCompetitions();
    const slugs = out.map((c) => c.competitionSlug);

    expect(slugs).toContain("premier-league");
    expect(slugs).toContain("champions-league");
    // The World Cup season is complete, and every one of its fixtures has a
    // null matchday, so it is not something to start a league in.
    expect(slugs).not.toContain("fifa-world-cup");
  });

  it("reports where a league created now would actually start", async () => {
    const out = await listJoinableCompetitions();
    const pl = out.find((c) => c.competitionSlug === "premier-league")!;
    const ucl = out.find((c) => c.competitionSlug === "champions-league")!;

    expect(pl).toMatchObject({ unitLabel: "Gameweek", totalMatchdays: 38 });
    expect(ucl).toMatchObject({ unitLabel: "Matchday", totalMatchdays: 8 });

    // Both are mid-season, so neither starts at 1.
    expect(pl.startMatchday).toBeGreaterThan(1);
    expect(ucl.startMatchday).toBeGreaterThan(1);

    // The offer has to add up: what's left equals the season minus what's gone.
    expect(pl.remainingMatchdays).toBe(38 - (pl.startMatchday! - 1));
    expect(ucl.remainingMatchdays).toBe(8 - (ucl.startMatchday! - 1));
  });

  it("orders by whichever starts soonest", async () => {
    const out = await listJoinableCompetitions();
    const withDates = out.filter((c) => c.startsAt);
    const sorted = [...withDates].sort((a, b) =>
      a.startsAt!.localeCompare(b.startsAt!),
    );
    expect(withDates.map((c) => c.competitionSlug)).toEqual(
      sorted.map((c) => c.competitionSlug),
    );
  });

  it("gives every competition a start kickoff to show a countdown from", async () => {
    const out = await listJoinableCompetitions();
    for (const c of out.filter((x) => x.startMatchday != null)) {
      expect(c.startsAt).toBeTruthy();
      expect(new Date(c.startsAt!).getTime()).toBeGreaterThan(Date.now());
    }
  });
});
