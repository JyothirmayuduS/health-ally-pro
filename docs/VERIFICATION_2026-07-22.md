# Verification addendum — 2026-07-22 (honest close-out)

## Status: engineering verification closed for this environment — with explicit limits

| Check | Result |
|--------|--------|
| gitleaks / trufflehog | Clean (0 verified secrets) |
| Stripe CLI `listen` + `trigger customer.subscription.updated` | **200** on local Worker `http://127.0.0.1:8787/api/billing/webhook` |
| Dual-tenant (anon + JWT, two hospitals) | **Pass** — `scripts/dual-tenant-rls-check.mjs` |
| Deployed Cloudflare staging Worker | **Not available** — `wrangler` not authenticated; no staging URL to hit. Stripe + dual-tenant were run against **local Vite + the only Medora Supabase project** |
| Lawyer BAA / SOC2 | Still out of scope |

---

## 1. Was the RLS bug live with real hospital data?

**Project:** `wsnpwyqypgclsclktoyf` (`health_ally_pro`) — the **only** active Medora Supabase project in this org; `.env.local` points here. There is **no separate staging project**. Migrations `tighten_hospital_rls_cross_tenant` and `tighten_remaining_unscoped_rls` are applied on this project.

**Data present while the buggy policies were live (foundation migration 2026-06-22 → fix 2026-07-22):**

| Fact | Value |
|------|--------|
| Hospitals | **1** — Oakhaven Medical Group (demo seed) |
| Patients | **1** — Clara Whitfield (`clara.w@medora.health`, MRN-10042, DOB in seed) |
| Auth users | Seeded `*@oakhaven.demo` / `@medora.health` only |
| Paying / second tenant PHI | **None found** |

**Cross-tenant read requires a second hospital’s rows.** With a single hospital, the `is_staff()` hole could not leak *another hospital’s* patients in practice. The demo Clara row is still PHI-shaped seed data; treat it as **demo PHI**, not a multi-tenant production breach. If this project was ever used for a real second hospital (not present in DB now), that would change the assessment — current evidence does not show that.

**Not a production Cloudflare deployment check** — only this Supabase project + local Worker were verified.

---

## 2. Was it exploited?

**App `audit_logs` cannot prove/disprove silent PostgREST SELECTs.** They record intentional API audits (persist/export), not every RLS-evaluated read.

Findings:
- `resource = 'patients'` audit rows: **0**
- Distinct actors: `demo` (null `actor_id`) on Oak Haven only
- No second hospital existed historically (except transient RLS probe rows we planted and deleted)

**Conclusion:** No evidence of cross-tenant patient access in app audits. **Absence of evidence ≠ cryptographic proof of non-access** — Postgres does not log SELECTs by default. Given single-tenant demo data, exploitable foreign rows did not exist outside our probe.

---

## 3. Same bug elsewhere? (full policy audit)

Live `pg_policies` after both tighten migrations:

**Previously unscoped (fixed):** patients, appointments, queue, encounters, lab_*, prescriptions, patient_medications, invoices/payments, audit_select, memberships, staff_profiles (`USING (true)`), hospitals_manage, departments_manage, profiles staff-read-all, onboarding select/update.

**Remaining intentionally loose:**
| Policy | Why |
|--------|-----|
| `diet_meal_media_cache` SELECT `true` | Public recipe media cache — not tenant PHI |
| `onboarding_insert_staff` | INSERT before `hospital_id` exists — role-gated to hospital_admin/super_admin only |

Replay inventory: `scripts/rls-cross-tenant-probe.sql`, `scripts/dual-tenant-rls-check.mjs`.

---

## Stripe CLI note

First CLI attempt returned **400**: Stripe CLI sandbox secrets HMAC with **UTF-8 of the full `whsec_…` string**; Dashboard secrets use **base64(suffix)**. Verifier now accepts **both** candidates. Confirmed: CLI `customer.subscription.created` + `.updated` → **HTTP 200**.

---

## Dual-tenant how to re-run

```bash
node --env-file=.env.local scripts/dual-tenant-rls-check.mjs
# expects local app on :8787 for persist 403 check (optional)
```

Creates Hospital B + JWT sessions for Oak doctor vs B doctor; asserts 0 foreign `patients`; persist API returns 403 for foreign `hospitalId`; deletes Hospital B.
