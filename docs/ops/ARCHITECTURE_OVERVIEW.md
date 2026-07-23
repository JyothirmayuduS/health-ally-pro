# Architecture Overview

```text
[Browser]
   │
   ▼
[Cloudflare Worker / TanStack Start SSR]
   │  service_role for core PHI tables (PostgREST revoked for anon/authenticated)
   │  waitUntil → audit_logs (record-level)
   │  on audit fail → audit_write_failures (DLQ lifecycle)
   ▼
[Supabase Postgres + Auth + RLS]
```

**Docker path:** multi-stage image runs `vite preview` + workerd; secrets via compose `env_file` / process env bridge (`CLOUDFLARE_INCLUDE_PROCESS_ENV`); non-root `medora`; read-only rootfs + tmpfs.

**Invariants:** Worker-only PHI; tenant isolation; RLS; DLQ; no secrets in image layers.
