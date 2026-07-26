import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LabOrderSchema,
  PrescriptionOrderSchema,
  RadiologyOrderSchema,
  StartConsultationSchema,
} from "@/lib/doctor-workspace/schemas";
import { canPerformDoctorWorkspace } from "@/server/doctor-workspace/rbac";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";
import type { PhiReadAuth } from "@/server/phi-reads";

const TABLES = [
  "doctor_consultations",
  "clinical_tasks",
  "clinical_referrals",
  "radiology_orders",
] as const;

const staffAuth = {
  isStaff: true,
  isPatient: false,
  userId: "demo-staff",
  hospitalId: "00000000-0000-0000-0000-000000000001",
  hospitalIds: ["00000000-0000-0000-0000-000000000001"],
  email: "demo@example.com",
  patientId: null,
} as PhiReadAuth;

describe("Doctor workspace contracts and RBAC", () => {
  it("validates order and consult contracts", () => {
    expect(
      StartConsultationSchema.safeParse({ patientId: "MRN-1" }).success,
    ).toBe(true);
    expect(
      PrescriptionOrderSchema.safeParse({
        patientId: "p1",
        medicationName: "Amoxicillin",
        allergyChecked: true,
      }).success,
    ).toBe(true);
    expect(
      LabOrderSchema.safeParse({ patientId: "p1", testName: "CBC" }).success,
    ).toBe(true);
    expect(
      RadiologyOrderSchema.safeParse({
        patientId: "p1",
        studyName: "Chest X-ray",
        modality: "xray",
      }).success,
    ).toBe(true);
  });

  it("requires allergy check flag for Rx schema default path", () => {
    const parsed = PrescriptionOrderSchema.safeParse({
      patientId: "p1",
      medicationName: "Penicillin",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.allergyChecked).toBe(true);
  });

  it("enforces doctor vs nurse action matrix", () => {
    expect(canPerformDoctorWorkspace("read_board", staffAuth, ["nurse"])).toBe(true);
    expect(canPerformDoctorWorkspace("order_lab", staffAuth, ["nurse"])).toBe(true);
    expect(canPerformDoctorWorkspace("order_rx", staffAuth, ["nurse"])).toBe(false);
    expect(canPerformDoctorWorkspace("start_consultation", staffAuth, ["doctor"])).toBe(
      true,
    );
    expect(canPerformDoctorWorkspace("create_referral", staffAuth, ["doctor"])).toBe(
      true,
    );
  });
});

describe("Doctor workspace security inventory", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260726190000_doctor_workspace_phase4.sql"),
    "utf8",
  );

  it("registers new tables as hospital scoped", () => {
    for (const table of TABLES) expect(HOSPITAL_SCOPED_TABLES).toContain(table);
  });

  it("enables RLS and revokes PostgREST", () => {
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

  it("extends prescriptions with allergy_checked", () => {
    expect(sql).toContain("allergy_checked");
    expect(sql).toContain("radiology_orders");
  });
});
