import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";

const TABLES = [
  "doctor_consultations",
  "clinical_tasks",
  "clinical_referrals",
  "radiology_orders",
] as const;

describe("Doctor workspace tenant security inventory", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260726190000_doctor_workspace_phase4.sql"),
    "utf8",
  );

  it("scopes and locks new PHI tables", () => {
    for (const table of TABLES) {
      expect(HOSPITAL_SCOPED_TABLES).toContain(table);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toMatch(/REVOKE ALL ON TABLE[\s\S]+doctor_consultations[\s\S]+FROM anon, authenticated/);
  });

  it("has policy inventory entries", () => {
    for (const table of TABLES) {
      const policies = LIVE_POLICY_SCOPE.filter((p) => p.table === table);
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
