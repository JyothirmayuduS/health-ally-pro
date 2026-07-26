# Security incident log limitations (Medora / health_ally_pro)

Project: `wsnpwyqypgclsclktoyf` (`health_ally_pro`), region `ap-south-1`  
Org plan: **Free** — infra log retention **~24h** only.

---

## Architecture (corrected 2026-07-21; record-level restored 2026-07-23)

### Why RLS-embedded HTTP audit was removed

Round-1 load test showed sync `extensions.http` inside SELECT RLS cost **~+3.2s per 80-row query** (patients median 3345 ms vs baseline 142 ms). That is not shippable.

Additional hard constraints:

| Fact | Proof |
|------|--------|
| `service_role` **bypasses RLS** | 80-row service_role `patients` read → **0** new `phi_read_audit` rows (`docs/evidence/service-role-rls-bypass.json`). Worker path never hit `log_phi_row_read`. |
| Local `INSERT` in PostgREST GET also fails | `RO_INSERT_PROOF: cannot execute INSERT in a read-only transaction` — so an in-RLS queue table is **not** viable on the PostgREST SELECT path either. |

### What fires where now

| Path | Mechanism |
|------|-----------|
| Worker `/api/hospital/phi` — **core PHI tables** (`patients`, `appointments`, `lab_results`, `patient_medications`) | Service-role read + **async record-level** `writeRecordLevelPhiReadAudit` → `public.audit_logs` with `metadata.record_ids` (actual UUIDs returned). Scheduled **after** response body is prepared (`void`, non-blocking). Failures → `audit_write_failures` DLQ + `audit_write_failures_health()` alert. |
| Worker `/api/hospital/phi` — other clinical resources | Service-role read + request-level `writePhiAudit` (`count` / view metadata). |
| Worker `/api/hospital/persist` — **desk blobs** (`hospital_desk_records`) | Blob/request-level audit only (`action=read\|upsert`, `metadata={desk, count}`). **Accepted tradeoff — see below.** |
| Direct PostgREST on hospital_id tables | **Revoked** for `anon`/`authenticated` on core + Worker-only tables. No RLS-embedded HTTP logger remains (`policies_still_with_logger = 0`). |
| Deprecated | `private.log_phi_row_read` + HTTP ingest / DLQ path — disabled (`audit_http_mode=off`), no longer attached to policies (migration `20260722090000`). |

### Audit granularity by table (authoritative)

| Category | Tables | Audit grain |
|----------|--------|-------------|
| **Record-level (required)** | `patients`, `appointments`, `lab_results`, `patient_medications` | Each Worker read logs `metadata.record_ids[]` of rows actually returned + `actor_role` + `hospital_id` |
| **Request/blob-level (accepted)** | `hospital_desk_records` (keys such as `medora-pharmacy-desk-state-v1`, `medora-lab-desk-state-v1`, reception appointments/beds/admissions blobs) | Desk X was read/upserted; N desk-record rows — **not** per-prescription / per-lab-order / per-admission inside the JSON payload |
| **Request-level (other)** | `staff_profiles`, `queue_entries`, `encounters`, `invoices`, `payments`, `lab_orders`, `prescriptions`, `notifications`, `branches`, nursing/OT clinical tables, etc. | `count` / resource name on Worker audit |

### Accepted tradeoff: desk-blob tables (`hospital_desk_records`)

`hospital_desk_records` stores **operational desk state** as one JSONB blob per `(hospital_id, desk, record_key)` — e.g. the entire pharmacy dispense queue, lab bench state, or reception beds list in a single row.

**This is an accepted tradeoff, not a gap that needs fixing** for the following reasons:

1. **Not core clinical PHI identity rows.** Core patient chart entities (`patients`, `appointments`, `lab_results`, `patient_medications`) are first-class rows with stable UUIDs and are audited at record level on Worker reads.
2. **Blob semantics.** A single desk hydrate/save rewrites the whole payload; per-prescription “read” inside a blob is not a discrete DB SELECT — inventing per-entity audit would be synthetic and high-volume without matching PostgREST row access.
3. **Operational vs clinical.** Desk blobs are UI/workflow state (queues, FEFO picks, shift reports). Incident response for “who accessed patient X’s labs” uses the core PHI record-level path, not pharmacy desk JSON.

Evidence of blob/request-level only: `src/routes/api/hospital/persist.ts` (`resource=desk` / `upsert_desk`) → `writePhiAudit` with `{ desk, count }`.

---

## Load-test numbers (required proof)

### Round 1 (HTTP-in-RLS `active` — rejected)

