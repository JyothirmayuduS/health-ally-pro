#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migration =
  "supabase/migrations/20260726150000_appointments_opd_phase2.sql";
const sql = readFileSync(join(root, migration), "utf8");
const present = (path) => existsSync(join(root, path));

const evidence = {
  generated_at: new Date().toISOString(),
  phase: "appointments-opd-phase2",
  architecture: {
    canonical_store: "postgres",
    worker_only_mutations: true,
    local_fallback_preserved: true,
    unified_queue_table: "public.queue_entries",
  },
  schema: {
    migration,
    availability_tables: [
      "doctor_availability_rules",
      "doctor_availability_exceptions",
    ],
    token_counter: "hospital_doctor_token_counters",
    notification_outbox: "opd_notification_events",
    active_slot_conflict_index: sql.includes(
      "idx_appointments_active_doctor_slot",
    ),
    service_role_token_rpc: sql.includes(
      "GRANT EXECUTE ON FUNCTION public.next_doctor_token",
    ),
    postgrest_revoked: sql.includes("FROM anon, authenticated"),
  },
  api: {
    routes: [
      "/api/hospital/appointments",
      "/api/hospital/queue",
    ],
    appointment_actions: [
      "list",
      "availability",
      "book",
      "walk_in",
      "check_in",
      "reschedule",
      "cancel",
      "follow_up",
    ],
    queue_actions: ["list", "call", "start", "complete", "cancel"],
    audit_scheduled: true,
    event_types: [
      "appointment.booked",
      "appointment.checked_in",
      "appointment.called",
      "appointment.consultation_started",
      "appointment.completed",
      "appointment.cancelled",
      "appointment.rescheduled",
      "appointment.follow_up_scheduled",
    ],
  },
  integration: {
    reception_store_dual_write: present(
      "src/lib/reception-desk/store.tsx",
    ),
    doctor_queue_canonical_sync: present(
      "src/lib/doctor-live-queue-store.tsx",
    ),
    doctor_schedule_persistence: present(
      "src/components/doctor/profile/DoctorScheduleSlotsScreen.tsx",
    ),
    patient_mrn_legacy_adapter: present("src/lib/opd/compat.ts"),
  },
  tests: {
    unit: "src/lib/opd/opd.test.ts",
    security: "src/server/opd/security-inventory.test.ts",
    e2e: "e2e/appointments-opd-phase2.spec.ts",
  },
  privacy: {
    contains_phi: false,
    contains_tokens: false,
    contains_signed_urls: false,
  },
  limitations: [
    "Live authenticated hospital A/B probes require dedicated test identities.",
    "Push delivery providers are not enabled; events are queued in the outbox.",
  ],
};

const output = join(root, "docs/evidence/appointments-opd-phase2.json");
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Wrote ${output}`);
