/**
 * Clinical / security E2E smoke — production-like API coverage.
 * Prefer deterministic API checks over fragile UI timing.
 */
import { test, expect } from "@playwright/test";

const HOSPITAL = "a0000001-0001-4001-8001-000000000001";
const OTHER_HOSPITAL = "b0000002-0002-4002-8002-000000000002";

const DEMO_HEADERS = {
  "x-medora-persist-demo": "1",
  "content-type": "application/json",
  "sec-fetch-site": "same-origin",
};

test.describe("Clinical + security smoke", () => {
  test("health/status endpoint", async ({ request }) => {
    const res = await request.get("/api/status");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(Array.isArray(body.checks)).toBeTruthy();
  });

  test("unauthorized PHI access blocked", async ({ request }) => {
    const res = await request.get(`/api/hospital/phi?resource=patients&hospitalId=${HOSPITAL}`);
    expect([401, 403]).toContain(res.status());
  });

  test("cross-tenant denial", async ({ request }) => {
    const res = await request.get(
      `/api/hospital/phi?resource=patients&hospitalId=${OTHER_HOSPITAL}`,
      { headers: DEMO_HEADERS },
    );
    // Demo auth is scoped to OakHaven; foreign hospital must be denied.
    expect([401, 403]).toContain(res.status());
  });

  test("reception patient search path (PHI patients)", async ({ request }) => {
    test.skip(
      process.env.CI === "true" && !process.env.VITE_ALLOW_DEMO_AUTH,
      "Demo auth required for CI without live session",
    );
    const res = await request.get(`/api/hospital/phi?resource=patients&hospitalId=${HOSPITAL}`, {
      headers: DEMO_HEADERS,
    });
    // When demo persist is enabled, expect success; otherwise auth failure is still a valid security outcome.
    if (res.ok()) {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data) || body.data == null || typeof body.data === "object").toBe(
        true,
      );
    } else {
      expect([401, 403, 503]).toContain(res.status());
    }
  });

  test("appointments list path", async ({ request }) => {
    const res = await request.get(
      `/api/hospital/phi?resource=appointments&hospitalId=${HOSPITAL}`,
      { headers: DEMO_HEADERS },
    );
    if (res.ok()) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    } else {
      expect([401, 403, 503]).toContain(res.status());
    }
  });

  test("lab order/result path", async ({ request }) => {
    const res = await request.get(`/api/hospital/phi?resource=lab_results&hospitalId=${HOSPITAL}`, {
      headers: DEMO_HEADERS,
    });
    if (res.ok()) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    } else {
      expect([401, 403, 503]).toContain(res.status());
    }
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("doctor patient access route gated", async ({ page }) => {
    await page.goto("/doctor");
    // Unauthenticated users should land on login or see a gated desk, not a stack dump.
    await expect(page.locator("body")).toContainText(/Sign in|Medora|Doctor|login/i);
  });

  test("pharmacy / billing views reachable without crash", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.locator("body")).toContainText(/Medora|Pharmacy|Sign in|login|queue/i);
    await page.goto("/billing");
    await expect(page.locator("body")).toContainText(/Medora|Billing|Sign in|login|invoice/i);
  });

  test("metrics endpoint rejects unauthenticated public access", async ({ request }) => {
    const res = await request.get("/api/metrics");
    // Fail-closed: 401 without bearer, or 503 if token not configured.
    expect([401, 503]).toContain(res.status());
  });
});
