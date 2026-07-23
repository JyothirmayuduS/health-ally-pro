#!/usr/bin/env node
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

const BASE = "http://127.0.0.1:8787";
const EMAIL = "pharmacy@oakhaven.demo";
const PASS = "MedoraDemo!2026Rx";
const SQL = `SELECT desk, record_key, updated_at, pg_column_size(payload)
FROM hospital_desk_records
WHERE desk IN ('pharmacy','lab','reception')
ORDER BY desk, record_key;`;

function runPgSql() {
  try {
    return execSync("node --env-file=.env.local scripts/desk-records-sql.mjs", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
}

async function runRest(label) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  console.log(`\n$ node --env-file=.env.local -e "service_role REST ${label}"`);
  console.log("-- SQL attempted:");
  console.log(SQL);
  const { data, error } = await sb
    .from("hospital_desk_records")
    .select("desk,record_key,updated_at,payload")
    .in("desk", ["pharmacy", "lab", "reception"])
    .order("desk")
    .order("record_key");
  if (error) {
    console.log(error);
    return null;
  }
  console.log(
    " desk          | record_key                      | updated_at                      | pg_column_size",
  );
  console.log(
    "---------------+---------------------------------+---------------------------------+---------------",
  );
  for (const r of data ?? []) {
    const bytes = Buffer.byteLength(JSON.stringify(r.payload ?? {}), "utf8");
    console.log(
      ` ${String(r.desk).padEnd(13)} | ${String(r.record_key).padEnd(31)} | ${String(r.updated_at).padEnd(31)} | ${bytes}`,
    );
  }
  console.log(`(${data?.length ?? 0} rows)`);
  return data;
}

async function dispense() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  console.log("\n$ playwright: login pharmacy + dispense one Rx");
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/pharmacy|\/login/, { timeout: 30000 });
  await page.goto(`${BASE}/pharmacy/dispense`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const rxBtn = page.locator("button:has(span.font-mono)").filter({ hasText: /RX-/ }).first();
  const rxText = (await rxBtn.count()) ? await rxBtn.innerText() : "";
  if (await rxBtn.count()) await rxBtn.click();
  await page.waitForTimeout(500);

  const start = page.getByRole("button", { name: /start picking/i });
  if (await start.count()) {
    await start.click();
    await page.waitForTimeout(800);
  }

  const pick = page.getByRole("button", { name: /^Pick \d+/ }).first();
  if (await pick.count()) {
    await pick.click();
    await page.waitForTimeout(800);
  }

  const witness = page.locator('[data-testid="dispense-witness"]');
  if (await witness.count()) await witness.fill("Witness Test ID-99");

  const complete = page.getByRole("button", { name: /complete dispense/i });
  if (await complete.count()) {
    await complete.click();
    await page.waitForTimeout(2000);
  }

  const statusText = await page.locator("body").innerText();
  console.log("selected_rx:", rxText.split("\n")[0] || "none");
  console.log("final_url:", page.url());
  console.log(
    "status_snippet:",
    statusText.match(/ready pickup|dispensed|collected|dispensing|ready to dispense/i)?.[0] ||
      "unknown",
  );
  await browser.close();
}

console.log("=== BEFORE ===");
const pgBefore = runPgSql();
console.log("$ node --env-file=.env.local scripts/desk-records-sql.mjs");
console.log(pgBefore.trim());
const before = pgBefore.includes("ERROR: SUPABASE_DB_PASSWORD") ? await runRest("BEFORE") : null;

await dispense();
await new Promise((r) => setTimeout(r, 4000));

console.log("\n=== AFTER ===");
const pgAfter = runPgSql();
console.log("$ node --env-file=.env.local scripts/desk-records-sql.mjs");
console.log(pgAfter.trim());
const after = pgAfter.includes("ERROR: SUPABASE_DB_PASSWORD") ? await runRest("AFTER") : null;

if (before && after) {
  console.log("\n=== DELTA ===");
  console.log("updated_at:", before[0]?.updated_at, "->", after[0]?.updated_at);
  console.log(
    "payload_bytes:",
    Buffer.byteLength(JSON.stringify(before[0]?.payload ?? {}), "utf8"),
    "->",
    Buffer.byteLength(JSON.stringify(after[0]?.payload ?? {}), "utf8"),
  );
}
