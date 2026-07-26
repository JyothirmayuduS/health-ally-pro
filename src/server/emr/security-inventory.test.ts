import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";

const TABLES = [
  "clinical_note_versions",
  "patient_diagnoses",
  "patient_procedures",
  "patient_immunizations",
  "clinical_attachments",
  "emr_record_audit",
] as const;

describe("EMR security inventory", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260726180000_emr_ehr_phase3.sql"),
    "utf8",
  );

  it("registers EMR tables as hospital scoped", () => {
    for (const table of TABLES) expect(HOSPITAL_SCOPED_TABLES).toContain(table);
  });

  it("locks PostgREST and enables RLS", () => {
    for (const table of TABLES) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`GRANT ALL ON TABLE public.${table} TO service_role`);
    }
    expect(sql).toContain("FROM anon, authenticated");
  });

  it("lists scoped policies", () => {
    for (const table of TABLES) {
      const policies = LIVE_POLICY_SCOPE.filter((p) => p.table === table);
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((p) => p.scoped === "Y")).toBe(true);
    }
  });

  it("keeps clinical history immutable", () => {
    expect(sql).toContain("forbid_clinical_note_version_mutation");
    expect(sql).toContain("forbid_emr_record_audit_mutation");
    expect(sql).toContain("clinical-attachments");
  });
});
