# Test report — 2026-07-22

## Commands

| Command | Result |
|---------|--------|
| `npm test` (Vitest) | **12/12 passed** |
| `npm run test:smoke` (Supabase live) | **ok** — chart round-trip; 6 doctors; 12 units; lead insert/delete |
| `npm run test:smoke:http` (dev server) | **ok** — auth deny, demo allow, hospital lock, lead-only onboard, cross-site deny |

## Coverage

- Persist auth: demo lock, prod demo reject, API key, JWT scope / out-of-scope 403, admin provision, onboard rate limit, cross-origin reject
- Server license evaluation vs professional modules
- Doctor mapper round-trip + chart `client_key` preference
- Live DB write/update/delete for specialty charts
- HTTP API: unauthenticated 401; demo forces Oak Haven hospital id even when client sends another; `provision:true` without admin does **not** create hospital

## How to re-run

```bash
npm test
npm run test:smoke          # needs .env.local with service role
npm run dev                 # terminal A
npm run test:smoke:http     # terminal B
```
