# Test report — 2026-07-22 (updated after 10/10 packaging)

## Vitest
```
npm test
```
**18 passed** — hospital persist auth, license, remote-sync, phi-audit CSV, sales-ops Turnstile, seat limits.

## Smoke
```
npm run test:smoke
```
Chart round-trip + doctors/units seed OK against Supabase.

## Playwright E2E
```
npm run test:e2e
```
**4 passed** — buyer home, pricing/register, trust/BAA/status API, security/SLA (port 4177).

## Manual buyer checks
- `/` marketing home
- `/trust` procurement pack
- `/legal/baa` template downloads
- Admin → PHI audit (CSV export)
- Admin → Settings (logo + billing portal)
