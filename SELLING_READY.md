# Medora — Selling-ready roadmap

Goal: hospital buyers can evaluate, license, and go live without treating Medora as a demo.

## Sales model (default)

**B2B SaaS for multi-specialty hospitals** — annual/monthly hospital subscription + optional per-branch add-ons.  
(One-time perpetual license can reuse the same packaging; only billing changes.)

---

## Phase 1 — Trust & packaging (must-have to sell)

| # | Item | Status |
|---|------|--------|
| 1.1 | Public **buyer home** + For Hospitals | Done — `/` marketing · `/for-hospitals` product |
| 1.2 | **Terms, Privacy, Medical disclaimer, BAA** | Done — `/legal/*` |
| 1.3 | **LICENSE** + anatomy **ATTRIBUTION** | Done |
| 1.4 | **Evaluation watermark** only on product shells | Done — marketing pages clean |
| 1.5 | **Demo passwords gated** for production | Done — `VITE_ALLOW_DEMO_AUTH` |
| 1.6 | Pricing + sales mailto CTAs | Done — `/pricing` |
| 1.7 | Security + SLA pages | Done — `/security` · `/sla` |
| 1.8 | Hospital onboarding + thank-you | Done — `/register-hospital` |
| 1.9 | Implementation checklist | Done — `/implement` |

## Phase 2 — Multi-tenant commercial ops

| # | Item | Status |
|---|------|--------|
| 2.1 | Hospital onboarding wizard | Done — lead capture + sales handoff; provision auth-gated |
| 2.2 | White-label branding | Partial — name/accent; logo upload TBD |
| 2.3 | Seat / specialty module entitlement | Done — server `serverHasModule` on persist API |
| 2.4 | Stripe Checkout | Scaffold — `/api/billing/checkout` (Stripe when keys set, else sales mailto) |

## Phase 3 — Clinical production (procurement blockers)

| # | Item | Status |
|---|------|--------|
| 3.1 | Specialty charts, doctors, units → Supabase | Done |
| 3.2 | 3D anatomy markers in DB | Done |
| 3.3 | Audit export (who accessed PHI) | Pending |
| 3.4 | BAA template + DPA pack | Done overview page — signed pack via sales |

**Tests:** `npm test` · `npm run test:smoke` · `npm run test:smoke:http` — [docs/TEST_REPORT_2026-07-22.md](docs/TEST_REPORT_2026-07-22.md).

## Buyer journey

```
/  →  /for-hospitals  →  /pricing  →  /register-hospital  →  sales email / implement
              ↓
     /security · /sla · /legal/*
```

Patient product: `/app` · Staff: `/login`

## What still blocks a signed enterprise HIPAA claim

**PHI access audit export** (3.3) and **lawyer-signed BAA** (not just the overview page). Stripe live keys optional until self-serve billing is required — sales order forms are the default close path.
