import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";

const TABLES = [
  "doctor_availability_rules",
  "doctor_availability_exceptions",
  "hospital_doctor_token_counters",
  "opd_notification_events",
] as const;

describe("OPD tenant security inventory", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260726150000_appointments_opd_phase2.sql",
    ),
    "utf8",
  );

  it("registers every new table as hospital scoped", () => {
    for (const table of TABLES) expect(HOSPITAL_SCOPED_TABLES).toContain(table);
  });

  it("enables RLS and revokes direct PostgREST", () => {
    for (const table of TABLES) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toMatch(
      /REVOKE ALL ON TABLE[\s\S]+doctor_availability_rules[\s\S]+FROM anon, authenticated/,
    );
  });

  it("has scoped policy inventory entries", () => {
    for (const table of TABLES) {
      const policies = LIVE_POLICY_SCOPE.filter((item) => item.table === table);
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((item) => item.scoped === "Y")).toBe(true);
    }
  });

  it("forces conflict and token constraints in Postgres", () => {
    expect(sql).toContain("idx_appointments_active_doctor_slot");
    expect(sql).toContain("next_doctor_token");
    expect(sql).toContain("doctor_not_in_hospital");
    expect(sql).toContain("hospital_id, doctor_staff_id, day_date");
  });
});
