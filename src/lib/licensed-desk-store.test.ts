import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/production", () => ({
  allowClientMockData: vi.fn(() => false),
}));

vi.mock("@/lib/license", () => ({
  isEvaluationBuild: vi.fn(() => false),
}));

import { shouldPreferRemoteDeskStore, writeLicensedLocalJson } from "@/lib/licensed-desk-store";
import { allowClientMockData } from "@/lib/production";

describe("licensed desk store (P2.6/P2.7)", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true }),
      })),
    );
    vi.mocked(allowClientMockData).mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers remote when client mocks are disallowed", () => {
    expect(shouldPreferRemoteDeskStore()).toBe(true);
  });

  it("dual-writes reception appointments payload to persist API", async () => {
    writeLicensedLocalJson(
      "medora-reception-appointments-v1",
      [{ id: "a1", patient: "Pat" }],
      "reception",
    );
    expect(store.get("medora-reception-appointments-v1")).toContain("a1");
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call[0])).toContain("/api/hospital/persist");
    const body = JSON.parse(String((call[1] as RequestInit).body));
    expect(body.action).toBe("upsert_desk");
    expect(body.desk).toBe("reception");
  });
});
