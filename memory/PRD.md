# Oakhaven Pharmacy Desk — PRD

## Original problem statement

Build a pharmacy portal that sits after the doctor consult and before the patient
leaves with medicine. Five modules: Dashboard, Prescriptions inbox, Dispense
counter, Refills, Inventory. Demo login `pharmacy@oakhaven.demo` / `Demo1234!`
(Riley Chen, pharmacist). Sage / paper theme, matching the lab/reception style.
Branch: `pharmacy`.

## Architecture

- **Stack**: React 19 (CRA + craco), Tailwind, shadcn/ui primitives, lucide-react
  icons, react-router 7. No backend wired in for v1 — all data is mock and
  persisted via `localStorage`.
- **Theme**: sage primary (`#455c47`), warm paper background (`#FAF7F0`),
  Fraunces display / Manrope body / JetBrains Mono numerals. Subtle paper grain.
- **Auth (mock)**: `src/lib/auth/authContext.jsx` — two seeded accounts
  (pharmacist + doctor). `requirePortalAccess(portal)` enforces the right portal.
- **Pharmacy store**: `src/lib/pharmacy-desk/store.jsx` — context + reducer-style
  helpers. Status workflow mirrors lab:
  `new → in_review → ready_to_dispense → dispensing → dispensed → collected`
  (alt: `on_hold` / `cancelled`). FIFO batch decrement on dispense.
- **Mock data**: `src/lib/pharmacy-desk/mockData.js` — 7 patients, 4 staff,
  8 drugs with batches, 6 prescriptions covering every status, 4 refill requests.

## Routes

| Path                       | Module             | Status |
|----------------------------|--------------------|--------|
| `/`                        | Landing            | ✅ |
| `/login`                   | Demo sign-in       | ✅ |
| `/pharmacy`                | Dashboard          | ✅ |
| `/pharmacy/prescriptions`  | Inbox + drawer     | ✅ |
| `/pharmacy/dispense`       | 3-lane Kanban      | ✅ |
| `/pharmacy/refills`        | Pending / Approved / Denied | ✅ |
| `/pharmacy/inventory`      | Stock + batches    | ✅ |
| `/doctor`                  | Doctor e-Prescribe stub (handoff) | ✅ |

## What's been implemented (2026-01)

- Sage/paper design system with Fraunces + Manrope + JetBrains Mono
- Demo auth with `requirePortalAccess` and cross-portal sign-out → sign-in fix
- PharmacyProvider with full state transitions + audit trail
- Dashboard: KPIs, urgent STAT strip, worklist with row-click drawer, search
- Prescriptions inbox: tabs (`all/new/in_review/cleared/on_hold`), search,
  priority filter, status legend, full audit-trail drawer with allergy &
  short-stock alerts
- Dispense counter: 3 Kanban lanes, label preview, FIFO batch decrement,
  partial-dispense path, mark-collected
- Refills: tabs, approve-creates-new-Rx, deny with reason modal,
  auto-refill / overdue / supply-left visual cues
- Inventory: All / Low / Expiring soon / Out filters, per-batch ±10 adjustments,
  quarantine, receive-stock modal with lot+qty+expiry
- Doctor portal stub: prescription form that pushes new Rx into the shared
  mock store → appears live in pharmacy inbox
- All interactive elements carry `data-testid`s
- 100% pass on testing agent iteration_2 after fixing the post-signOut
  re-login bug

## Backlog (Phase 2)

- P1: Allergy / drug-drug interaction warnings driven by mock rule set
- P1: Multi-item dispense UX (currently one card per Rx; multi-item is data-modelled but UI dispenses all together)
- P1: Reports view — top drugs, turnaround time, dispense throughput
- P2: Barcode scan placeholder for batch picking
- P2: Returns flow (post-dispense)
- P2: Patient app channel for refill requests (currently seeded as `source: patient_app`)

## Phase 3 (production handoff)

- Replace mock store with Supabase tables: `prescriptions`, `prescription_items`,
  `inventory_batches`, `dispense_events`, `refills`
- Wire billing portal — push dispense events as invoice line items
- Add `pharmacy_supervisor` role + RBAC
- Real Doctor portal integration when that build lands

## User personas

- **Riley Chen, Lead Pharmacist** — primary user, lives in /pharmacy all day,
  prioritises STAT scripts, watches expiring batches.
- **Dr. Elena Marsh, Doctor** — secondary; uses the stub portal to push
  prescriptions into the pharmacy inbox.

## Demo credentials

See `/app/memory/test_credentials.md`.
