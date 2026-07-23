/**
 * Historical PostgREST audit proof — after core PHI revoke, authenticated
 * SELECT on patients must be 42501. Durable audit for those tables is now
 * Worker audit_logs; residual RLS audit applies only to still-granted tables.
 *
 * Usage: node --env-file=.env.local scripts/phi-read-audit-postgrest-proof.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";

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

const patients = await client.from("patients").select("id").limit(1);
const locked = await client.from("specialty_chart_notes").select("id").limit(1);

const report = {
  patients_postgrest: {
    code: patients.error?.code ?? null,
    message: patients.error?.message ?? null,
    expect_42501: true,
    pass:
      patients.error?.code === "42501" || /permission denied/i.test(patients.error?.message || ""),
  },
  specialty_chart_notes: {
    code: locked.error?.code ?? null,
    message: locked.error?.message ?? null,
  },
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.patients_postgrest.pass ? 0 : 1);
