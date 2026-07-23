# Verification evidence — 2026-07-22 (items 1–5)

Do not treat this file as “all green / done.” It records raw outcomes.

---

## 1. Stripe webhook — accept + reject with response bodies

**Endpoint used:** `http://127.0.0.1:8787/api/billing/webhook`  
**Staging Cloudflare Worker:** not available (`wrangler` unauthenticated; no staging URL in repo). Local Worker + Stripe CLI sandbox used instead.

**Forward path:** `stripe listen` → evidence proxy `:8798` → Vite `:8787`  
**Proxy log:** `docs/evidence/stripe-proxy-evidence.jsonl`

### 1a. Correct secret — ACCEPTED

Stripe CLI:
```
--> customer.subscription.updated [evt_1TvkfIPCjzLqIkUKVAFX8zJC]
<--  [200] POST http://127.0.0.1:8798/
```

Proxy-captured response body:
```json
{"ok":true,"hospitalId":"a0000001-0001-4001-8001-000000000001","status":"active","event":"customer.subscription.updated"}
```

Request prefix:
```
{"id": "evt_1TvkfIPCjzLqIkUKVAFX8zJC", "object": "event", ... "id": "sub_1TvkfEPCjzLqIkUKXzAEqIWx"}
```

### 1b. Corrupted `STRIPE_WEBHOOK_SECRET` — REJECTED

Server env forced to `whsec_REDACTED` while CLI still signed with real listen secret.

Stripe CLI:
```
--> customer.subscription.updated [evt_1Tvkh1PCjzLqIkUK60E7fKqn]
<--  [400] POST http://127.0.0.1:8798/
```

Proxy-captured response body:
```json
{"error":"Signature mismatch"}
```

Hand-check (same server):
```
signed_with_CORRECT 400 {"error":"Signature mismatch"}
signed_with_CORRUPT 200 {"ok":true,...}   # proves server was using corrupt secret
```

---

## 2. RLS exposure history (`audit_logs`)

**Project:** `wsnpwyqypgclsclktoyf` (`health_ally_pro`)  
**Window:** earliest `audit_logs.created_at` **2026-07-21 20:20:07+00** → fix migration applied as remote name `tighten_hospital_rls_cross_tenant` version **20260721203805** (~2026-07-21 20:38 UTC).  
**Foundation RLS live since:** migration `hospital_saas_foundation` **20260622164948**.

### Reads on `patients`

```sql
SELECT COUNT(*) FROM audit_logs
WHERE resource = 'patients' OR entity_type ILIKE '%patient%';
-- result: 0
```

**Cross-hospital patient reads in audit_logs: 0**  
Hospitals/patients involved: **none** (no matching rows).

### Access on `audit_logs` (export)

All pre-fix rows with `resource = 'audit_logs'`:

| created_at | action | actor_id | actor_email | audit hospital_id | actor membership hospitals |
|------------|--------|----------|------------|-------------------|----------------------------|
| 2026-07-21 20:20:08+ | export | null | demo | a000…0001 (Oak) | null (no actor_id) |
| 2026-07-21 20:20:08+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:20:08+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:21:51+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:21:51+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:21:51+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:23:16+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:23:16+ | export | null | demo | a000…0001 | null |
| 2026-07-21 20:23:17+ | export | null | demo | a000…0001 | null |

**Mismatch flags (actor hospital ≠ audit hospital):** **0** (actor_id always null; only one hospital id appears: Oak Haven `a0000001-0001-4001-8001-000000000001`).

**DB state in window:** 1 hospital (Oak Haven), 1 patient (Clara seed).  
**Limitation (raw fact):** `audit_logs` does not record PostgREST `SELECT`s; only app-written audit events. Silent RLS-evaluated reads would not appear here.

---

## 3. All 22 `hospital_id` tables — policy scope

Live `pg_policies` after tighten migrations (including `tighten_onboarding_insert_scope`):

