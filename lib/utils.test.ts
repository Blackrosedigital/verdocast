import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// Smoke test: proves the Vitest + path-alias setup works. Real coverage targets
// (lib/scoring.ts, lib/tournament.ts) arrive in PR 3 / PR 8.
describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("de-duplicates conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
