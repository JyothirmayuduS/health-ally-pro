# Mock Desks → Postgres Scope (Tier 4)

> **FLAG: Scope document only. No code changes were made for Tier 4.**

**Repo:** `/Users/s.jyothirmayudu/Downloads/health-ally-pro-main`  
**Calibrated against:** patients/appointments Worker + PHI read path (`src/server/phi-reads.ts`, `src/routes/api/hospital/phi.ts`, migrations `20260622000001`, `20260722080000`/`90000`).

---

## Patients / Appointments Precedent (calibration = “medium”)

| Layer | Location |
|-------|----------|
| Schema | `patients`, `appointments` in `supabase/migrations/20260622000001_hospital_saas_foundation.sql` |
| RLS + REVOKE | `20260722080000_revoke_core_phi_postgrest.sql`, `20260722090000_remove_rls_http_audit_revoke_remaining.sql` |
| AuthZ | `authorizePhiRead()` in `src/server/phi-reads.ts` (JWT + memberships + patient row) |
| Worker | `GET /api/hospital/phi?resource=patients\|appointments` |
| Audit | `src/server/phi-audit.ts` + DLQ `audit_write_failures` |
| Client | `src/lib/supabase/phi-api.ts` → `fetchPhiResource()` |

**Sizing unit:** 1 medium table pair + Worker handlers + client query module + RLS/REVOKE/audit = **medium**.

**Interim pattern (optional phase 0):** `hospital_desk_records` JSONB blobs (`20260722020000`) + `src/routes/api/hospital/persist.ts` + `src/lib/licensed-desk-store.ts`.

---

## Summary matrix

| Desk | Storage today | Foundation tables? | Worker PHI today? | Size vs patients/appts |
|------|---------------|--------------------|-------------------|------------------------|
| Billing | localStorage ledger | ✅ `invoices`, `payments` | ❌ | **Medium** |
| Lab | In-memory + catalog localStorage | ⚠️ `lab_orders` too thin | ⚠️ results only | **Large** (~2–3×) |
| Pharmacy | In-memory + formulary localStorage | ⚠️ formulary/batches; Rx model mismatch | ❌ | **Large** (~2–3×) |
| Encounters | localStorage | ✅ `encounters` | ❌ | **Medium** (~1.5×) |
| Prescriptions (doctor) | localStorage + sessionStorage bridge | ⚠️ thin `prescriptions` | ⚠️ `patient_medications` read | **Medium–Large** |
| Nursing / IPD / OT | localStorage + static ERP constants | ❌ | ❌ | **Large** (vitals-only: Small–Medium) |

**Suggested order:** Encounters → Billing → Prescriptions+Pharmacy → Lab → Nursing/IPD/OT.

---

## 1. Billing

**Current:** `medora-billing-ledger-invoices-v1` / `…-payments-v1` (`src/lib/shared/billing-ledger.ts`); store `src/lib/billing-desk/store.tsx`; bridges from lab/pharmacy/reception (`billing-bridge.ts`, `mirrorToLedger()`).

**Schema:** Extend existing `invoices`, `invoice_items`, `payments` with `legacy_id`, `source`, status mapping, `encounter_id`, `reference_id`.

**RLS/audit:** Follow `invoices_select` / `payments_select` + REVOKE; add `listInvoicesForAuth` / `listPaymentsForAuth` + `auditAfter(..., "invoices")`. Role `billing_staff` already in `STAFF_ROLES`.

**Client:** Replace ledger localStorage; stop dual state in reception; replace sessionStorage lab bridge with server invoice create.

**Size: Medium.**

---

## 2. Lab

**Current:** In-memory `SEED_ORDERS` (`src/lib/lab-desk/store.tsx` ~1200 LOC); `medora-lab-catalog-v1`; `medora-lab-results-v1`; doctor→lab sessionStorage bridge (`order-bridge.ts`); QC/reagents/shift in-memory.

