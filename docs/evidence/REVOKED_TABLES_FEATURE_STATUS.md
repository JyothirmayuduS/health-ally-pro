# docs/evidence/REVOKED_TABLES_FEATURE_STATUS.md
# Status of 7 tables revoked from anon/authenticated PostgREST

Honest mapping (codebase grep + route inventory). None of these power a
Postgres-backed UI today.

| Table | Working UI on this Postgres table? | What exists instead | Post-revoke impact |
|-------|------------------------------------|---------------------|--------------------|
| `branches` | **No** | Admin `/admin/branches` uses localStorage `medora-admin-branches-v1` (`src/lib/admin-desk/config.ts`). Server inserts one "Main campus" row on hospital provision only (`hospital-persistence.ts`). | Admin UI still works (mock). Provision still uses service_role. |
| `encounters` | **No** | Doctor/billing encounter UIs use `medora-encounters-v1` local store (`src/lib/shared/encounters.ts`). | UI still works (mock). Not broken by revoke. |
| `invoices` | **No** | Billing/reception invoice UIs use `medora-billing-ledger-invoices-v1` (`billing-ledger.ts`). Stripe APIs are SaaS subscription, not this table. | UI still works (mock). |
| `lab_orders` | **No** | Lab desk uses in-memory/`SEED_ORDERS` + sessionStorage bridge (`lab-desk/store.tsx`, `order-bridge.ts`). | UI still works (mock). |
| `notifications` | **No** | Patient/doctor notification UIs use local stores (`patient-notifications-store.ts`, `doctor-profile-store.ts`). | UI still works (mock). |
| `payments` | **No** | Billing payments UI uses local ledger payments key. | UI still works (mock). |
| `prescriptions` | **No** | Doctor/pharmacy/patient Rx UIs use local stores + bridges; `/api/ai/prescription` is AI text, not this table. | UI still works (mock). |

**Verdict per table:** UI exists but is **mock/local-only — never hit this Postgres table**. Revoke did not silently break a live DB-backed feature. Honest status is **not secured-by-Worker**; it is **schema reserved / feature not built on Postgres yet**.
