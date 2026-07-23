# Medora Feature Inventory (vs AXON-style HMS)

**Last updated:** 2026-07-22  
**Reference:** AXON SOFTWARE v2024.0.11 [MultiSpec] screenshots + codebase audit

**Architecture note:** Most clinical desks use **localStorage + optional Supabase `hospital_desk_records` dual-write** (`src/lib/licensed-desk-store.ts`, `src/lib/shared/persisted-store.ts`). Seed data lives in desk `mockData.ts` files. Licensed/production path syncs via `src/routes/api/hospital/persist.ts` and `supabase/migrations/20260722110000_clinical_desk_persistence.sql`.

**Portals (RBAC):** admin, reception, doctor, lab, pharmacy, billing, nursing — `src/lib/supabase/rbac.ts`

**Legend:** ✅ working UI · 🟡 partial/mock/localStorage · ❌ missing · ➕ added in AXON parity round (2026-07-22)

---

## Reception / Front desk

**Exists (UI + working store)**
- Dashboard, register, patients, appointments (incl. new), check-in, queue, doctor board, token board/display — `src/routes/reception*.tsx`
- Vitals capture — `src/routes/reception.vitals.tsx`, shared vitals — `src/lib/shared/vitals-store.ts`
- **Admissions & beds** (assign/transfer/discharge workflow) — `src/components/reception-desk/pages/Admissions.tsx`, store — `src/lib/reception-desk/store.tsx`
- Front-desk billing, cash drawer, day sheet — `Billing.tsx`, `CashDrawer.tsx`, `DaySheet.tsx`
- **Insurance / pre-auth / claims** — `Insurance.tsx`, `PreAuthModal.tsx`
- Reports — `Reports.tsx`
- ➕ **Vaccination desk** — `/reception/vaccination`
- ➕ **Address book** — `/reception/address-book`
- ➕ **Patient reminders / birthdays** — `/reception/reminders`

**Partial / mock**
- Settings labeled mock — `src/routes/reception.settings.tsx`
- Demo patients/appointments seeded from mockData; encounters/queue bridged locally
- Print/receipt flows — `src/lib/reception-desk/print.ts`
- Vaccine stock is pharmacy inventory subset, not dedicated cold-chain module

**Missing vs AXON**
- Real TPA/insurance API, eligibility checks, claim adjudication
- MRD/file tracking, birth/death registration, MLC workflows
- Central patient merge/dedup at enterprise scale
- Live SMS/WhatsApp gateway (templates exist in masters)

---

## Doctor / EMR

**Exists**
- Portal nav — `src/lib/doctor-portal-nav.ts`
- Home, queue, schedule, patients, encounters, vitals, orders, results, prescriptions, messaging, notifications, statistics — `src/routes/doctor*.tsx`
- **E-prescriptions** (DDI checks, bilingual print, templates, pharmacy bridge) — `src/lib/doctor-prescription-workflow.ts`, UI — `src/components/doctor/prescriptions/`
- **30+ specialty desks** — `src/lib/specialties/catalog.ts`, `src/components/doctor/specialty/`
- **3D anatomy markers** (licensed `anatomy_3d`) — `SpecialtyAnatomyPanel.tsx`
- **Referrals** (sent/received workflow UI) — `DoctorReferralsScreen.tsx`
- AI Rx assist — `src/lib/doctor-prescription-ai.ts`
- ➕ **ICD-10 searchable picker** in Rx flow — `src/components/doctor/IcdPicker.tsx` + `DoctorPrescriptions.tsx`
- ➕ Pediatric vitals presets (HC, MUAC) — `src/lib/shared/vitals-config.ts`
- ➕ BMI/BSA helpers — `src/lib/hospital-masters/index.ts`

**Partial / mock**
- Patient charts largely from APK demo data — `src/lib/doctor-patients-apk-data.ts`
- Referrals seeded, not networked inter-facility
- Messaging UI without full secure messaging backend
- Copy Rx / diagnosis history — workflow exists but not AXON-speed keyboard flow

**Missing vs AXON**
- Full inpatient notes, nursing handoff, discharge summary generator
- CPOE integration with radiology RIS/PACS, OT scheduling from doctor
- Structured problem list synced to encounter billing (ICD on Rx only today)
- Digital signature on printed Rx

---

## Laboratory

