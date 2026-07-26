import { describe, expect, it } from "vitest";
import { DEMO_STAFF_TABLE } from "@/lib/supabase/demo-credentials";

describe("demo credentials hygiene", () => {
  it("does not use the retired Demo1234! password", () => {
    for (const row of Object.values(DEMO_STAFF_TABLE)) {
      expect(row.password).not.toBe("Demo1234!");
    }
  });

  it("keeps demo password length strong when table is present for local demos", () => {
    for (const row of Object.values(DEMO_STAFF_TABLE)) {
      expect(row.password.length).toBeGreaterThanOrEqual(12);
    }
  });
});
