import { test, expect } from "@playwright/test";

test.describe("EMR/EHR phase 3", () => {
  test("doctor EMR route renders workspace chrome", async ({ page }) => {
    await page.goto("/doctor/emr/MRN-1001");
    await expect(page.getByTestId("doctor-emr-page")).toBeVisible();
    await expect(page.getByTestId("emr-workspace")).toBeVisible();
    await expect(page.getByTestId("emr-tab-timeline")).toBeVisible();
    await expect(page.getByTestId("emr-tab-soap")).toBeVisible();
    await expect(page.getByTestId("emr-tab-diagnoses")).toBeVisible();
  });

  test("patient chart embeds EMR workspace", async ({ page }) => {
    await page.goto("/doctor/patients/MRN-1001");
    await expect(page.locator("#patient-emr-workspace")).toBeVisible();
    await expect(page.getByTestId("emr-workspace")).toBeVisible();
  });
});
