import { test, expect } from "@playwright/test";

test.describe("doctor workspace phase 4", () => {
  test("workspace board chrome loads", async ({ page }) => {
    await page.goto("/doctor/workspace");
    await expect(page.getByTestId("doctor-workspace")).toBeVisible();
    await expect(page.getByTestId("dw-appointments")).toBeVisible();
    await expect(page.getByTestId("dw-queue")).toBeVisible();
    await expect(page.getByText(/Enterprise consult board|Workspace/i).first()).toBeVisible();
  });
});
