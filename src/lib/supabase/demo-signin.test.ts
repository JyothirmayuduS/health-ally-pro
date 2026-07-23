import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, string>();

vi.stubGlobal("sessionStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
});

vi.mock("./client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(async () => {
        throw new Error("supabase should not be called for .demo when demo auth on");
      }),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    },
  },
  isSupabaseConfigured: () => false,
}));

vi.mock("@/lib/production", () => ({
  allowDemoAuth: () => true,
}));

describe("demo-first signIn", () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it("signs in cardiology demo without calling Supabase", async () => {
    const { signIn, getAuthSession } = await import("@/lib/supabase/auth");
    await signIn("cardiology@oakhaven.demo", "MedoraDemo!2026Doc");
    const session = await getAuthSession();
    expect(session?.email).toBe("cardiology@oakhaven.demo");
    expect(session?.roles).toContain("doctor");
  });
});
