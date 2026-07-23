import { describe, expect, it } from "vitest";
import {
  HOSPITAL_SCOPED_TABLES,
  PERSIST_API_SCOPED_TABLES,
} from "@/server/hospital-scoped-tables";

/**
 * Live pg_policies inventory (project wsnpwyqypgclsclktoyf, after
 * tighten_hospital_rls_cross_tenant + tighten_remaining_unscoped_rls +
 * tighten_onboarding_insert_scope).
 *
 * scoped: Y = hospital_id / staff_in_hospital / get_user_hospital_ids
 *         SELF = auth.uid() / get_patient_id only (no cross-tenant staff path)
 *         N = role check without hospital scope
 */
export const LIVE_POLICY_SCOPE: Array<{
  table: string;
  policy: string;
  scoped: "Y" | "N" | "SELF";
}> = [
  { table: "anatomy_markers", policy: "anatomy_markers_manage", scoped: "Y" },
  { table: "anatomy_markers", policy: "anatomy_markers_select", scoped: "Y" },
  { table: "appointments", policy: "appointments_insert", scoped: "Y" },
  { table: "appointments", policy: "appointments_select", scoped: "Y" },
  { table: "appointments", policy: "appointments_update", scoped: "Y" },
  { table: "audit_logs", policy: "audit_insert", scoped: "Y" },
  { table: "audit_logs", policy: "audit_select", scoped: "Y" },
  { table: "branches", policy: "branches_manage", scoped: "Y" },
  { table: "branches", policy: "branches_select", scoped: "Y" },
  { table: "encounters", policy: "encounters_manage", scoped: "Y" },
  { table: "encounters", policy: "encounters_select", scoped: "Y" },
  { table: "hospital_desk_records", policy: "desk_records_manage", scoped: "Y" },
  { table: "hospital_desk_records", policy: "desk_records_select", scoped: "Y" },
  { table: "hospital_doctors", policy: "hospital_doctors_manage", scoped: "Y" },
  { table: "hospital_doctors", policy: "hospital_doctors_select", scoped: "Y" },
  { table: "hospital_memberships", policy: "memberships_manage", scoped: "Y" },
  { table: "hospital_memberships", policy: "memberships_select", scoped: "Y" },
  { table: "hospital_onboarding_leads", policy: "onboarding_insert_staff", scoped: "Y" },
  { table: "hospital_onboarding_leads", policy: "onboarding_select_staff", scoped: "Y" },
  { table: "hospital_onboarding_leads", policy: "onboarding_update_staff", scoped: "Y" },
  { table: "hospital_subscriptions", policy: "subscriptions_manage", scoped: "Y" },
  { table: "hospital_subscriptions", policy: "subscriptions_select", scoped: "Y" },
  { table: "hospital_unit_records", policy: "unit_records_manage", scoped: "Y" },
  { table: "hospital_unit_records", policy: "unit_records_select", scoped: "Y" },
  { table: "invoices", policy: "invoices_manage", scoped: "Y" },
  { table: "invoices", policy: "invoices_select", scoped: "Y" },
  { table: "lab_orders", policy: "lab_orders_manage", scoped: "Y" },
  { table: "lab_orders", policy: "lab_orders_select", scoped: "Y" },
  { table: "lab_results", policy: "lab_results_manage", scoped: "Y" },
  { table: "lab_results", policy: "lab_results_select", scoped: "Y" },
  { table: "notifications", policy: "notifications_insert", scoped: "Y" },
  { table: "notifications", policy: "notifications_select", scoped: "SELF" },
  { table: "notifications", policy: "notifications_update", scoped: "SELF" },
  { table: "patient_medications", policy: "patient_medications_manage", scoped: "Y" },
  { table: "patient_medications", policy: "patient_medications_select", scoped: "Y" },
  { table: "patients", policy: "patients_insert", scoped: "Y" },
  { table: "patients", policy: "patients_select", scoped: "Y" },
  { table: "patients", policy: "patients_update", scoped: "Y" },
  { table: "payments", policy: "payments_manage", scoped: "Y" },
  { table: "payments", policy: "payments_select", scoped: "Y" },
  { table: "prescriptions", policy: "prescriptions_manage", scoped: "Y" },
  { table: "prescriptions", policy: "prescriptions_select", scoped: "Y" },
  { table: "queue_entries", policy: "queue_manage", scoped: "Y" },
  { table: "queue_entries", policy: "queue_select", scoped: "Y" },
  { table: "specialty_chart_notes", policy: "specialty_charts_manage", scoped: "Y" },
  { table: "specialty_chart_notes", policy: "specialty_charts_select", scoped: "Y" },
  { table: "staff_profiles", policy: "staff_manage", scoped: "Y" },
  { table: "staff_profiles", policy: "staff_select", scoped: "Y" },
];

describe("hospital_id RLS policy inventory (22 tables)", () => {
  it("covers every hospital_id table in HOSPITAL_SCOPED_TABLES", () => {
    const tablesWithPolicies = new Set(LIVE_POLICY_SCOPE.map((p) => p.table));
    for (const t of HOSPITAL_SCOPED_TABLES) {
      expect(tablesWithPolicies.has(t), `${t} missing from policy inventory`).toBe(true);
    }
  });

  it("has no N (unscoped role-only) policies on hospital_id tables", () => {
    const bad = LIVE_POLICY_SCOPE.filter((p) => p.scoped === "N");
    expect(bad).toEqual([]);
  });

  it("persist API subset is contained in hospital-scoped inventory", () => {
    for (const t of PERSIST_API_SCOPED_TABLES) {
      expect(HOSPITAL_SCOPED_TABLES).toContain(t);
    }
  });
});
