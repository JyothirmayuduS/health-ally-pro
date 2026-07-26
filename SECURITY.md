# Medora — Security overview (procurement)

**Audience:** Hospital IT / information security reviewers  
**Product:** Medora multi-specialty hospital OS  
**Last updated:** 21 July 2026

## Architecture (target production)

- Web app: TanStack Start on Cloudflare Workers  
- Data: Supabase Postgres with Row Level Security (tenant = hospital)  
- Auth: Supabase Auth (email) — demo logins disabled in licensed production  
- Optional AI: PHI redaction + BAA flags (`MEDORA_AI_*`)

## Controls today

| Control | Status |
|---------|--------|
| TLS in transit | Yes (hosting) |
| Role-based portals | Yes (RBAC helpers) |
| Demo auth kill-switch | Yes (`VITE_ALLOW_DEMO_AUTH`) |
| Evaluation watermark | Yes (unlicensed builds) |
| Commercial license key | Client watermark (`VITE_*`) + server (`MEDORA_LICENSE_KEY`) |
| Hospital persist API auth | Yes — JWT membership / API key / gated demo (`hospital-persist-auth`) |
| Onboarding abuse controls | Rate limit + lead-only; no open tenant provision |
| AI PHI redaction | Yes (server) |
| Audit log (AI) | Yes when configured |
| Clinical specialty data in Postgres + RLS | Yes — dual-write via `/api/hospital/persist` |
| Customer BAA | Template via sales (not auto-signed in product) |

Latest CSO pass: [docs/CSO_AUDIT_2026-07-22.md](docs/CSO_AUDIT_2026-07-22.md)

## Customer responsibilities

- Remain controller of PHI  
- Configure SSO / password policy as required by policy  
- Do not enable `VITE_ALLOW_DEMO_AUTH` on live patient systems  
- Complete DPA/BAA before processing real PHI with vendor subprocessors  

## Reporting

Security issues: security@medora.health (replace with your mailbox)
