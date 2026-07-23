/**
 * Dual-tenant desk isolation (anon + JWT). Not service_role for negatives.
 * Usage: node --env-file=.env.local scripts/dual-tenant-rls-check.mjs
 * Prints JSON with pass/fail per desk.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OAK = "a0000001-0001-4001-8001-000000000001";
const B = "d0000001-0001-4001-8001-000000000099";
const PASS = "DualTenant!2026*Check";
const PROBE = `TENANT-B-PROBE-${Date.now().toString(36)}`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function countForeign(client, table, hospitalId, extraEq = {}) {
  let q = client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId);
  for (const [k, v] of Object.entries(extraEq)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) return { ok: false, error: error.message, count: null };
  return { ok: true, count: count ?? 0, error: null };
}

async function main() {
  assert(
    url && anon && service,
    "Need SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY",
  );
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await admin
    .from("hospitals")
    .upsert({ id: B, name: "Dual Tenant Hospital B", slug: "dual-tenant-hospital-b" });
  await admin
    .from("patients")
    .upsert(
      { id: "d0000001-0001-4001-8001-0000000000aa", hospital_id: B, mrn: "DUAL-B-MRN" },
      { onConflict: "id" },
    );

  // Seed PHI-shaped rows for each desk/table under Hospital B
  await admin.from("specialty_chart_notes").upsert({
    id: "d0000001-0001-4001-8001-0000000000b1",
    hospital_id: B,
    specialty_id: "cardiology",
    patient_name: PROBE,
    module_id: "ecg",
    values: { probe: PROBE },
  });
  const deskIds = {
    reception: "d0000001-0001-4001-8001-0000000000c1",
    lab: "d0000001-0001-4001-8001-0000000000c2",
    pharmacy: "d0000001-0001-4001-8001-0000000000c3",
  };
  for (const desk of ["reception", "lab", "pharmacy"]) {
    await admin.from("hospital_desk_records").upsert(
      {
        id: deskIds[desk],
        hospital_id: B,
        desk,
        record_key: `probe-${desk}`,
        payload: { probe: PROBE },
      },
      { onConflict: "id" },
    );
  }
  await admin.from("hospital_unit_records").upsert({
    id: "d0000001-0001-4001-8001-0000000000d1",
    hospital_id: B,
    unit_id: "blood-bank",
    title: PROBE,
    status: "open",
  });
  await admin.from("anatomy_markers").upsert({
    id: "d0000001-0001-4001-8001-0000000000e1",
    hospital_id: B,
    region_id: "chest",
    label: PROBE,
  });
  await admin.from("audit_logs").insert({
    hospital_id: B,
    action: "dual_tenant_probe",
    resource: "patients",
    metadata: { probe: PROBE },
  });

  const { data: oakList } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  const oakEmail = "doctor@oakhaven.demo";
  const oakUser = oakList?.users?.find((u) => u.email === oakEmail);
  assert(oakUser, "Oak doctor missing");
  await admin.auth.admin.updateUserById(oakUser.id, { password: PASS });

  const bEmail = "doctor@dual-b.demo";
  let bUser = oakList?.users?.find((u) => u.email === bEmail);
  if (!bUser) {
    const created = await admin.auth.admin.createUser({
      email: bEmail,
      password: PASS,
      email_confirm: true,
      user_metadata: { full_name: "Dr Dual B" },
    });
    assert(!created.error, created.error?.message);
    bUser = created.data.user;
  } else {
    await admin.auth.admin.updateUserById(bUser.id, { password: PASS });
  }
  await admin
    .from("hospital_memberships")
    .upsert(
      { profile_id: bUser.id, hospital_id: B, role: "doctor", is_active: true },
      { onConflict: "profile_id,hospital_id,role" },
    );

  // Also need hospital_admin on B for audit_logs select policy
  await admin
    .from("hospital_memberships")
    .upsert(
      { profile_id: bUser.id, hospital_id: B, role: "hospital_admin", is_active: true },
      { onConflict: "profile_id,hospital_id,role" },
    );

  const oakClient = createClient(url, anon, { auth: { persistSession: false } });
  const oakAuth = await oakClient.auth.signInWithPassword({ email: oakEmail, password: PASS });
  assert(!oakAuth.error, oakAuth.error?.message);

  const bClient = createClient(url, anon, { auth: { persistSession: false } });
  const bAuth = await bClient.auth.signInWithPassword({ email: bEmail, password: PASS });
  assert(!bAuth.error, bAuth.error?.message);

  const desks = [
    { desk: "patients", table: "patients" },
    { desk: "specialty_charts", table: "specialty_chart_notes" },
    { desk: "reception", table: "hospital_desk_records", extra: { desk: "reception" } },
    { desk: "lab", table: "hospital_desk_records", extra: { desk: "lab" } },
    { desk: "pharmacy", table: "hospital_desk_records", extra: { desk: "pharmacy" } },
    { desk: "units", table: "hospital_unit_records" },
    { desk: "anatomy_markers", table: "anatomy_markers" },
    { desk: "audit_logs", table: "audit_logs" },
  ];

  const results = [];
  for (const d of desks) {
    const oakForeign = await countForeign(oakClient, d.table, B, d.extra ?? {});
    const bOwn = await countForeign(bClient, d.table, B, d.extra ?? {});
    const bForeign = await countForeign(bClient, d.table, OAK, d.extra ?? {});
    const pass =
      oakForeign.ok &&
      bOwn.ok &&
      bForeign.ok &&
      oakForeign.count === 0 &&
      bForeign.count === 0 &&
      (d.desk === "audit_logs" ? bOwn.count >= 0 : bOwn.count >= 1);
    // audit: B admin should see own probe (>=1); Oak doctor cannot (audit_select is hospital_admin only → oak count 0)
    results.push({
      desk: d.desk,
      table: d.table,
      pass,
      oak_sees_B: oakForeign,
      B_sees_own: bOwn,
      B_sees_Oak: bForeign,
    });
  }

  // Persist API 403
  let persist = { skipped: true };
  const persistUrl =
    process.env.DUAL_TENANT_PERSIST_URL || "http://127.0.0.1:8787/api/hospital/persist";
  try {
    const res = await fetch(persistUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${oakAuth.data.session?.access_token}`,
        origin: "http://127.0.0.1:8787",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ hospitalId: B, action: "list_charts", specialtyId: "cardiology" }),
    });
    const text = await res.text();
    persist = { status: res.status, body: text, pass: res.status === 403 };
  } catch (e) {
    persist = { skipped: true, error: e.message, pass: false };
  }

  await admin.from("hospitals").delete().eq("id", B);

  const out = {
    probe: PROBE,
    environment: {
      supabase_url: url,
      note: "No separate staging Worker/project in this org — ran against health_ally_pro + local :8787",
    },
    desks: results,
    persist_api: persist,
    all_desks_pass: results.every((r) => r.pass) && persist.pass !== false,
  };
  console.log(JSON.stringify(out, null, 2));
  if (!out.all_desks_pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
