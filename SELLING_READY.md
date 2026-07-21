# Medora — Selling-ready roadmap

Goal: hospital buyers can evaluate, license, and go live without treating Medora as a demo.

## Sales model (default)

**B2B SaaS for multi-specialty hospitals** — annual/monthly hospital subscription + optional per-branch add-ons.  
(One-time perpetual license can reuse the same packaging; only billing changes.)

---

## Phase 1 — Trust & packaging (must-have to sell)

| # | Item | Status |
|---|------|--------|
| 1.1 | Public **For Hospitals** buyer landing | Done — `/for-hospitals` |
| 1.2 | **Terms, Privacy, Medical disclaimer** | Done — `/legal/*` |
| 1.3 | **LICENSE** + anatomy **ATTRIBUTION** | Done |
| 1.4 | **Evaluation watermark** only when unlicensed | Done — `VITE_MEDORA_LICENSE_KEY` |
| 1.5 | **Demo passwords gated** for production | Done — `VITE_ALLOW_DEMO_AUTH` |
| 1.6 | Pricing page + plan cards | Done — `/pricing` |
| 1.7 | Security one-pager | Done — `SECURITY.md` |
| 1.8 | Hospital onboarding draft | Done — `/register-hospital` |

## Phase 2 — Multi-tenant commercial ops

| # | Item | Status |
|---|------|--------|
| 2.1 | Hospital onboarding wizard (create tenant, admin invite) | Partial — lead capture + rate limit; tenant provision auth-gated; admin invite email TBD |
| 2.2 | White-label branding (name, logo, accent) | Partial — brand draft + accent stored; logo upload TBD |
| 2.3 | Seat / specialty module entitlement from license plan | Pending |
| 2.4 | Stripe Checkout + Customer Portal (wiring) | Pending |

## Phase 3 — Clinical production (procurement blockers)

| # | Item | Status |
|---|------|--------|
| 3.1 | Specialty charts, doctor registry, hospital units → Supabase | Done — migration + `/api/hospital/persist` dual-write |
| 3.2 | Encounter-linked 3D anatomy markers in DB | Done — specialty markers via API |
| 3.3 | Audit export (who accessed PHI) | Pending |
| 3.4 | BAA template + DPA pack for legal | Pending (docs drafts exist) |

**Apply migration:** `supabase/migrations/20260721183341_specialty_hospital_persistence.sql`  
**Requires:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the server for durable writes (localStorage remains offline cache).

**Tests:** `npm test` · `npm run test:smoke` · `npm run test:smoke:http` (with `npm run dev`) — see [docs/TEST_REPORT_2026-07-22.md](docs/TEST_REPORT_2026-07-22.md).

## Phase 4 — Close the deal

| # | Item |
|---|------|
| 4.1 | Demo tenant sandbox (isolated, reset nightly) |
| 4.2 | Implementation checklist for hospital IT |
| 4.3 | SLA / uptime page |
| 4.4 | Sales deck PDF export from product screenshots |

---

## Buyer journey (when Phase 1–2 land)

```
/for-hospitals  →  /pricing  →  /register-hospital  →  /login (admin)
                      ↓
                 /legal/* (trust)
```

## What still blocks a signed enterprise contract

Even after Phase 1 packaging: **billing must be live** (Phase 2.4) and **audit/BAA pack** (Phase 3.3–3.4) before claiming HIPAA-ready production for paying hospitals. Clinical specialty data already dual-writes to Supabase.
