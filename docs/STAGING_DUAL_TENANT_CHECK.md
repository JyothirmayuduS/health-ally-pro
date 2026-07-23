# Staging dual-tenant sanity check (manual, ~5 min)
#
# Automated suites can use service_role (bypasses RLS) or mocks. This checklist
# is the last line of defense before claiming cross-tenant isolation.

## Prerequisites
- Staging Cloudflare Worker deployed (`wrangler deploy` to staging env)
- Staging Supabase project with migration `20260722030000_tighten_hospital_rls_cross_tenant` applied
- Two real hospital accounts (Hospital A + Hospital B), each with staff login
- Two browser profiles / incognito windows (no shared sessionStorage)

## Steps
1. Log in as Hospital A staff (window 1). Open specialty desk / patients / appointments.
2. Log in as Hospital B staff (window 2). Create a unique patient MRN or chart note text (e.g. `TENANT-B-PROBE-…`).
3. In window 1, search/list patients, charts, desk records, audit CSV — confirm Hospital B probe text never appears.
4. Repeat swapped: create a unique record in A; confirm B cannot see it.
5. Optional API: call `/api/hospital/persist` with Hospital B `hospitalId` while authenticated as A — expect 403.
6. Stripe (if billing enabled on staging):
   ```bash
   stripe listen --forward-to https://<staging-worker>/api/billing/webhook
   stripe trigger customer.subscription.updated
   ```
   Confirm 200 and `hospital_subscriptions` row updates (signature must accept Stripe CLI `whsec_`).

## Pass criteria
- Zero cross-tenant rows in UI for every desk that shows PHI
- Persist API 403 on foreign hospitalId
- Stripe CLI signed events accepted (not only unit-test HMAC)

## Related automation
- `gitleaks detect --source . --log-opts="--all"` + `trufflehog git file://. --only-verified`
- `scripts/rls-cross-tenant-probe.sql` (SET ROLE authenticated + JWT claims)
- `npm test` (auth-layer + Stripe whsec_ decode + table inventory)
