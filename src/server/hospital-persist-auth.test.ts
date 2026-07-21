import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: vi.fn(),
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  __resetOnboardRateLimitForTests,
  authorizeHospitalPersist,
  authorizePublicOnboard,
  rateLimitOnboard,
} from "@/server/hospital-persist-auth";

const OAK = "a0000001-0001-4001-8001-000000000001";
const OTHER = "b0000001-0001-4001-8001-000000000002";

function req(init?: {
  headers?: Record<string, string>;
  url?: string;
}) {
  return new Request(init?.url ?? "http://localhost:3000/api/hospital/persist", {
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
      ...(init?.headers ?? {}),
    },
  });
}

describe("authorizeHospitalPersist", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    __resetOnboardRateLimitForTests();
    process.env.NODE_ENV = "development";
    delete process.env.VITE_APP_ENV;
    delete process.env.ALLOW_DEMO_PERSIST;
    delete process.env.VITE_ALLOW_DEMO_AUTH;
    delete process.env.MEDORA_AI_API_KEY;
    vi.mocked(getSupabaseAdmin).mockReset();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("allows demo header in non-production and locks hospital to Oak Haven", async () => {
    const auth = await authorizeHospitalPersist(req({ headers: { "x-medora-persist-demo": "1" } }), OTHER);
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.mode).toBe("demo");
    expect(auth.hospitalId).toBe(OAK);
    expect(auth.canProvision).toBe(false);
  });

  it("rejects same-origin without demo header or token", async () => {
    const auth = await authorizeHospitalPersist(req());
    expect(auth.ok).toBe(false);
    if (auth.ok) return;
    expect(auth.status).toBe(401);
  });

  it("rejects demo header when production and demo persist disabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.VITE_APP_ENV = "production";
    process.env.ALLOW_DEMO_PERSIST = "false";
    const auth = await authorizeHospitalPersist(req({ headers: { "x-medora-persist-demo": "1" } }));
    expect(auth.ok).toBe(false);
  });

  it("allows API key when MEDORA_AI_API_KEY is set and matches", async () => {
    process.env.MEDORA_AI_API_KEY = "test-secret-key";
    const auth = await authorizeHospitalPersist(
      req({ headers: { "x-medora-ai-key": "test-secret-key" } }),
      OTHER,
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.mode).toBe("api_key");
    expect(auth.hospitalId).toBe(OTHER);
    expect(auth.canProvision).toBe(true);
  });

  it("scopes JWT staff to membership hospital and blocks out-of-scope ids", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ role: "doctor", hospital_id: OAK }],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const ok = await authorizeHospitalPersist(
      req({ headers: { Authorization: "Bearer good-token" } }),
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.mode).toBe("jwt");
    expect(ok.hospitalId).toBe(OAK);
    expect(ok.canProvision).toBe(false);

    const denied = await authorizeHospitalPersist(
      req({ headers: { Authorization: "Bearer good-token" } }),
      OTHER,
    );
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.status).toBe(403);
  });

  it("grants provision to hospital_admin JWT", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ role: "hospital_admin", hospital_id: OAK }],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const auth = await authorizeHospitalPersist(
      req({ headers: { Authorization: "Bearer admin-token" } }),
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.canProvision).toBe(true);
  });
});

describe("authorizePublicOnboard + rate limit", () => {
  beforeEach(() => {
    __resetOnboardRateLimitForTests();
    delete process.env.MEDORA_AI_API_KEY;
  });

  it("allows same-origin onboard then rate-limits", () => {
    const r = req({ headers: { "cf-connecting-ip": "203.0.113.9" } });
    expect(authorizePublicOnboard(r).ok).toBe(true);
    for (let i = 0; i < 4; i++) {
      expect(rateLimitOnboard(r, 5)).toBe(true);
    }
    // already used 1 in authorizePublicOnboard + 4 = 5; next fails
    expect(authorizePublicOnboard(r).ok).toBe(false);
  });

  it("rejects cross-origin onboard without API key", () => {
    process.env.MEDORA_AI_API_KEY = "required-in-prod-like";
    const r = new Request("http://localhost:3000/api/hospital/persist", {
      headers: { host: "localhost:3000", origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    });
    const auth = authorizePublicOnboard(r);
    expect(auth.ok).toBe(false);
    delete process.env.MEDORA_AI_API_KEY;
  });
});
