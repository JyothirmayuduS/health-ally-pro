import { test, expect } from "@playwright/test";

test.describe("Appointments and OPD Phase 2", () => {
  test("reception booking, check-in and queue surfaces remain reachable", async ({
    page,
  }) => {
    await page.goto("/reception/appointments/new");
    await expect(page.locator("body")).toContainText(/appointment|book/i);

    await page.goto("/reception/check-in");
    await expect(page.locator("body")).toContainText(/check.?in|walk.?in/i);

    await page.goto("/reception/queue");
    await expect(page.locator("body")).toContainText(/queue|waiting|token/i);
  });

  test("token board and doctor live queue are responsive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/reception/token-board");
    await expect(page.locator("body")).toContainText(/token|queue|serving/i);

    await page.goto("/doctor/queue");
    await expect(page.locator("body")).toContainText(/queue|serving|waiting/i);
  });

  test("existing patient and clinical links are preserved", async ({ page }) => {
    await page.goto("/reception/patients");
    await expect(page.getByTestId("patients-page")).toBeVisible();
    await expect(page.locator('a[href*="appointments/new"]').first()).toBeVisible();
  });
});
