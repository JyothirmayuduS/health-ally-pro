# Medora — Production readiness

## Pre-deploy checklist

1. Copy `.env.example` → `.env.local` for **local Vite only**. Copy `.dev.vars.example` → `.dev.vars` for Workers.
2. Put **server secrets in Wrangler** ([docs/WRANGLER_SECRETS.md](docs/WRANGLER_SECRETS.md)) — never commit `.env.local` / `.dev.vars`.
3. Set real `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (build-time client).
4. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as **Wrangler secrets** (never `VITE_`).
5. Set `MEDORA_AI_API_KEY` via Wrangler. Production persist requires JWT or this key — demo header is off unless `ALLOW_DEMO_PERSIST=true` (boot refuses that in production).
6. Prefer `MEDORA_LICENSE_KEY` (Wrangler) in addition to `VITE_MEDORA_LICENSE_KEY` (watermark).
7. Production client/server flags (boot fails if violated):
   - `VITE_APP_ENV=production`
   - `VITE_ALLOW_DEMO_AUTH=false`
   - `ALLOW_DEMO_PERSIST=false`
   - `VITE_ALLOW_CLIENT_MOCKS=false`
   - `VITE_MEDORA_LICENSE_KEY` / `MEDORA_LICENSE_KEY` ≥ 16 chars (removes evaluation watermark)
   - `VITE_MEDORA_PLAN=professional` (or enterprise)
   - `VITE_HOSPITAL_DISPLAY_NAME=<hospital>`
8. AI / PHI: keep `MEDORA_AI_PHI_REDACTION=true`, `MEDORA_AI_ALLOW_CLOUD_PHI=false` unless BAA-covered.
9. Run `npm test && npm run test:smoke && npm run test:e2e` then `npm run build`.
10. Deploy Workers: `npm run deploy`.

Commercial packaging: [SELLING_READY.md](SELLING_READY.md) · [SECURITY.md](SECURITY.md) · [LICENSE](LICENSE)

**Out of scope for engineering:** lawyer-countersigned BAA; SOC2/ISO attestation.

## Specialty doctor desks + 3D anatomy

- Admin assigns a doctor specialty → `/doctor/specialty` loads that specialty’s charting modules.
- Each specialty has a dedicated **3D anatomy** tab on the body atlas (`public/anatomy/body-atlas.glb`).

## Known demo vs production boundaries

| Area | Demo today | Production status |
|------|------------|-------------------|
| Public website | Buyer home `/` | Done — patient app at `/app` |
| Auth | Demo credentials (gated + rotated; killed in prod builds) | Supabase Auth + staff memberships |
| Boot guard | N/A | Refuses prod if demo auth on or license missing |
| Specialty charts | Dual-write + auth | Done |
| Module entitlements | Plan maps | Enforced on persist API |
| Billing | Sales mailto + Stripe checkout/portal/webhooks | Set `STRIPE_*` Wrangler secrets |
| Onboarding | Lead + thank-you | Sales activates license |

## Security notes

- Do not ship `VITE_ALLOW_DEMO_AUTH=true` to public production — server returns 503.
- Service role key must remain server-side / Wrangler only.
- Clinical PHI in browser storage is for demos — licensed tenants sync via Supabase.
