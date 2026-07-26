/**
 * Evidence-gathering walkthrough for UI/UX audit.
 * Saves screenshots under docs/evidence/ui-audit/ and a JSON notes file.
 *
 * Usage: node scripts/ui-audit-walkthrough.mjs
 * Requires: playwright installed, Vite on BASE_URL (default http://127.0.0.1:8787)
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const OUT = path.resolve("docs/evidence/ui-audit");
fs.mkdirSync(OUT, { recursive: true });

const roles = [
  {
    id: "doctor",
    email: "doctor@oakhaven.demo",
    password: "MedoraDemo!2026Doc",
    steps: [
      { name: "01-home", path: "/doctor" },
      { name: "02-queue", path: "/doctor/queue" },
      { name: "03-patients", path: "/doctor/patients" },
      { name: "04-orders", path: "/doctor/orders" },
      { name: "05-prescriptions", path: "/doctor/prescriptions" },
      { name: "06-encounters", path: "/doctor/encounters" },
      { name: "07-specialty", path: "/doctor/specialty" },
      { name: "08-results", path: "/doctor/results" },
    ],
  },
  {
    id: "admin",
    email: "admin@oakhaven.demo",
    password: "MedoraDemo!2026Admin",
    steps: [
      { name: "01-home", path: "/admin" },
      { name: "02-staff", path: "/admin/staff" },
      { name: "03-doctors", path: "/admin/doctors" },
      { name: "04-branches", path: "/admin/branches" },
      { name: "05-audit", path: "/admin/audit" },
      { name: "06-ot", path: "/admin/ot" },
      { name: "07-occupancy", path: "/admin/occupancy" },
      { name: "08-revenue", path: "/admin/revenue" },
    ],
  },
  {
    id: "reception",
    email: "reception@oakhaven.demo",
    password: "MedoraDemo!2026Front",
    steps: [
      { name: "01-home", path: "/reception" },
      { name: "02-register", path: "/reception/register" },
      { name: "03-check-in", path: "/reception/check-in" },
      { name: "04-queue", path: "/reception/queue" },
      { name: "05-appointments", path: "/reception/appointments" },
      { name: "06-billing", path: "/reception/billing" },
      { name: "07-patients", path: "/reception/patients" },
    ],
  },
  {
    id: "lab",
    email: "lab@oakhaven.demo",
    password: "MedoraDemo!2026Lab",
    steps: [
      { name: "01-home", path: "/lab" },
      { name: "02-orders", path: "/lab/orders" },
      { name: "03-collection", path: "/lab/collection" },
      { name: "04-processing", path: "/lab/processing" },
      { name: "05-reports", path: "/lab/reports" },
    ],
  },
  {
    id: "pharmacy",
    email: "pharmacy@oakhaven.demo",
    password: "MedoraDemo!2026Rx",
    steps: [
      { name: "01-home", path: "/pharmacy" },
      { name: "02-prescriptions", path: "/pharmacy/prescriptions" },
      { name: "03-dispense", path: "/pharmacy/dispense" },
      { name: "04-inventory", path: "/pharmacy/inventory" },
      { name: "05-billing", path: "/pharmacy/billing" },
    ],
  },
  {
    id: "nursing",
    email: "nursing@oakhaven.demo",
    password: "MedoraDemo!2026Nurse",
    steps: [
      { name: "01-home", path: "/nursing" },
      { name: "02-patients", path: "/nursing/patients" },
      { name: "03-vitals", path: "/nursing/vitals" },
      { name: "04-beds", path: "/nursing/beds" },
    ],
  },
  {
    id: "billing",
    email: "billing@oakhaven.demo",
    password: "MedoraDemo!2026Bill",
    steps: [
      { name: "01-home", path: "/billing" },
      { name: "02-invoices", path: "/billing/invoices" },
      { name: "03-payments", path: "/billing/payments" },
      { name: "04-encounters", path: "/billing/encounters" },
    ],
  },
  {
    id: "patient",
    email: "patient@oakhaven.demo",
    password: "MedoraDemo!2026Patient",
    steps: [
      { name: "01-care", path: "/care" },
      { name: "02-visits", path: "/care/visits" },
      { name: "03-book", path: "/book" },
    ],
  },
];

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByPlaceholder("you@hospital.demo").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(2500);
}

async function shot(page, roleId, name, notes) {
  const dir = path.join(OUT, roleId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  const url = page.url();
  const title = await page.title();
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  const stubSignals = [];
  const lower = bodyText.toLowerCase();
  for (const s of [
    "coming soon",
    "placeholder",
    "not implemented",
    "demo data",
    "sample data",
    "local only",
    "mock",
    "todo",
    "under construction",
    "seed",
  ]) {
    if (lower.includes(s)) stubSignals.push(s);
  }
  // overflow / mobile break heuristics
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyOverflowX: document.body.scrollWidth > window.innerWidth + 2,
  }));
  notes.push({
    role: roleId,
    step: name,
    url,
    title,
    screenshot: path.relative(process.cwd(), file),
    stubSignals,
    horizontalOverflow: metrics.bodyOverflowX || metrics.scrollWidth > metrics.clientWidth + 8,
    viewport: await page.viewportSize(),
    textPreview: bodyText.slice(0, 400).replace(/\s+/g, " "),
  });
  return file;
}

async function walkRole(browser, role, mobile = false) {
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } },
  );
  const page = await context.newPage();
  const notes = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await login(page, role.email, role.password);
    const suffix = mobile ? "mobile" : "desktop";
    await shot(page, role.id, `00-post-login-${suffix}`, notes);
    for (const step of role.steps) {
      await page.goto(`${BASE}${step.path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(1500);
      await shot(page, role.id, `${step.name}-${suffix}`, notes);
    }
  } catch (err) {
    notes.push({
      role: role.id,
      step: "FATAL",
      error: String(err),
      url: page.url(),
    });
  }

  await context.close();
  return { role: role.id, mobile, notes, consoleErrors: consoleErrors.slice(0, 40) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Landing + login baseline
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const notes = [];
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await shot(page, "_marketing", "01-landing-desktop", notes);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await shot(page, "_marketing", "01-landing-mobile", notes);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await shot(page, "_marketing", "02-login-desktop", notes);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await shot(page, "_marketing", "02-login-mobile", notes);
    results.push({ role: "_marketing", notes, consoleErrors: [] });
    await page.close();
  }

  for (const role of roles) {
    console.error(`Walking ${role.id} desktop...`);
    results.push(await walkRole(browser, role, false));
    console.error(`Walking ${role.id} mobile...`);
    results.push(await walkRole(browser, role, true));
  }

  await browser.close();

  const outFile = path.join(OUT, "walkthrough-raw.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, results }, null, 2),
  );
  console.log(outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
