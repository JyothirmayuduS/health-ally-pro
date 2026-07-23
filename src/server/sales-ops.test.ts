import { describe, expect, it, vi, afterEach } from "vitest";
import { verifyTurnstile } from "@/server/sales-ops";

describe("verifyTurnstile", () => {
  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
    vi.unstubAllGlobals();
  });

  it("no-ops when secret unset", async () => {
    const res = await verifyTurnstile(undefined, new Request("http://localhost/"));
    expect(res.ok).toBe(true);
  });

  it("requires token when secret set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const res = await verifyTurnstile(undefined, new Request("http://localhost/"));
    expect(res.ok).toBe(false);
  });

  it("accepts successful siteverify", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ success: true }),
      })),
    );
    const res = await verifyTurnstile("tok", new Request("http://localhost/"));
    expect(res.ok).toBe(true);
  });
});
