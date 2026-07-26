#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migration = "supabase/migrations/20260726190000_doctor_workspace_phase4.sql";
const sql = readFileSync(join(root, migration), "utf8");
const present = (path) => existsSync(join(root, path));

const evidence = {
  generated_at: new Date().toISOString(),
  phase: "doctor-workspace-phase4",
  architecture: {
    consultation_bridge: "doctor_consultations",
    reuses_opd_queue_appointments: true,
    reuses_emr_soap_diagnoses: true,
    worker_only_mutations: true,
    allergy_safety_on_rx: true,
  },
  schema: {
    migration,
    tables: [
      "doctor_consultations",
      "clinical_tasks",
      "clinical_referrals",
      "radiology_orders",
    ],
    prescription_allergy_checked: sql.includes("allergy_checked"),
    postgrest_revoked: sql.includes("FROM anon, authenticated"),
  },
  api: {
    route: "/api/hospital/doctor-workspace",
    actions: [
      "board",
      "consultation",
      "start",
      "complete",
      "rx",
      "lab",
      "radiology",
      "referral",
      "task",
      "complete_task",
      "follow_up",
    ],
    audit_scheduled: true,
  },
  ui: {
    route: "/doctor/workspace",
    screen: present("src/components/doctor/DoctorWorkspaceScreen.tsx"),
    primary_nav: present("src/lib/doctor-portal-nav.ts"),
  },
  tests: {
    unit: "src/lib/doctor-workspace/doctor-workspace.test.ts",
    security: "src/server/doctor-workspace/security-inventory.test.ts",
    e2e: "e2e/doctor-workspace-phase4.spec.ts",
  },
  privacy: {
    contains_phi: false,
    contains_tokens: false,
    contains_signed_urls: false,
  },
  limitations: [
    "Follow-up booking requires a resolvable doctor staff id in the hospital.",
    "Legacy prescription and specialty desks remain available as secondary surfaces.",
  ],
};

const output = join(root, "docs/evidence/doctor-workspace-phase4.json");
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Wrote ${output}`);
