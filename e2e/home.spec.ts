import { expect, test } from "@playwright/test";

// Smoke test: the placeholder home page renders. The full happy-path e2e
// (buy → onboard → predict → score → leaderboard) lands in PR 10.
test("home page renders the Verdocast wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /verdocast/i })).toBeVisible();
});
