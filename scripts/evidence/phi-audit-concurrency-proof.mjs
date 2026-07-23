/**
 * Concurrent Worker PHI reads → audit_logs row accounting.
 * Usage: node --env-file=.env.local scripts/phi-audit-concurrency-proof.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.MEDORA_BASE_URL || "http://127.0.0.1:8787";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const H = "a0000001-0001-4001-8001-000000000001";
const N = 8;

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data.session
  .access_token;

const marker = `concurrency-${Date.now()}`;
const before = new Date().toISOString();

async function hit(i) {
  const res = await fetch(
    `${BASE}/api/hospital/phi?resource=staff_profiles&hospitalId=${H}&_n=${i}&_m=${marker}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: BASE,
        "Sec-Fetch-Site": "same-origin",
      },
    },
  );
  const body = await res.json().catch(() => ({}));
  return { i, status: res.status, ok: body.ok === true };
}

const results = await Promise.all(Array.from({ length: N }, (_, i) => hit(i)));
await new Promise((r) => setTimeout(r, 2500));

const { data: rows, error } = await admin
  .from("audit_logs")
  .select("id, created_at, resource, action, actor_id, metadata")
  .eq("hospital_id", H)
  .eq("resource", "staff_profiles")
  .eq("action", "read")
  .eq("actor_id", user.id)
  .gte("created_at", before)
  .order("created_at", { ascending: true });

const ids = new Set((rows ?? []).map((r) => r.id));
const report = {
  concurrent_requests: N,
  http_results: results,
  http_all_200: results.every((r) => r.status === 200 && r.ok),
  audit_rows: rows?.length ?? 0,
  unique_audit_ids: ids.size,
  missing: N - (rows?.length ?? 0),
  duplicates: (rows?.length ?? 0) - ids.size,
  query_error: error?.message ?? null,
  pass:
    results.every((r) => r.status === 200 && r.ok) &&
    (rows?.length ?? 0) === N &&
    ids.size === N,
};

writeFileSync("docs/evidence/phi-audit-concurrency-proof.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
