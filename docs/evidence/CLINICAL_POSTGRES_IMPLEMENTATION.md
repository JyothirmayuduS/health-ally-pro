# Clinical desk Postgres persistence — implementation status

Updated: 2026-07-22

## What was implemented

### Infrastructure
- Migration `20260722110000_clinical_desk_persistence.sql` — extended `hospital_desk_records` desks (`admin`, `doctor`, `patient`), JSONB `payload` + `legacy_id` on clinical tables, nursing/IPD/OT tables (`vitals_readings`, `beds`, `admissions`, `ot_rooms`, `ot_cases`), REVOKE direct PostgREST access.
- `src/lib/shared/persisted-store.ts` — unified localStorage + remote `hospital_desk_records` dual-write.
- `src/lib/supabase/worker-auth-headers.ts` — JWT or demo persist header for Worker APIs.
- Demo PHI auth in `authorizePhiRead` (matches persist demo path).
- `src/server/clinical-phi.ts` — list/upsert for encounters, invoices, payments, lab_orders, prescriptions, branches, vitals, beds, admissions, OT.
- `GET/POST /api/hospital/phi` — clinical resources + batch upsert with audit.
- `DeskHydrator` — hydrates all desk blobs from Postgres on app boot.

### Client stores wired to Postgres sync
| Store | Desk | Clinical table sync |
|-------|------|---------------------|
| Encounters | billing | ✅ encounters |
| Billing ledger (invoices/payments) | billing | ✅ invoices, payments |
| Vitals | nursing | ✅ vitals_readings |
| Lab catalog / results | lab | desk only |
| Clinic queue | reception | desk only |
| Admin hospital/branches/depts | admin | ✅ branches |
| Doctor sent Rx / templates | doctor | ✅ prescriptions |

### Still local-only (desk blob path ready, not yet wired)
- Lab in-memory store (`lab-desk/store.tsx` ~1200 LOC)
- Pharmacy in-memory store (`pharmacy-desk/store.tsx` ~1600 LOC)
- Reception store partial (appointments key only)
- Patient notifications, nursing vitals duplicate key, OT admin rooms
- Notifications table (read path exists; client not wired)

## How to use

1. Apply migration: `supabase db push` or deploy migrations.
2. Run dev on **http://127.0.0.1:8787** with `.env.local` Supabase keys.
3. Staff login → `DeskHydrator` pulls remote state; saves dual-write to Postgres.

## Honest limits

- Client shapes use MRN strings; Postgres rows store full JSON in `payload` + resolved `patient_id` where required.
- Lab/pharmacy React context stores need a follow-up PR to snapshot state to `medora-lab-desk-state-v1` / `medora-pharmacy-desk-state-v1`.
- Payments upsert requires invoice row to exist first (FK).
- Production Docker (`:3001`) still has demo auth off — use dev server for demos.
