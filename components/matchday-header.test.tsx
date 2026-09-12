import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchdayHeader, type MatchdayHeaderProps } from "@/components/matchday-header";

// next/link renders a plain anchor under jsdom.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const BASE: MatchdayHeaderProps = {
  leagueCode: "UCL-DEV",
  unitLabel: "Matchday",
  matchday: 2,
  totalMatchdays: 8,
  dateRange: "Tue 13 – Wed 14 Oct",
  deadlineIso: "2026-10-13T16:45:00Z",
  predicted: 3,
  total: 18,
  state: {
    upcoming: true,
    inProgress: false,
    complete: false,
    anyOpen: true,
    beforeLeagueStart: false,
  },
  prevMatchday: 1,
  nextMatchday: 3,
  startMatchday: 2,
  currentMatchday: 2,
};

function renderHeader(overrides: Partial<MatchdayHeaderProps> = {}) {
  return render(<MatchdayHeader {...BASE} {...overrides} />);
}

afterEach(() => vi.useRealTimers());

describe("MatchdayHeader", () => {
  it("names the matchday and its place in the season", () => {
    renderHeader();
    expect(screen.getByText("Matchday 2")).toBeInTheDocument();
    expect(screen.getByText("of 8")).toBeInTheDocument();
    expect(screen.getByText("Tue 13 – Wed 14 Oct")).toBeInTheDocument();
  });

  it("uses the competition's own word for the unit", () => {
    renderHeader({ unitLabel: "Gameweek", matchday: 5, totalMatchdays: 38 });
    expect(screen.getByText("Gameweek 5")).toBeInTheDocument();
  });

  it("shows prediction progress", () => {
    renderHeader();
    expect(screen.getByText("3/18")).toBeInTheDocument();
    expect(screen.getByTitle("3 of 18 predicted")).toBeInTheDocument();
  });

  it("counts down to the deadline for an upcoming matchday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T14:45:00Z")); // 2h before kickoff
    renderHeader();
    expect(screen.getByText(/Locks in/)).toBeInTheDocument();
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
  });

  // Per-match locking is more forgiving than the single weekly cut-off people
  // expect, so a part-played matchday has to say so explicitly.
  it("explains that a part-played matchday is still partly open", () => {
    renderHeader({
      state: { ...BASE.state, upcoming: false, inProgress: true, anyOpen: true },
    });
    expect(screen.getByText(/each locks at its own kickoff/)).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.queryByText(/Locks in/)).not.toBeInTheDocument();
  });

  it("explains a matchday from before the league started", () => {
    renderHeader({
      matchday: 1,
      state: { ...BASE.state, upcoming: false, complete: true, anyOpen: false, beforeLeagueStart: true },
    });
    expect(screen.getByText("Before your league started")).toBeInTheDocument();
    expect(screen.getByText(/score nothing/)).toBeInTheDocument();
  });

  it("marks a finished matchday complete with no countdown", () => {
    renderHeader({
      state: { ...BASE.state, upcoming: false, complete: true, anyOpen: false },
    });
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.queryByText(/Locks in/)).not.toBeInTheDocument();
  });

  it("links to the neighbouring matchdays", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /Matchday 1/ })).toHaveAttribute(
      "href",
      "/league/UCL-DEV/predict?md=1",
    );
    expect(screen.getByRole("link", { name: /Matchday 3/ })).toHaveAttribute(
      "href",
      "/league/UCL-DEV/predict?md=3",
    );
  });

  it("disables navigation at the ends of the season", () => {
    renderHeader({ prevMatchday: null, nextMatchday: null });
    expect(screen.queryByRole("link", { name: /Matchday \d/ })).not.toBeInTheDocument();
  });

  it("offers a jump back when viewing a matchday other than the current one", () => {
    renderHeader({ matchday: 1, currentMatchday: 2 });
    expect(screen.getByRole("link", { name: "Jump to current" })).toHaveAttribute(
      "href",
      "/league/UCL-DEV/predict?md=2",
    );
  });

  // Separate test on purpose: two renders in one test both stay in the
  // document (cleanup runs between tests, not between renders), so asserting
  // absence after a second render would just be counting the first one.
  it("omits the jump when already on the current matchday", () => {
    renderHeader({ matchday: 2, currentMatchday: 2 });
    expect(screen.queryByRole("link", { name: "Jump to current" })).not.toBeInTheDocument();
  });
});
