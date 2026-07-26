import { describe, expect, it, vi } from "vitest";

describe("client production assert", () => {
  it("assertClientProductionSafe is a no-op when not PROD", async () => {
    vi.resetModules();
    vi.stubEnv("PROD", false);
    const { assertClientProductionSafe } = await import("@/lib/production");
    expect(() => assertClientProductionSafe()).not.toThrow();
    vi.unstubAllEnvs();
  });
});