**Exists**
- Role-split supervisor vs technician nav — `src/lib/lab-desk/roles.ts`
- Orders inbox, validation, samples, collection, processing, QC, reagents, storage, walk-in, catalog, team, reports — `src/routes/lab*.tsx`
- Store with order lifecycle, critical values, billing bridge — `src/lib/lab-desk/store.tsx`
- Doctor→lab order bridge — `src/lib/lab-desk/order-bridge.ts`
- Shared catalog — `src/lib/shared/lab-catalog.ts`

**Partial / mock**
- Seed orders/patients — `src/lib/lab-desk/mockData.ts`
- **Lab desk store NOT yet on `persisted-store` dual-write** (still in-memory + localStorage only)
- **Radiology page is snapshot only** — `Radiology.tsx` reads `hospital-erp-data.ts`

**Missing vs AXON**
- LIS instrument interfacing, barcode chain-of-custody at scale
- RIS/PACS, radiologist reporting, DICOM
- External lab network / reference lab

---

## Pharmacy

**Exists**
- Full nav — `src/lib/pharmacy-desk/nav.ts`
- Prescriptions inbox, dispense, ward deliveries, inventory, PO/GRN, formulary, controlled register — `src/routes/pharmacy*.tsx`
- Rich store (FEFO, DDI, ward orders, GST billing) — `src/lib/pharmacy-desk/store.tsx`
- Doctor Rx bridge — `prescription-bridge.ts`
- Admin formulary sync — `supabase/migrations/20260623100000_pharmacy_formulary.sql`

**Partial / mock**
- **Pharmacy desk store NOT yet on `persisted-store` dual-write**
- `/pharmacy/reports` redirects to operations
- No ERP vendor integration (SAP/Tally)

**Missing vs AXON**
- eMAR / bedside administration chart
- Narcotic vault hardware integration
- Central procurement contracts, batch recall at enterprise level

---

## Billing / Revenue cycle

**Exists**
- Dashboard, invoices, payments, encounters — `src/components/billing-desk/pages/`, store — `src/lib/billing-desk/store.tsx`
- Unified ledger (reception/lab/pharmacy sources) — `src/lib/shared/billing-ledger.ts`
- Encounter linkage — `src/lib/shared/encounters.ts`
- GST on pharmacy/reception invoices

**Partial / mock**
- No full insurance remittance posting; admin revenue uses ERP snapshots — `hospital-erp-data.ts`
- Encounters/invoices dual-write to Postgres when licensed path active

**Missing vs AXON**
- Package/tariff engine, corporate contracts, credit limits
- IPD interim/final bill automation, deposit/advance tracking UI
- TPA real-time eligibility, EDI claims
- Referring doctor commission payout

---

## Nursing

**Exists**
- Portal — `src/routes/nursing*.tsx`
- Dashboard, beds, patients, vitals, leave — `src/components/nursing-desk/pages/`
- Vitals store — `src/lib/nursing-desk/vitals.ts`

**Partial / mock**
- ➕ **Beds page now reads live reception admissions/beds** (was static ERP snapshot)
- Patients list from shared demo patients — `src/lib/shared/patients.ts`
- No dedicated nursing store beyond vitals localStorage
- Supabase has `beds`/`admissions`/`vitals_readings` tables; nursing UI uses reception localStorage bridge

**Missing vs AXON**
- Nursing notes, care plans, MAR, intake/output, shift handover
- Bed request/approval workflow from nursing side
- ICU flowsheets, ventilator charts

---

## Admin / Hospital management

**Exists**
- Command center, analytics, revenue, occupancy — admin desk pages
- Hospital profile, branches, departments, staff, access control, announcements, HR, doctor roster, services & fees, lab catalog, pharmacy formulary, OT board, hospital units, PHI audit — `src/routes/admin*.tsx`
- **OT management** — `OperationTheatre.tsx`
- **Hospital support units** (blood bank, CSSD, ambulance, etc.) — status boards only — `hospital-units.ts`
- License gating — `src/lib/license.ts`
- ➕ **Hospital masters hub** — `/admin/masters`
- ➕ **Clinical/operational registers** — `/admin/registers` (OPD, indoor, Rx, vaccine)

**Partial / mock**
- Analytics/revenue/occupancy largely from `hospital-erp-data.ts`
- Masters persisted via `hospital_desk_records` when licensed

**Missing vs AXON**
- Payroll, attendance hardware, asset management
- Full multi-hospital enterprise admin
- Policy-driven approval chains
- NABH/BSY/RSBY statutory register exports

---

## Patient portal

**Exists**
- Mobile home, book appointment, care/visits, medications, reports archive, profile, live queue, diet/exercise wellness — `src/routes/app.tsx`, `care*.tsx`, etc.
- Native app subset — `medora-native/`

