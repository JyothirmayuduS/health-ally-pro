/**
 * Live smoke against Supabase (uses .env.local).
 * Run: node --env-file=.env.local --import tsx scripts/smoke-hospital-persist.ts
 * Or: npm run test:smoke
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv();

const HID = "a0000001-0001-4001-8001-000000000001";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(url && key, "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const clientKey = `SCH-smoke-${Date.now().toString(36)}`;
  const { data: chart, error: cErr } = await admin
    .from("specialty_chart_notes")
    .insert({
      hospital_id: HID,
      specialty_id: "cardiology",
      patient_name: "Smoke Test Patient",
      module_id: "smoke_module",
      values: { note: "smoke", ts: new Date().toISOString() },
      client_key: clientKey,
    })
    .select("id, client_key")
    .single();
  assert(!cErr && chart, `chart insert failed: ${cErr?.message}`);

  const { data: again, error: uErr } = await admin
    .from("specialty_chart_notes")
    .update({ values: { note: "smoke-updated" } })
    .eq("hospital_id", HID)
    .eq("client_key", clientKey)
    .select("id")
    .single();
  assert(!uErr && again, `chart update failed: ${uErr?.message}`);

  await admin.from("specialty_chart_notes").delete().eq("client_key", clientKey);

  const { count: doctors } = await admin
    .from("hospital_doctors")
    .select("*", { count: "exact", head: true })
    .eq("hospital_id", HID);
  assert((doctors ?? 0) >= 1, "expected seeded hospital_doctors");

  const { count: units } = await admin
    .from("hospital_unit_records")
    .select("*", { count: "exact", head: true })
    .eq("hospital_id", HID);
  assert((units ?? 0) >= 1, "expected seeded hospital_unit_records");

  // Onboarding lead insert (service role) — no auto-assert on provision
  const email = `smoke+${Date.now()}@example.com`;
  const { data: lead, error: lErr } = await admin
    .from("hospital_onboarding_leads")
    .insert({
      hospital_name: "Smoke Clinic",
      admin_name: "Smoke Admin",
      admin_email: email,
      plan: "starter",
      specialties: ["Cardiology"],
      status: "draft",
      payload: { source: "smoke" },
    })
    .select("id, status")
    .single();
  assert(!lErr && lead, `lead insert failed: ${lErr?.message}`);
  await admin.from("hospital_onboarding_leads").delete().eq("id", lead.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        chartRoundTrip: true,
        doctors,
        units,
        leadDeleted: true,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
