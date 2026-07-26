#!/usr/bin/env node
/**
 * HTTP smoke for /api/hospital/persist (requires `npm run dev`).
 * Usage: BASE_URL=http://localhost:5173 node scripts/smoke-hospital-persist-http.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:5173";

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const status = await call("/api/hospital/persist?resource=status");
  assert(status.status === 200 && status.json?.authRequired === true, "status should require auth");

  const deny = await call("/api/hospital/persist?resource=doctors", {
    headers: { "sec-fetch-site": "same-origin", origin: BASE },
  });
  assert(deny.status === 401, `doctors without demo should 401, got ${deny.status}`);

  const docs = await call("/api/hospital/persist?resource=doctors", {
    headers: {
      "sec-fetch-site": "same-origin",
      origin: BASE,
      "x-medora-persist-demo": "1",
    },
  });
  assert(
    docs.status === 200 && docs.json?.ok && (docs.json.data?.length ?? 0) >= 1,
    "demo doctors failed",
  );

  const chartKey = `SCH-http-${Date.now().toString(36)}`;
  const chart = await call("/api/hospital/persist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
      origin: BASE,
      "x-medora-persist-demo": "1",
    },
    body: JSON.stringify({
      action: "insert_chart",
      chart: {
        hospital_id: "b0000001-0001-4001-8001-000000000002",
        specialty_id: "pediatrics",
        patient_name: "HTTP Smoke Kid",
        module_id: "growth",
        values: { wt: 12 },
        client_key: chartKey,
      },
    }),
  });
  assert(chart.status === 200 && chart.json?.ok, "chart insert failed");
  assert(
    chart.json.data.hospital_id === "a0000001-0001-4001-8001-000000000001",
    "hospital_id must be forced to Oak Haven in demo mode",
  );

  const onboard = await call("/api/hospital/persist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
      origin: BASE,
    },
    body: JSON.stringify({
      action: "onboard",
      provision: true,
      lead: {
        hospital_name: "HTTP Smoke Hospital",
        admin_name: "Admin",
        admin_email: `http-smoke-${Date.now()}@example.com`,
        plan: "starter",
        specialties: ["Cardiology"],
      },
    }),
  });
  assert(onboard.status === 200 && onboard.json?.ok === true, "onboard lead failed");
  assert(
    onboard.json.provisioned === false && !onboard.json.hospital,
    "must not auto-provision without canProvision",
  );

  const evil = await call("/api/hospital/persist?resource=doctors", {
    headers: {
      "sec-fetch-site": "cross-site",
      origin: "https://evil.example",
      "x-medora-persist-demo": "1",
    },
  });
  assert(evil.status === 401, "cross-site demo must be rejected");

  console.log(
    JSON.stringify(
      {
        ok: true,
        base: BASE,
        checks: [
          "status",
          "deny",
          "demo-doctors",
          "chart-hospital-lock",
          "onboard-lead-only",
          "cross-site-deny",
        ],
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
