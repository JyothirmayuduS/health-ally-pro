import { test, expect } from "@playwright/test";

/**
 * Reception patient management smoke — local registry + UI contracts.
 * Does not assert live Supabase PHI (demo/offline fallback path).
 */
test.describe("patient management reception", () => {
  test("register page exposes step flow", async ({ page }) => {
    await page.goto("/reception/register");
    await expect(page.getByTestId("register-page")).toBeVisible();
    await expect(page.getByText(/identity|section|patient/i).first()).toBeVisible();
  });

  test("patients workspace search is available", async ({ page }) => {
    await page.goto("/reception/patients");
    await expect(page.getByTestId("patients-page")).toBeVisible();
    await expect(page.getByTestId("patients-search")).toBeVisible();
  });

  test("patient self-service health record route loads", async ({ page }) => {
    await page.goto("/profile/health-record");
    await expect(page.locator("body")).toContainText(/health record|patient|consent|document|profile/i);
  });
});
