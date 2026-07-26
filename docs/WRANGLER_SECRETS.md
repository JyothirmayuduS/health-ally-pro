# Cloudflare Workers secrets (Wrangler)

Server-side secrets must live in **Wrangler Secrets**, not in committed files or
`VITE_*` client env.

## Required production secrets

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put MEDORA_LICENSE_KEY
npx wrangler secret put MEDORA_AI_API_KEY
npx wrangler secret put MEDORA_PLAN
```

## Optional

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_PRICE_STARTER
npx wrangler secret put STRIPE_PRICE_PROFESSIONAL
npx wrangler secret put STRIPE_PRICE_ENTERPRISE
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put MEDORA_LEAD_WEBHOOK_URL
npx wrangler secret put MEDORA_LEAD_WEBHOOK_SECRET
npx wrangler secret put ALLOW_DEMO_PERSIST   # must be "false" in production
npx wrangler secret put VITE_ALLOW_DEMO_AUTH # must be "false" in production
npx wrangler secret put VITE_APP_ENV         # "production"
```

Webhook endpoint: `POST /api/billing/webhook` (HMAC via `Stripe-Signature`).

Signature verification matches stripe-node: if the secret starts with `whsec_`, the suffix is **base64-decoded** before HMAC-SHA256 (signing payload `t.rawBody`). Verify with Stripe CLI — do not rely only on unit tests:

```bash
stripe listen --forward-to localhost:8787/api/billing/webhook
stripe trigger customer.subscription.updated
```

## Local development

Copy `.dev.vars.example` → `.dev.vars` (gitignored). Never commit `.dev.vars` or `.env.local`.

Client-public vars for Vite builds can remain in the CI/CD build env as `VITE_*`
(anon key, display name) — never service role or Stripe secret as `VITE_*`.

## Rotation (2026-07-22)

- Demo staff passwords rotated (`Demo1234!` retired).
- If any real key was ever pasted into chat/logs, rotate in Supabase + Stripe + Wrangler.
