import { expect, test } from "@playwright/test";

/**
 * Public funnel e2e: landing → pricing → interactive demo scoring. This covers
 * the unauthenticated path with no external services. The full paid happy-path
 * (buy → onboard → invite → predict → score → leaderboard) involves Stripe's
 * hosted checkout + magic-link email and is documented as a manual smoke test
 * in docs/runbook.md.
 */
test("landing → pricing → demo scores points", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /predictor in 5 minutes/i }),
  ).toBeVisible();

  // Into pricing.
  await page.goto("/pricing");
  await expect(page.getByText(/one-time pricing/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /buy pro/i })).toBeVisible();

  // Into the demo: fill every score box, reveal, expect a score.
  await page.goto("/demo");
  const inputs = page.locator('input[type="number"]');
  const count = await inputs.count();
  expect(count).toBeGreaterThanOrEqual(8); // 4 matches × 2 inputs
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill("1");
  }
  await page.getByRole("button", { name: /see how you scored/i }).click();
  await expect(page.getByText(/you scored/i)).toBeVisible();
});
