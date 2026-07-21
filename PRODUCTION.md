# Medora — Production readiness

## Pre-deploy checklist

1. Copy `.env.example` → `.env.local` (and Cloudflare secrets for server keys).
2. Set real `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
3. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as **server-only** secrets (never `VITE_`).
4. Set `MEDORA_AI_API_KEY` for trusted server/native clients. Production persist requires JWT or this key — demo header (`x-medora-persist-demo`) is off unless `ALLOW_DEMO_PERSIST=true`.
5. Prefer `MEDORA_LICENSE_KEY` (server) in addition to `VITE_MEDORA_LICENSE_KEY` (watermark).
6. Production client flags:
   - `VITE_APP_ENV=production`
   - `VITE_ALLOW_DEMO_AUTH=false` (blocks `*@oakhaven.demo` logins)
   - `VITE_ALLOW_CLIENT_MOCKS=false` (prefer live Supabase)
   - `VITE_MEDORA_LICENSE_KEY=<issued-key>` (removes evaluation watermark)
   - `VITE_MEDORA_PLAN=professional`
   - `VITE_HOSPITAL_DISPLAY_NAME=<hospital>`
7. AI / PHI: keep `MEDORA_AI_PHI_REDACTION=true`, `MEDORA_AI_ALLOW_CLOUD_PHI=false` unless BAA-covered.
8. Run `npm run typecheck` and `npm run build`.
9. Deploy Workers: `npm run deploy` (Wrangler app name: `medora-health-ally`).

Commercial packaging: [SELLING_READY.md](SELLING_READY.md) · [SECURITY.md](SECURITY.md) · [LICENSE](LICENSE)

## Specialty doctor desks + 3D anatomy

- Admin assigns a doctor specialty → `/doctor/specialty` loads that specialty’s charting modules.
- Each specialty has a dedicated **3D anatomy** tab (camera focus, system preset, structure highlights) on the same body atlas (`public/anatomy/body-atlas.glb`).
- Examples: Eye → orbit zoom; Heart → vascular preset; Bones → skeleton; Neuro → nerves.

## Known demo vs production boundaries

| Area | Demo today | Production status |
|------|------------|-------------------|
| Public website | Buyer home `/` | Done — patient app at `/app` |
| Auth | Demo credentials (gated) | Supabase Auth + staff memberships |
| Specialty charts | Dual-write + auth | Done |
| Module entitlements | Plan maps | Enforced on persist API |
| Billing | Sales mailto + Stripe scaffold | Set `STRIPE_*` for self-serve Checkout |
| Onboarding | Lead + thank-you | Sales activates license |

## Security notes

- Do not ship `VITE_ALLOW_DEMO_AUTH=true` to public production.
- Service role key must remain server-side only.
- Clinical PHI in browser storage is for demos — migrate before go-live.
