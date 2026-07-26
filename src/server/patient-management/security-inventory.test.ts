import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";

const NEW_TABLES = [
  "patient_emergency_contacts",
  "patient_relationships",
  "patient_access_grants",
  "patient_allergies",
  "patient_history_entries",
  "consent_templates",
  "patient_consents",
  "patient_documents",
  "patient_qr_tokens",
  "hospital_mrn_counters",
] as const;

describe("patient management schema security inventory", () => {
  it("registers new PHI tables in hospital-scoped inventory", () => {
    for (const t of NEW_TABLES) {
      expect(HOSPITAL_SCOPED_TABLES).toContain(t);
    }
  });

  it("lists hospital-scoped policies for new tables", () => {
    for (const t of NEW_TABLES) {
      const policies = LIVE_POLICY_SCOPE.filter((p) => p.table === t);
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((p) => p.scoped === "Y")).toBe(true);
    }
  });

  it("migration revokes PostgREST roles and grants service_role", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260726120000_patient_management_phase1.sql"),
      "utf8",
    );
    for (const t of NEW_TABLES) {
      if (t === "hospital_mrn_counters") {
        expect(sql).toContain(`REVOKE ALL ON TABLE public.${t} FROM anon, authenticated`);
        continue;
      }
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON TABLE public\\.${t} FROM anon, authenticated`));
      expect(sql).toMatch(new RegExp(`GRANT ALL ON TABLE public\\.${t} TO service_role`));
    }
    expect(sql).toContain("patient-documents");
    expect(sql).toContain("next_hospital_mrn");
  });
});
