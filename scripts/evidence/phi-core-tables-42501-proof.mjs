/**
 * Proof: authenticated JWT can no longer PostgREST-select the 7 core PHI tables.
 * Usage: node --env-file=.env.local scripts/phi-core-tables-42501-proof.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const TABLES = [
  "patients",
  "appointments",
  "lab_results",
  "patient_medications",
  "staff_profiles",
  "hospital_memberships",
  "queue_entries",
];

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed?.users?.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
await client.auth.signInWithPassword({ email: EMAIL, password: PASS });

const matrix = {};
let allDenied = true;
for (const t of TABLES) {
  const { data, error } = await client.from(t).select("id").limit(1);
  const denied = !!error && (error.code === "42501" || /permission denied/i.test(error.message));
  matrix[t] = {
    denied,
    code: error?.code ?? null,
    message: error?.message ?? null,
    rows: data?.length ?? 0,
  };
  if (!denied) allDenied = false;
}

const report = { pass: allDenied, matrix };
writeFileSync("docs/evidence/phi-core-tables-42501-proof.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(allDenied ? 0 : 1);