**Partial / mock**
- Falls back to `mock-data.ts` when Supabase absent
- SMS is `sms:` deep link only — `patient-care-actions.ts`

**Missing vs AXON**
- Patient billing/payment portal, admission documents
- Teleconsult video, consent e-sign
- Push notification infrastructure (FCM/APNs end-to-end)

---

## Reports (clinical / operational)

**Exists**
- Patient reports hub, lab analytics, reception day sheet, doctor inbox aggregates, admin analytics
- ➕ **Admin registers** — OPD, indoor patients, prescriptions, vaccine, next-visit reminders

**Partial / mock**
- No statutory/regulatory report packs (HMIS, NABH indicators export)
- Pharmacy dedicated reports route stubbed

**Missing vs AXON**
- MIS builder, scheduled email reports, drill-down by department/doctor
- Notifiable disease, gynec registers
- Audit-ready export bundles

---

## Masters / Templates

**Exists**
- Service fees, lab catalog, pharmacy formulary/GST, doctor Rx templates, specialty order sets, staff/doctor registry
- ➕ **ICD-10 diagnosis master** — `/admin/masters/diagnosis` — `src/lib/hospital-masters/index.ts`
- ➕ **Investigation catalog** — `/admin/masters/investigations`
- ➕ **Vaccine schedule** — `/admin/masters/vaccines`
- ➕ **Advise templates** — `/admin/masters/advise`
- ➕ **Referring physician master** (commission field) — `/admin/masters/referring-doctors`
- ➕ **SMS / email / WhatsApp templates** — `/admin/masters/comms` (no live gateway)

**Partial / mock**
- Masters are localStorage + optional Postgres dual-write; no bulk ICD import wizard
- Templates are user-created/local, not hospital-wide published libraries with versioning

**Missing vs AXON**
- ICD bulk import (AXON Import menu)
- Consent form templates, discharge summary templates
- Drug interaction rule editor (DDI rules static — `ddiData.ts`)
- SNOMED/CPT linkage

---

## Wards / IPD

**Exists**
- Reception **full admission workflow** (bed assign, transfer, discharge) — `reception-desk/store.tsx`
- Admin occupancy board — `OccupancyLoad.tsx`
- ➕ Nursing beds view wired to reception store
- Pharmacy ward orders/deliveries — `WardOrders.tsx`
- DB schema for beds/admissions — clinical persistence migration

**Partial / mock**
- Admin occupancy still partly ERP snapshot
- Ward billing (daily room charges, package days) not implemented

**Missing vs AXON**
- Ward stock, diet orders from kitchen, nursing charts
- Bed blocking, housekeeping, isolation workflows
- Discharge clearance checklist (pharmacy/lab/billing gates)

---

## Vaccination / Immunization

**Exists**
- ➕ **Standalone vaccination desk** — `/reception/vaccination`
- ➕ **Vaccine schedule master** — `/admin/masters/vaccines`
- ➕ **Vaccine register** — `/admin/registers`
- Pediatrics specialty immunization fields — `catalog.ts`
- Flu vaccine in pharmacy mock inventory

**Partial / mock**
- Lot/expiry/cold-chain tracking is simplified
- No automated schedule reminders beyond reception reminders desk

**Missing vs AXON**
- U-WIN / government immunization reporting
- Adult/travel vaccine clinic workflow at scale
- Dedicated vaccine stock separate from general pharmacy

---

## Investigations (Lab + Imaging)

**Exists**
- Lab CPOE → processing → validation → notification (full desk)
- Doctor orders/results — `doctor.orders.tsx`, `doctor.results.tsx`
- ➕ Investigation master catalog (admin) — links to lab catalog conceptually
- Specialty investigation order sets in specialty catalog

**Partial / mock**
- Radiology = static list, no reporting workflow

**Missing vs AXON**
- Cardiology holter, PFT, EEG as separate departments
- External diagnostic center integration
- Pending investigations unified view at reception (partial via lab desk)

---

## Accounts / Finance (GL)

**Exists**
- Operational billing ledger — `billing-ledger.ts`
- GST on invoices
- Admin revenue charts from mock ERP data
- SaaS subscription billing (Stripe) — `src/routes/api/billing/*`

**Missing vs AXON**
- **Chart of accounts, GL, AP/AR, bank reconciliation**
- Vendor payments, payroll, fixed assets
- Tally/SAP/QuickBooks integration
- Cost center / departmental P&L
- 3C register, referring doctor share payout (AXON Accounts menu)

---

## SMS / WhatsApp / Notifications

