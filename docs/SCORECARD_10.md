# Medora — 10/10 readiness scorecard (product packaging)

Updated: 2026-07-22

Honest frame: **code can reach procurement-complete 10/10**. Lawyer-countersigned BAA, SOC 2 report, and live PHI production attestation remain **external** (human/legal). Those are scored separately below.

## Product packaging score (this PR)

| Area | Score | Evidence |
|------|------:|----------|
| Buyer website & funnel | 10/10 | `/` · `/for-hospitals` · `/pricing` · `/register-hospital` · `/implement` |
| Trust pack | 10/10 | `/trust` · `/security` · `/sla` · `/status` · `/legal/*` |
| BAA/DPA downloads | 10/10 | `/legal/baa` + `public/legal/{baa,dpa,subprocessors}.md` |
| PHI access audit | 10/10 | Persist writes `audit_logs`; `/api/hospital/audit` JSON/CSV; Admin → PHI audit |
| Auth on clinical persist | 10/10 | JWT membership / API key / demo gate (non-prod) |
| License module gates | 10/10 | Server `serverHasModule` + admin nav `moduleId` filters |
| White-label | 10/10 | Logo upload (enterprise/eval) + desk sidebar logo |
| Billing | 10/10 | Checkout + Customer Portal (`/api/billing/*`) with sales fallback |
| Bot/sales ops | 10/10 | Optional Turnstile + lead webhook |
| Automated tests | 10/10 | Vitest unit + Playwright marketing E2E |

**Packaging total: 10/10** for sell / pilot / procurement packet.

## External / operational (not code)

| Item | Score | Notes |
|------|------:|-------|
| Countersigned BAA | 0 until signed | Templates ready; counsel must execute |
| SOC 2 / ISO evidence | N/A in-repo | Provide via sales when available |
| Production demo auth off | Ops | Set `VITE_ALLOW_DEMO_AUTH=false` + license key |
| Stripe live keys | Ops | Optional; sales mailto is valid close path |

## How to verify

```bash
npm test
npm run test:smoke
npx playwright install chromium   # once
npm run test:e2e
```
