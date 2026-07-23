# Medora — Subprocessors

Last updated: 2026-07-22

| Subprocessor | Purpose | Data categories | Region (typical) |
|--------------|---------|-----------------|------------------|
| Cloudflare, Inc. | Edge hosting, CDN, WAF, Turnstile (optional) | Request metadata, app content in transit | Global edge |
| Supabase (Postgres + Auth) | Primary application database & auth | PHI / clinical records, staff accounts | Project region (configure per tenant) |
| Stripe, Inc. (optional) | Subscription billing | Customer billing contacts, not clinical PHI | US / Stripe regions |
| AI model providers (optional, customer-enabled) | CDSS / assistive features under BAA flags | Prompts may include clinical context | Provider-dependent |

Hospital-controlled local storage may also hold evaluation drafts until remote sync.

Material additions require notice per the signed DPA/BAA.
