# Medora — Honest UI / UX / workflow audit (evidence-based)

Date: 2026-07-22  
Environment: Vite `http://127.0.0.1:8787` (evaluation watermark on every desk)  
Method: Playwright walkthroughs + browser screenshots under `docs/evidence/ui-audit/`  
Raw JSON: `walkthrough-raw.json`, `walkthrough-after-portal-fix.json`

**No overall score. No “looks good.” Claims below cite screenshots, URLs, or files.**

---

## A. Security follow-through (brief, with proof)

| Item | Status | Proof |
|------|--------|-------|
| A1 `writePhiAudit` DLQ | Implemented; forced failure captured | `docs/evidence/audit-write-dlq-proof.json` (`pass: true`, `health.alert: true`, sample error `PHI_AUDIT_FORCE_FAIL`) |
| A2 Seven revoked tables | No Postgres-backed UI; mock/localStorage only | `docs/evidence/REVOKED_TABLES_FEATURE_STATUS.md` |
| A3 Worker PHI latency | Profiled; parallel auth ≈ **353ms median** vs ~113ms direct | `docs/evidence/phi-worker-latency-profile-after-parallel.json` |
| A4 Concurrent audit | 8 parallel reads → 8 unique audit rows | `docs/evidence/phi-audit-concurrency-proof.json` |

---

## B. Docker (honest)

See `docs/evidence/docker-build-report.md` + `.json`.

- Hardening present: multi-stage, `USER medora`, digest pin, no secrets in layers, HEALTHCHECK probes `/api/status`.
- **Runtime does not serve the app** (`vite preview` → 404; `wrangler dev` → missing `@tanstack/react-start/server-entry`).
- Image ~**1.35GB**. Only **macOS arm64 / Docker Desktop** verified.

---

## C. Feature inventory vs docs / scorecard claims

Scorecard (`docs/SCORECARD_10.md`) claims packaging 10/10 including specialty desks, billing, PHI audit, etc. Below is what a click-through actually finds.

| Feature (docs / marketing claim) | Status | Evidence |
|----------------------------------|--------|----------|
| Buyer marketing site (`/`, pricing, trust) | **Partially working** — pages render | `_marketing/01-landing-*.png` |
| Staff login + demo accounts | **Partially working** — doctor/admin/reception/patient enter desks; lab/pharmacy/nursing/billing were broken by SSR `beforeLoad` until client-only fix (still rough for nested lab routes) | Before: `walkthrough-raw.json` lab URLs all `/login?redirect=/lab`. After: `lab/fixed_lab.png` shows Maple Lab bench |
| Specialty desks (Eye/Heart/Children/Bones) | **Partially working** — UI exists; general medicine desk loads after delay; 3D anatomy tab present | `doctor/fixed_doctor_specialty.png`; earlier manual shot stuck on “Loading specialty workstation…” |
| Doctor EMR / queue / patients | **Partially working** — rich UI on seed/mock data; identity inconsistency; hydration errors | `doctor/fixed_doctor.png`; console hydration mismatches in `walkthrough-raw.json` |
| Reception flow (register, check-in, queue, billing) | **Partially working — UI + local store** | `reception/fixed_reception*.png`, mobile `reception/fixed-mobile-home.png` |
| Lab bench | **UI-only / mock store** — counters mostly 0; Collection/Orders bounce for tech when SSR gate ran | `lab/fixed_lab.png`; `fixed_lab_orders.png` was login page |
| Pharmacy dispense / inventory | **UI-only / mock store** | `pharmacy/fixed_pharmacy*.png` |
| Nursing IPD / beds / vitals | **UI-only / mock** — “VITALS TODAY 0” | `nursing/fixed_nursing*.png` |
| Hospital billing ledger (invoices/payments/encounters tables) | **UI-only / localStorage** — not the revoked Postgres tables | `billing/fixed_billing*.png`; `REVOKED_TABLES_FEATURE_STATUS.md` |
| Admin command center / OT / occupancy / revenue | **UI with mock KPIs** — charts present in later shot; OT board is seed | `admin/fixed_admin.png`, `admin/fixed_admin_ot.png` |
| PHI audit admin screen | **Partially working** — route exists; Worker audit path proven separately | `admin/fixed_admin_audit.png` + Worker JSON proofs |
| Patient app (`/care`, `/book`) | **Partially working** — curated care shell; 401s observed in console for some resources | `patient/fixed_care.png`; console `401` in raw walkthrough |
| Stripe SaaS billing | **Ops/config dependent** — status endpoint shows billing check optional/false in degraded status | `/api/status` curl in session |
| Cross-desk live PHI in Postgres | **Not for lab/pharmacy/encounters/invoices/payments/prescriptions/notifications** | Revoke status doc |

---

## Role walkthroughs (primary workflow)

### Doctor (`doctor@oakhaven.demo`)
Screens: `doctor/fixed_doctor.png`, `fixed_doctor_specialty.png`, `fixed_doctor_prescriptions.png`, `manual-01-home.png`, mobile home.

| Observation | Evidence |
|-------------|----------|
| Sidebar / greeting name mismatch (e.g. Aarav Mehta vs Dr. Rajesh) | `manual-01-home.png` / `fixed_doctor.png` text |
| Work queue duplicates patient name (“Sneha Rao · Sneha Rao”) | Same screenshots |
| “Call now” often disabled | Doctor home cards |
| Specialty desk slow to load (“Loading specialty workstation…”) | `manual-03-specialty-desk.png` |
| Nested `<a>` hydration / invalid HTML on patients list | Console errors in `walkthrough-raw.json` |
| No portal `beforeLoad` on `/doctor` — any logged-in (or none) can open shell until client logic | `src/routes/doctor.tsx` |