**Exists**
- In-app patient notifications — `patient-notifications-store.ts`
- Doctor/staff notification UI, admin announcements
- ➕ **Comms templates master** (SMS/email/WhatsApp bodies) — `/admin/masters/comms`
- Lab/pharmacy in-app patient notification on result/Rx events

**Missing vs AXON**
- **Twilio/WhatsApp Business API, SMS gateway**
- Appointment reminder automation, OTP via SMS
- SMS/WhatsApp log registers (AXON Reception menu)
- Bulk campaign / consent-managed messaging

---

## Multilingual

**Exists**
- **Prescription print i18n:** English, Hindi, Telugu, Tamil — `doctor-prescription-i18n.ts`
- Diet language picker — `diet-language-store.ts`
- Advise templates support en/hi/mr/gu locales in masters

**Partial**
- UI chrome is English-only; no app-wide i18n framework

**Missing vs AXON**
- Full HMS UI localization (Hindi/Marathi/Gujarati chrome)
- Multilingual clinical documents beyond Rx

---

## ICD / Diagnosis masters

**Exists**
- ➕ **Searchable ICD-10 master** with seed codes — `hospital-masters/index.ts`
- ➕ **IcdPicker** in doctor prescriptions — sets `diagnosis` + `diagnosisIcd`
- `diagnosisIcd` on prescriptions — `doctor-prescription-store.ts`
- Pre-auth diagnosis + ICD field — `PreAuthModal.tsx`

**Partial / mock**
- No bulk ICD-10/11 import wizard
- Encounter-level primary/secondary coding for billing not wired

**Missing vs AXON**
- SNOMED/CPT linkage, morbidity reporting
- Diagnosis history dropdown from coded encounter archive

---

## Referring doctors / External network

**Exists**
- Outbound doctor referrals UI — `doctor.referrals.tsx`
- ➕ **Referring physician master** with commission % — `/admin/masters/referring-doctors`
- Referral inbox in doctor reports

**Partial / mock**
- Inbound referral registration at reception not dedicated screen
- Commission payout not in billing accounts

**Missing vs AXON**
- Referral analytics, visit tracking, TPA tie-ins
- Ref-by register (partially covered in admin registers)

---

## Cross-cutting

| Area | Path | Status |
|------|------|--------|
| AI CDSS (licensed) | `src/routes/api/ai/*` | 🟡 assist, not full CDSS |
| PHI audit / compliance | `admin.audit.tsx`, `phi-audit.ts` | ✅ strong |
| Global search | `global-search.ts` | ✅ |
| Staff leave (all portals) | `StaffLeavePortal.tsx` | ✅ local store |
| Docker/deploy | `Dockerfile`, `docker-compose.yml` | ✅ |
| Postgres clinical persistence | `20260722110000_clinical_desk_persistence.sql` | 🟡 ~60% wired |

---

## Summary: Medora vs full AXON-style HMS

| Maturity | Modules |
|----------|---------|
| **Strong UI + workflow (demo-ready)** | Reception OPD, Doctor EMR + specialties, Lab LIS-style desk, Pharmacy, front-desk billing ledger |
| **Present but thin/mock** | Admin analytics, Radiology, Insurance UI, Accounts/GL, live comms |
| **Recently improved (➕)** | Hospital masters, ICD picker, vaccination, registers, referring doctors, nursing↔reception beds |
| **Mostly missing** | GL/Tally, live SMS/WhatsApp, RIS/PACS, eMAR, payroll, statutory MIS (NABH/BSY/RSBY), lab/pharmacy Postgres wiring |

**Bottom line:** Medora is a **multi-desk clinical demo/SaaS platform** with rich OPD + lab + pharmacy flows and an extensive specialty EMR layer. After the AXON parity round it covers **masters, immunization, ICD coding, and operational registers** that were previously absent. It is **still not** a complete AXON-class HMS until finance/GL, live communications, RIS/PACS, eMAR/nursing depth, and full Postgres persistence for lab/pharmacy desks are built.

---

## Quick links (dev `:8787`)

| Feature | URL |
|---------|-----|
| Hospital masters | `/admin/masters` |
| Registers | `/admin/registers` |
| Vaccination | `/reception/vaccination` |
| Reminders | `/reception/reminders` |
| Address book | `/reception/address-book` |

Demo: `admin@oakhaven.demo` / `MedoraDemo!2026Admin` · `doctor@oakhaven.demo` / `MedoraDemo!2026Doc`

See also: `docs/evidence/AXON_FEATURE_GAP_ANALYSIS.md`
