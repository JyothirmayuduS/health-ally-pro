# E2E Quarantine Register

Tests listed here are excluded from the blocking release suite until the expiry date.
After expiry they must be fixed or permanently deleted — do not extend without a new issue.

| Test | Owner | Issue | Expiry | Reason |
|------|-------|-------|--------|--------|
| `e2e/staff-phi-audit.spec.ts` — Staff specialty chart PHI audit | platform-eng | GH#e2e-phi-audit-fixtures | 2026-08-24 | Relies on live Supabase demo session + specialty persist fixtures that are not provisioned in every CI runner; marketing + clinical-smoke cover release gates |

Quarantine is enforced via `test.describe.configure({ mode: "skip" })` when `E2E_INCLUDE_QUARANTINE` is unset.