| table | policy | scoped |
|-------|--------|--------|
| anatomy_markers | anatomy_markers_manage | Y |
| anatomy_markers | anatomy_markers_select | Y |
| appointments | appointments_* | Y |
| audit_logs | audit_insert / audit_select | Y |
| branches | branches_* | Y |
| encounters | encounters_* | Y |
| hospital_desk_records | desk_records_* | Y |
| hospital_doctors | hospital_doctors_* | Y |
| hospital_memberships | memberships_* | Y |
| hospital_onboarding_leads | onboarding_insert_staff | Y (fixed this round: hospital_id NULL OR in get_user_hospital_ids) |
| hospital_onboarding_leads | onboarding_select/update | Y |
| hospital_subscriptions | subscriptions_* | Y |
| hospital_unit_records | unit_records_* | Y |
| invoices | invoices_* | Y |
| lab_orders / lab_results | *_* | Y |
| notifications | insert Y; select/update SELF | SELF |
| patient_medications | *_* | Y |
| patients | patients_* | Y |
| payments | payments_* | Y |
| prescriptions | *_* | Y |
| queue_entries | *_* | Y |
| specialty_chart_notes | specialty_charts_* | Y |
| staff_profiles | staff_* | Y |

**Unscoped (N) remaining on these 22:** none after `20260722050000_tighten_onboarding_insert_scope`.  
**Vitest:** `src/server/rls-policy-inventory.test.ts` asserts inventory has no `N` and covers all `HOSPITAL_SCOPED_TABLES`.  
**Cross-tenant negatives:** `scripts/dual-tenant-rls-check.mjs` (per desk) + `scripts/rls-cross-tenant-probe.sql`.

---

## 4. Migration environment (production project)

Supabase org projects: Mettl-Clone (inactive), ULearn (inactive), groweasy-importer, **health_ally_pro**.  
Only Medora DB: **`wsnpwyqypgclsclktoyf` / `health_ally_pro`**.  
`.env.local` `SUPABASE_URL` = `https://wsnpwyqypgclsclktoyf.supabase.co`.  
No separate staging Supabase project for Medora.

**Raw `supabase_migrations.schema_migrations` (this project):**

| version | name |
|---------|------|
| 20260622164948 | hospital_saas_foundation |
| 20260622170717 | demo_seed_data_v3 |
| 20260625185505 | diet_clinical_supabase |
| 20260721184402 | specialty_hospital_persistence |
| 20260721184549 | chart_unit_client_keys |
| 20260721185808 | tighten_onboarding_rls |
| 20260721192832 | phi_audit_export_columns |
| 20260721202356 | hospital_desk_records |
| **20260721203805** | **tighten_hospital_rls_cross_tenant** |
| 20260721204213 | tighten_remaining_unscoped_rls |
| (applied) | tighten_onboarding_insert_scope |

Note: MCP `apply_migration` timestamps versions as `20260721203805`, not the local filename `20260722030000_*`. Same SQL content; name match is `tighten_hospital_rls_cross_tenant`.

Project metadata: name=`health_ally_pro`, status=`ACTIVE_HEALTHY`, region=`ap-south-1`, created=`2026-04-27`.

---

## 5. Dual-tenant check (checklist desks)

**Blocked as written:** no staging Worker URL; no second staging Supabase.  
**Executed instead:** two JWT sessions (Oak doctor vs Hospital B doctor+admin) against `health_ally_pro` + local `:8787`, planting `TENANT-B-PROBE-*` rows.

Raw output: `docs/evidence/dual-tenant-desks.json`

| desk | pass | oak_sees_B | B_sees_own | B_sees_Oak |
|------|------|------------|------------|------------|
| patients | pass | 0 | 1 | 0 |
| specialty_charts | pass | 0 | 1 | 0 |
| reception | pass | 0 | 1 | 0 |
| lab | pass | 0 | 1 | 0 |
| pharmacy | pass | 0 | 1 | 0 |
| units | pass | 0 | 1 | 0 |
| anatomy_markers | pass | 0 | 1 | 0 |
| audit_logs | pass | 0 | 1 | 0 |
| persist API foreign hospitalId | pass | status **403** `{"error":"Hospital out of scope"}` | | |

**Not executed:** two interactive browser GUIs on a deployed staging hostname (no hostname). JWT dual-session is the evidence available in this environment.
