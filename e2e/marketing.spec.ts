import { test, expect } from "@playwright/test";

test.describe("Medora marketing & trust surfaces", () => {
  test("buyer home loads Medora brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Medora").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Start hospital/i }).first()).toBeVisible();
  });

  test("pricing and register funnel", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/register-hospital");
    await expect(page.getByRole("heading", { name: /Register your hospital/i })).toBeVisible();
  });

  test("trust pack + BAA downloads + status API", async ({ page, request }) => {
    await page.goto("/trust");
    await expect(page.getByRole("heading", { name: /Trust pack/i })).toBeVisible();

    await page.goto("/legal/baa");
    await expect(page.getByRole("heading", { name: /BAA & DPA pack/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /BAA template/i })).toBeVisible();

    const status = await request.get("/api/status");
    expect(status.ok()).toBeTruthy();
    const body = await status.json();
    expect(body).toHaveProperty("status");
    expect(Array.isArray(body.checks)).toBeTruthy();

    const baa = await request.get("/legal/baa-template.md");
    expect(baa.ok()).toBeTruthy();
    expect(await baa.text()).toContain("Business Associate");
  });

  test("security and SLA pages", async ({ page }) => {
    await page.goto("/security");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.goto("/sla");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