**Schema:** Expand `lab_orders` (accession, priority, history, results); `lab_catalog`; optional `lab_specimens`, QC/reagent tables (or desk JSONB interim). Wire release to existing `lab_results`.

**RLS/audit:** `lab_orders_select` + Worker; extend `phi.ts` cases beyond results.

**Client:** Rewrite lab store; replace bridges; all `src/components/lab-desk/pages/*`.

**Size: Large (~2–3×).**

---

## 3. Pharmacy

**Current:** In-memory store (`store.tsx` ~1600 LOC); `medora-pharmacy-formulary-v1`; doctor→Rx sessionStorage (`prescription-bridge.ts`).

**Schema:** Existing `pharmacy_formulary` / `pharmacy_stock_batches` (`20260623100000`) need RLS. New `pharmacy_prescriptions` + lines (foundation `prescriptions` is one-row-per-med — mismatch). Add stock movements, ward orders, controlled log.

**RLS/audit:** Add RLS to formulary/batches; REVOKE + Worker; audit dispense/controlled.

**Client:** Full store rewrite; doctor send Rx → POST; 12+ pharmacy pages.

**Size: Large (~2–3×).**

---

## 4. Encounters (doctor + billing)

**Current:** `medora-encounters-v1` (`src/lib/shared/encounters.ts`); linked from billing, reception check-in, lab, pharmacy, doctor store.

**Schema:** Foundation `encounters` already has SOAP fields; add `legacy_id`, `status`, link arrays/JSONB for invoice/lab/rx IDs.

**RLS/audit:** `encounters_select` + REVOKE; Worker list/get/write + `writePhiAudit`.

**Client:** API adapter for `encounters.ts`; DoctorNoteWorkspace async save; all `linkToEncounter()` sites.

**Size: Medium (~1.5×).**

---

## 5. Prescriptions (doctor)

**Current:** `medora-doctor-sent-rx-v1`, templates, drafts (`doctor-prescription-store.ts`, `doctor-prescription-workflow.ts`); pharmacy bridge; patient portal `medora_patient_prescriptions_v1`.

**Schema:** Share pharmacy header/lines (§3); `doctor_rx_templates`; align patient view with existing `patient_medications` Worker path.

**RLS/audit:** Doctor write → pharmacy queue; audit create/send; templates low-sensitivity or desk blob.

**Client:** Workflow + store → API; remove sessionStorage bridge; patient store → PHI.

**Size: Medium–Large** (Medium doctor-only; Large if bundled with pharmacy).

---

## 6. Nursing / IPD / OT

**Current:** `medora-nursing-vitals-v1`, `medora-shared-vitals-v1`, beds/admissions in reception store, static `IPD_*` / `OT_*` in `hospital-erp-data.ts`, OT admin localStorage `medora-admin-ot-rooms-v2`.

**Schema (new):** `vitals_readings`, `beds`, `admissions`, `admission_transfers`, `ot_rooms`, `ot_cases`. Phase 0: `hospital_desk_records` desk=`nursing` / `hospital_unit_records` unit=`ot`.

**RLS/audit:** PHI for vitals/admissions/OT cases; hospital-scoped beds; nurse + admin roles; REVOKE + Worker.

**Client:** Unify vitals stores; nursing + reception beds/admissions; OT admin page; replace static ERP KPIs.

**Size: Large** (vitals-only subset: Small–Medium).

---

## Shared infrastructure every desk needs

| Piece | Path |
|-------|------|
| Read auth | `src/server/phi-reads.ts` |
| Read route | `src/routes/api/hospital/phi.ts` |
| Write route | extend `persist.ts` or PHI POST |
| Audit | `src/server/phi-audit.ts` |
| Client fetch | `src/lib/supabase/phi-api.ts` |
| RLS + REVOKE | pattern from `20260722080000` / `90000` |
| Tests | `src/server/cross-tenant.test.ts`, `scripts/rls-cross-tenant-probe.sql` |

---

*Tier 4 evidence only — no implementation in this round.*
