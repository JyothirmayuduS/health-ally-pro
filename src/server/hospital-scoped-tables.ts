/**
 * Inventory of public tables that carry hospital_id (from live Postgres probe 2026-07-22).
 * Cross-tenant RLS must cover these — service-role clients bypass RLS and do NOT count.
 */
export const HOSPITAL_SCOPED_TABLES = [
  "anatomy_markers",
  "appointments",
  "audit_logs",
  "branches",
  "encounters",
  "hospital_desk_records",
  "hospital_doctors",
  "hospital_memberships",
  "hospital_onboarding_leads",
  "hospital_subscriptions",
  "hospital_unit_records",
  "invoices",
  "lab_orders",
  "lab_results",
  "notifications",
  "patient_medications",
  "patients",
  "payments",
  "prescriptions",
  "queue_entries",
  "specialty_chart_notes",
  "staff_profiles",
] as const;

export type HospitalScopedTable = (typeof HOSPITAL_SCOPED_TABLES)[number];

/** Tables the persist/API path forces hospital_id for (server-side). */
export const PERSIST_API_SCOPED_TABLES = [
  "hospital_doctors",
  "specialty_chart_notes",
  "anatomy_markers",
  "hospital_unit_records",
  "hospital_desk_records",
  "hospital_subscriptions",
  "audit_logs",
] as const;