### Admin
Screens: `admin/fixed_admin.png`, OT, audit, mobile.

| Observation | Evidence |
|-------------|----------|
| Dense command center with mock revenue/OPD/IPD/lab/OT widgets | `fixed_admin.png` |
| Hospital brand “Oak Haven Medical” vs desks saying “Maple Hospital” | Admin vs lab/reception screenshots |
| AI briefing “Synthesizing…” / empty chart regions observed in some loads | Earlier browser snapshot + admin shot |
| Client-only `beforeLoad` (SSR ungated) | `src/routes/admin.tsx` |

### Reception
Screens: `reception/fixed_reception*.png`, `fixed-mobile-home.png`.

| Observation | Evidence |
|-------------|----------|
| Full workflow chrome: register, check-in, queue, billing | Screenshots |
| Mobile dashboard usable but truncated doctor names | `fixed-mobile-home.png` |
| Horizontal overflow detected on some 390px reception steps (earlier run) | `walkthrough-raw.json` `overflow` for `reception@390` |
| Data is desk-local / seed — not Postgres `encounters`/`invoices` | Code: reception-desk store; revoke doc |

### Lab
Screens: `lab/fixed_lab.png`, mobile; orders/collection were login pages before nested-gate fix.

| Observation | Evidence |
|-------------|----------|
| Bench UI exists; queues empty (0 draws) | `fixed_lab.png` |
| Supervisor paths locked with padlock for technician | Same |
| Nested routes used SSR `requireLabTechnician/Supervisor` → demo bounce to login | Pre-fix: `walkthrough-after-portal-fix.json` orders/collection → `/login`. Post-fix (`roles.ts` SSR skip): `lab/fixed_lab_collection_after_roles_fix.png` URL `/lab/collection` |
| Brand Maple Hospital | Screenshot |

### Pharmacy / Nursing / Billing
Screens under respective `fixed_*.png`.

| Role | What you see | Backend honesty |
|------|--------------|-----------------|
| Pharmacy | Control desk, Rx inbox counts, dispense screens | Mock/local store (`pharmacy-desk/store`) |
| Nursing | Ward dashboard, beds, vitals today = 0 | Mock desk |
| Billing | Invoices/payments UI, ₹0 collections today in mobile preview | localStorage ledger — not Postgres |

### Patient
Screens: `patient/fixed_care.png`, `fixed_book.png`, mobile.

| Observation | Evidence |
|-------------|----------|
| Care shell + book flow render | Screenshots |
| Console 401 on some loads | `walkthrough-raw.json` patient consoleSample |

---

## Mobile (390×844)

- Marketing login/landing captured (`_marketing/*-mobile.png`).
- Desk mobile homes captured (`*/fixed-mobile-home.png`).
- Reception mobile is dense but navigable; name truncation is rough.
- Earlier automated overflow flag: reception @390 (`walkthrough-raw.json`).
- Product is clearly desktop-first; mobile is “doesn’t explode” not “hospital-floor ready.”

---

## Inconsistencies (cross-cutting)

1. **Hospital naming:** Oak Haven (admin) vs Maple Hospital (lab/reception/pharmacy/nursing/billing) vs “Oakhaven” lobby copy — screenshots across roles.
2. **Doctor identity:** login demo “Dr. Aarav Mehta” vs home “Dr. Rajesh” / Internal Medicine vs General Medicine.
3. **Portal auth model:** doctor/reception ungated; admin/lab/pharmacy/billing/nursing gated; demo session invisible to SSR → bounce loops (partially mitigated 2026-07-22).
4. **Hydration mismatches** on live timers / money figures — console evidence.
5. **Evaluation watermarks** everywhere — correct for eval, fatal for a live demo if not explained.

---

## Worst 5 problems (demo-embarrassing order)

1. **Docker image does not run the app** (404 / wrangler entry missing) while docs/compose imply a runnable stack — `docs/evidence/docker-build-report.md`, `docker-runtime-logs.txt`.
2. **Lab (and previously pharmacy/nursing/billing) demo login → bounce to login** because SSR `beforeLoad` cannot see demo sessions; nested lab routes still demonstrated bounce in `walkthrough-after-portal-fix.json` before helper fix.
3. **Clinical/ops desks are localStorage/mock while marketing + scorecard read as a hospital OS** — revoke table status + empty lab queues + billing ledger keys.
4. **Doctor identity / duplicated work-queue strings / disabled Call now** on the first screen a clinician sees — `doctor/fixed_doctor.png`, `manual-01-home.png`.
5. **Hospital brand splintering (Oak Haven vs Maple) plus empty/loading specialty & AI stubs** — admin vs desk screenshots; specialty loading shot; admin AI “Synthesizing…”.

---

## Screenshot index

All under `docs/evidence/ui-audit/`:
- `_marketing/` landing + login desktop/mobile  
- `doctor|admin|reception|lab|pharmacy|nursing|billing|patient/` including `fixed_*` post-fix captures  
- JSON: `walkthrough-raw.json`, `walkthrough-after-portal-fix.json`
