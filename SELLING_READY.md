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
| 1.2 | **Terms, Privacy, Medical disclaimer, BAA** | Done — `/legal/*` + downloadable templates |
| 1.3 | **LICENSE** + anatomy **ATTRIBUTION** | Done |
| 1.4 | **Evaluation watermark** only on product shells | Done — marketing pages clean |
| 1.5 | **Demo passwords gated** for production | Done — `VITE_ALLOW_DEMO_AUTH` |
| 1.6 | Pricing + sales mailto CTAs | Done — `/pricing` |
| 1.7 | Security + SLA pages | Done — `/security` · `/sla` |
| 1.8 | Hospital onboarding + thank-you | Done — `/register-hospital` (+ optional Turnstile) |
| 1.9 | Implementation checklist | Done — `/implement` |
| 1.10 | Trust pack + status | Done — `/trust` · `/status` |

## Phase 2 — Multi-tenant commercial ops

| # | Item | Status |
|---|------|--------|
| 2.1 | Hospital onboarding wizard | Done — lead capture + sales handoff; provision auth-gated |
| 2.2 | White-label branding | Done — name/accent + logo upload (enterprise/eval) |
| 2.3 | Seat / specialty module entitlement | Done — server gates + admin nav module filters + seat caps UI |
| 2.4 | Stripe Checkout + Portal | Done — `/api/billing/checkout` · `/api/billing/portal` (sales fallback) |
| 2.5 | Lead webhook | Done — `MEDORA_LEAD_WEBHOOK_URL` |

## Phase 3 — Clinical production (procurement blockers)

| # | Item | Status |
|---|------|--------|
| 3.1 | Specialty charts, doctors, units → Supabase | Done |
| 3.2 | 3D anatomy markers in DB | Done |
| 3.3 | Audit export (who accessed PHI) | Done — Admin → PHI audit + CSV |
| 3.4 | BAA template + DPA pack | Done — downloadable markdown + overview |

**Scorecard:** [docs/SCORECARD_10.md](docs/SCORECARD_10.md) — packaging **10/10**; countersigned BAA remains external.

**Tests:** `npm test` · `npm run test:smoke` · `npm run test:e2e` — [docs/TEST_REPORT_2026-07-22.md](docs/TEST_REPORT_2026-07-22.md).

## Buyer journey

```
/  →  /for-hospitals  →  /pricing  →  /register-hospital  →  sales email / implement
              ↓
     /trust · /security · /sla · /status · /legal/*
```

Patient product: `/app` · Staff: `/login`

## What still blocks a signed enterprise HIPAA claim

**Lawyer-countersigned BAA** (templates are ready) and your production ops checklist (`VITE_ALLOW_DEMO_AUTH=false`, license key, optional Stripe/Turnstile secrets). PHI audit export is implemented in-product.
