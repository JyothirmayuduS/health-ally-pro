import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: vi.fn(),
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authorizeHospitalPersist } from "@/server/hospital-persist-auth";
import {
  HOSPITAL_SCOPED_TABLES,
  PERSIST_API_SCOPED_TABLES,
} from "@/server/hospital-scoped-tables";

const OAK = "a0000001-0001-4001-8001-000000000001";
const OTHER = "b0000001-0001-4001-8001-000000000002";

function req(headers?: Record<string, string>) {
  return new Request("http://localhost:3000/api/hospital/persist", {
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
      ...(headers ?? {}),
    },
  });
}

/**
 * Auth-layer cross-tenant checks (mocked JWT membership).
 * Postgres RLS is verified separately via scripts/rls-cross-tenant-probe.sql
 * (SET ROLE authenticated + JWT claims — never service_role).
 */
describe("cross-tenant isolation (P2.8)", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    delete process.env.VITE_APP_ENV;
    delete process.env.MEDORA_AI_API_KEY;
    delete process.env.ALLOW_DEMO_PERSIST;
    delete process.env.VITE_ALLOW_DEMO_AUTH;
    vi.mocked(getSupabaseAdmin).mockReset();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("rejects JWT staff of hospital A from requesting hospital B", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-a", email: "doc@a.example" } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: async () => ({
              data: [{ role: "doctor", hospital_id: OAK }],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const auth = await authorizeHospitalPersist(
      req({ Authorization: "Bearer fake-jwt" }),
      OTHER,
    );
    expect(auth.ok).toBe(false);
    if (auth.ok) return;
    expect(auth.status).toBe(403);
    expect(auth.error).toMatch(/out of scope/i);
  });

  it("locks demo mode to Oak Haven even if client asks for hospital B", async () => {
    const auth = await authorizeHospitalPersist(
      req({ "x-medora-persist-demo": "1" }),
      OTHER,
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.hospitalId).toBe(OAK);
  });

  it("documents every hospital_id table vs persist API coverage", () => {
    expect(HOSPITAL_SCOPED_TABLES.length).toBeGreaterThanOrEqual(20);
    for (const t of PERSIST_API_SCOPED_TABLES) {
      expect(HOSPITAL_SCOPED_TABLES).toContain(t);
    }
    // Persist API is not the only guard — RLS must cover the full inventory
    // (migration 20260722030000_tighten_hospital_rls_cross_tenant).
    const uncoveredByPersist = HOSPITAL_SCOPED_TABLES.filter(
      (t) => !(PERSIST_API_SCOPED_TABLES as readonly string[]).includes(t),
    );
    expect(uncoveredByPersist.length).toBeGreaterThan(0);
    expect(uncoveredByPersist).toContain("patients");
    expect(uncoveredByPersist).toContain("appointments");
  });

  it("notes service-role clients bypass RLS (smoke/admin must not be used for tenant negatives)", () => {
    // Smoke scripts use SUPABASE_SERVICE_ROLE_KEY — that path cannot prove RLS.
    // Real negatives: scripts/rls-cross-tenant-probe.sql + staging dual-login.
    expect(true).toBe(true);
  });
});
