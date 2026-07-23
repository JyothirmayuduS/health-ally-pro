# Evidence — infra logs, patient data characterization, probe cleanup
# Project: health_ally_pro / wsnpwyqypgclsclktoyf
# Captured: 2026-07-22

---

## 1. Infra-level logs (PostgREST / Postgres)

### Retention (tool contract)

Supabase MCP `get_logs` description (verbatim constraint):
> "This will return logs within the last 24 hours."

CLI: `supabase logs` is **not available** on installed CLI 2.75.0 (`unknown command "logs"`).

### Observed window in returned batches

| service | earliest timestamp in batch | latest |
|---------|----------------------------|--------|
| api | 2026-07-21T20:20:07.255Z | 2026-07-21T20:56:24.654Z |
| postgres | 2026-07-21T18:40:12.328Z | 2026-07-21T20:56:26.130Z |

Unscoped `is_staff()` policies were live from foundation migration **20260622164948** (2026-06-22) until `tighten_hospital_rls_cross_tenant` **20260721203805** (~2026-07-21 20:38Z).

**Finding:** Available infra logs do **not** cover 2026-06-22 → 2026-07-21 ~18:40Z. Absence of older logs is **not** evidence of no exposure.

### What API logs contain vs what is needed for mismatch detection

API log fields present: `method`, `path`, `status_code`, `event_message` (URL), `timestamp`.  
**Not present:** JWT `sub`, role claims, or result-row `hospital_id` values.

Therefore: **cannot flag requesting-user hospital_id vs row hospital_id mismatches from these logs.**

### Raw API excerpts — `/rest/v1/patients` (within retained window)

```
GET  | 200 | .../rest/v1/patients?select=id%2Cmrn%2Chospital_id&hospital_id=eq.d0000001-0001-4001-8001-000000000099
GET  | 200 | .../rest/v1/patients?select=id&hospital_id=eq.a0000001-0001-4001-8001-000000000001
GET  | 200 | .../rest/v1/patients?select=id%2Cmrn&hospital_id=eq.a0000001-0001-4001-8001-000000000001
GET  | 200 | .../rest/v1/patients?select=id%2Cmrn&hospital_id=eq.d0000001-0001-4001-8001-000000000099
HEAD | 200 | .../rest/v1/patients?select=id&hospital_id=eq.d0000001-0001-4001-8001-000000000099  (×2)
HEAD | 200 | .../rest/v1/patients?select=id&hospital_id=eq.a0000001-0001-4001-8001-000000000001
```

These calls are from the dual-tenant probe (2026-07-21 ~20:49–20:56Z), after the tighten migration. Query strings already filter `hospital_id=eq.<uuid>`; JWT claims are not in the log line.

### Postgres logs

100 events returned. Content is primarily checkpoints and migration DDL (`DROP POLICY` / `CREATE POLICY` statements), not per-row `SELECT` with JWT.  
Patient/SELECT/JWT substantive hits in sample: **6**, all migration DDL mentioning prior unscoped policies — not data reads.

### Mismatch tally from infra logs

| metric | value |
|--------|--------|
| How far back logs go | ~24h tool limit; observed ~2026-07-21 18:40Z (postgres) / 20:20Z (api) |
| Total patients table HTTP reads in retained API batch | 7 (GET/HEAD listed above) |
| Cross-hospital mismatches detectable from logs | **not computable** (no JWT / no row hospital_id in log payload) |
| Hospitals/patient IDs in mismatches | **n/a — none flagged; detection impossible with available fields** |
| Coverage of unscoped-policy era (2026-06-22 → fix) | **not covered** by retained infra logs |

---

## 2. Patient / clinical data characterization

### Hospitals

```
id: a0000001-0001-4001-8001-000000000001
name: Oakhaven Medical Group
slug: oakhaven-medical
```
(only hospital remaining)

### Row counts by hospital_id

```
patients               a000…0001  n=1
appointments           a000…0001  n=3
lab_results            a000…0001  n=5
patient_medications    a000…0001  n=5
queue_entries          a000…0001  n=1
specialty_chart_notes  a000…0001  n=6
```
(no other hospital_id present in these tables)

### Sample `patients` row (full)

```
id:           c0000001-0001-4001-8001-000000000001
hospital_id:  a0000001-0001-4001-8001-000000000001
mrn:          MRN-10042
date_of_birth: 1991-03-15
profile_id:   b0000001-0001-4001-8001-000000000001
created_at:   2026-06-22 17:07:17.642717+00
```

Linked profile (seed): `clara.w@medora.health` / full_name `Clara Whitfield`  
Matches migration seed `supabase/migrations/20260622000002_demo_seed_data.sql`:
```
seed_demo_user(..., 'clara.w@medora.health', ..., 'Clara Whitfield', 'patient', 'a000…0001');
... MRN-10042, '1991-03-15'
```

### Auth users domain pattern

All seed staff: `*@oakhaven.demo` / `clara.w@medora.health` (demo seed file).  
No non-demo hospital slug/name present.

### Sample specialty_chart_notes.patient_name

```
Seed Patient | HTTP Smoke Kid | E2E Audit Patient
```

### Sample patient_medications (ids match diet seed migration)

```
d000…0001 Levothyroxine 50mcg
d000…0002 Vitamin D3 …
```

### Hospitals with non-demo data

**Query result:** no second hospital.  
Only Oak Haven; patient row matches demo seed script IDs/MRN/DOB/email; `created_at` = seed date **2026-06-22**. Chart names are test labels (`Seed Patient`, `HTTP Smoke Kid`, `E2E Audit Patient`).

(Findings only — no classification of “go-live vs PHI incident.”)

---

## 3. Probe artifact cleanup

### Before cleanup (remaining after hospital B CASCADE delete)

```
specialty_chart_notes TENANT-B-PROBE: 0
hospital_desk_records TENANT-B-PROBE: 0
hospital_unit_records TENANT-B-PROBE: 0
anatomy_markers TENANT-B-PROBE: 0
patients DUAL/PROBE MRN: 0
hospitals dual-tenant/rls-probe: 0
audit_logs probe actions: 2
  - id f3a916f2-… action=rls_probe hospital_id=null (orphan after CASCADE SET NULL)
  - id ffed2ebc-… action=dual_tenant_probe metadata={"probe":"TENANT-B-PROBE-mrv4vi2y"} hospital_id=null
auth.users doctor@dual-b.demo: 1 (id a6d31ad3-c37c-4c35-b3ad-feb560d21042)
```

### Deleted

| target | count |
|--------|------:|
| audit_logs `rls_probe` | 1 |
| audit_logs `dual_tenant_probe` | 1 |
| auth.users `doctor@dual-b.demo` (+ profile/memberships) | 1 user |

Hospital B `d0000001-0001-4001-8001-000000000099` was already deleted earlier (CASCADE); desk/chart/patient B rows were already gone before this cleanup.

### Final confirmation query

```
auth_dual_b_remaining   0
probe_audit_remaining   0
hospitals_non_oak       0
patients_probe          0
charts_probe            0
desk_probe              0
units_probe             0
markers_probe           0
```