| Table | Rows | Active median | Baseline `off` | Δ |
|-------|------|---------------|----------------|---|
| patients | 80 | 3345.6 ms | 141.95 ms | +3203.65 |
| appointments | 80 | 3396.34 ms | 460.82 ms | +2935.52 |
| lab_results | 80 | 3381.64 ms | 263.37 ms | +3118.27 |

### Post-fix (HTTP removed from RLS; plain predicates)

Evidence: `docs/evidence/phi-read-audit-load-test-post-fix.json`

| Table | Rows | Post-fix median | vs prior `off` | vs prior `active` |
|-------|------|-------------------|----------------|-------------------|
| patients | 80 | **113.01 ms** | −28.94 ms | **−3232.59 ms** |
| appointments | 80 | **119.41 ms** | −341.41 ms | **−3276.93 ms** |
| lab_results | 80 | **103.92 ms** | −159.45 ms | **−3277.72 ms** |

(Temporary SELECT grant used only for this apples-to-apples PostgREST timing; grants revoked afterward.)

### Async record-level Worker audit (2026-07-23)

Evidence: `docs/evidence/phi-record-level-audit-proof.json`, `docs/evidence/phi-record-level-concurrency-proof.json`, `docs/evidence/phi-record-level-dlq-proof.json`, `docs/evidence/phi-record-level-dlq-worker-force-fail.json`

| Table | Post-fix PostgREST median | Direct service_role median | Worker+async record-level median |
|-------|------------------------------|----------------------------|----------------------------------|
| patients | **113.01 ms** | **91.95 ms** | **131.29 ms** |
| appointments | **119.41 ms** | **101.35 ms** | **176.47 ms** |
| lab_results | **103.92 ms** | **97.09 ms** | **145.56 ms** |

vs Round-1 active (~3345 ms): Worker path remains **~20–25× faster**. Async audit does not reintroduce the +3.2s regression.

- Core PHI Worker reads log `metadata.record_ids` (not count-only); uses `waitUntil` so inserts complete after response.
- Concurrency: 8 parallel patients reads → 8 distinct audit rows, each with 81 matching `record_ids`.
- DLQ: `PHI_AUDIT_FORCE_FAIL=1` on Worker → clinical GET still **200** / 81 rows; failure in `audit_write_failures` with full `record_ids` payload; `audit_write_failures_health().alert === true`.
- **Forced-failure cleanup (required):** mark DLQ rows as `test_artifact` via `scripts/resolve-test-dlq-artifacts.mjs` or auto-cleanup at end of DLQ proof scripts. Do **not** delete rows. Lifecycle: `open` → `acknowledged` → `resolved` | `test_artifact`. `acknowledged` is **non-alerting**. Budgets: `docs/OPERATIONS_LATENCY_BUDGET.md`.
- **Remote migration applied (2026-07-23):** `audit_dlq_lifecycle_appointments_index` on project `wsnpwyqypgclsclktoyf` (history version `20260723132326`). Health `source` must be `database_rpc` when RPC succeeds. Evidence: `docs/evidence/infra-closure-post-migration.json`.

### Worker live HTTP (prior)

Evidence: `docs/evidence/worker-phi-live-http.json`, `docs/evidence/worker-phi-exactly-one-audit.json`

- `GET http://127.0.0.1:8787/api/hospital/phi?resource=patients` → **200**, `ok: true`
- Latency (to HTTP response): median **585.47 ms** (81 rows via service_role + auth)
- Audit: **one `audit_logs` row per request** (`exactly_one: true` for staff_profiles probe)

---

## Investigation checklist

1. **&lt; 24h:** infra `postgres`/`api` logs if needed (still no JWT↔row hospital join).
2. **Worker / app PHI reads (core tables):** `public.audit_logs` with `metadata.record_ids` (`action=read`, `resource=patients|appointments|lab_results|patient_medications`).
3. **Desk-blob / persist reads:** `audit_logs` with `resource=hospital_desk_records`, `metadata.desk` + `count` only.
4. **&gt; 24h:** infra gone — use `audit_logs` only; say so in the incident write-up.
5. Do **not** expect `private.phi_read_audit` for Worker traffic (service_role bypass + logger detached).

---

## Out of scope (unchanged)

| Item | Status |
|------|--------|
| Staging second project | Absent — needs explicit go-ahead (billing). |
| Log retention &gt; 24h | Free plan / ~24h — needs paid tier or drain. |
| BAA / SOC2 | Legal / third-party. |
| Per-entity audit inside `hospital_desk_records` JSON | **Accepted non-goal** (see tradeoff above). |
