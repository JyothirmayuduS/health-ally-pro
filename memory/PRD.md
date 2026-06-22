# Medora — Lab Portal (PRD)

## Original problem statement
Build the Medora **Lab portal** as a self-contained module aligned with the existing Supabase schema (`lab_orders`, `lab_results`) and roles (`lab_technician`, `lab_supervisor`). Doctor and patient portals come later — lab should run on **mock data first** (same approach as reception desk). Build full MVP (5 workflow routes) plus Phase 2 (catalog, samples, reports, settings). Match the existing Medora design system: sage green palette, Work Sans + IBM Plex typography, sidebar + topbar layout. Pure-frontend mock store with localStorage persistence. Include browser-printable PDF lab reports.

## Architecture
- **Stack:** React 19 + react-router 7 + Tailwind + shadcn/ui + lucide-react + sonner.
- **State:** `LabProvider` (React Context) persisting to `localStorage` key `medora_lab_store_v1`. Mock data seeded from `/app/frontend/src/lab/mockData.js`.
- **Routing:** `/` → redirect to `/lab`. `/lab/*` mounted under `LabShell` with nested routes:
  - `/lab` Dashboard · `/lab/orders` · `/lab/collection` · `/lab/processing` · `/lab/validation`
  - `/lab/catalog` · `/lab/samples` · `/lab/reports` · `/lab/settings`
- **Theming:** custom sage palette in `index.css` (`--sage-50..900`, `--paper`, `--ink`), font stack Work Sans (UI) + IBM Plex Sans/Mono (display & data).
- **PDF report:** native browser `window.print()` against a styled `print-area` modal; no extra deps.
- **Dev infra fix:** `craco.config.js` patched to bridge react-scripts' webpack-dev-server v4 API (`onAfterSetupMiddleware`, `https`) to the v5 schema (forced by package resolutions).

## User personas
1. **Lab Technician** — runs the bench: collects samples, enters results, submits for validation. (Cannot validate.)
2. **Lab Supervisor** — reviews completed results, approves & releases, rejects back to processing, prints official reports.
3. **(Future) Hospital admin / doctor / patient** — wired as integration stubs; not yet built.

## Core requirements (static)
- End-to-end workflow: `ordered → collected → processing → validation → validated`, plus `cancelled`.
- Role gating in the topbar (demo switcher).
- STAT/Urgent/Routine priority surfacing.
- Auto-flag results vs reference ranges (low / high / critical) with critical-value alerting.
- Printable hospital-letterhead report at release.

## What's been implemented (2026-01-22)
- **Dashboard** — KPIs (new/to-collect/processing/pending/released), STAT alerts, TAT watch with progress bars, workload by section, staff on duty, recent activity timeline, quick actions (oldest pending, open collection).
- **Orders inbox** — searchable/filterable table (status + priority), order detail drawer with patient/doctor/test/sample/notes/timeline, print-label window, cancel-with-reason dialog.
- **Collection** — card queue prioritised by STAT/urgent/routine, patient-verify dialog, mark-collected with collection note, reject-with-reason re-queues to `ordered`, label printing.
- **Processing** — claim-on-open behaviour, parameter entry form with live flag pills (low/high/critical), critical-value banner, save-draft / submit-for-validation (validates all fields filled).
- **Validation & release** — supervisor-only approve & release, reject-back-to-processing with comment, dual-signoff banner on criticals, **preview report modal** with hospital letterhead + browser print → PDF, recently released gallery.
- **Phase 2 pages** — read-only test Catalog (search + section filter), Sample tracking (accession lifecycle progress), Reports (volume by test, critical log, aging backlog, CSV export), Settings (toggles for alerts, dual-signoff, notification rules, label printer template, TAT targets).
- **Shell** — sidebar with workflow + reference groups and live count badges, topbar with global search, lab-open indicator, role switcher (Lab Technician ↔ Lab Supervisor), reset-mock-data utility.
- **Testing** — `testing_agent_v3` iteration 1: 100% of critical flows passed. Console warnings (NavItem key-spread, missing DialogDescription) fixed in follow-up.

## Prioritized backlog
- **P1** Wire real Supabase `lab_orders` / `lab_results` once backend is up (replace store actions with API calls).
- **P1** Integrate the reception walk-in lab flow (order placement enters this inbox).
- **P2** Real RBAC + Emergent Google auth for staff sign-in.
- **P2** Doctor inbox + patient app surfaces consuming released reports.
- **P2** Admin `/admin/lab-catalog` CRUD; today catalog is read-only seed.
- **P3** HL7 / machine output upload, reagent QC log, microbiology culture workflow, delta-check rules.

## Next tasks
1. Hook backend persistence (Supabase or FastAPI+Mongo) replacing localStorage in `store.jsx`.
2. Build doctor-facing order-placement form to feed the Orders inbox.
3. Wire critical-value notification stub to SMS/email integration playbook.

## Enhancement idea
**Patient-facing report QR code** on each printed lab PDF — scans to a secure patient-app deep link to the result. Drives adoption of the patient portal once it lands, and is a strong moment of "wow" at report pickup.
