# Tier 3 — SSR demo gates + brand + PHI cache evidence

Generated: 2026-07-22

## Item 8 — SSR demo-session gates

### Portal `beforeLoad` inventory (`src/routes`)

| Route file | Gate | SSR skip (`typeof window === "undefined"`) |
|---|---|---|
| `lab.tsx` | `requirePortalAccess("lab")` | **yes** |
| `pharmacy.tsx` | `requirePortalAccess("pharmacy")` | **yes** |
| `billing.tsx` | `requirePortalAccess("billing")` | **yes** |
| `nursing.tsx` | `requirePortalAccess("nursing")` | **yes** |
| `admin.tsx` | `requirePortalAccess("admin")` | **yes** |
| Nested lab (`lab.collection`, `lab.processing`, `lab.orders`, `lab.validation`, `lab.reports`, `lab.walk-in`, `lab.team`, `lab.settings`, `lab.my-submissions`) | `requireLabTechnician` / `requireLabSupervisor` | **yes** (inside `src/lib/lab-desk/roles.ts`) |

Doctor and reception layouts do **not** use `requirePortalAccess` in route `beforeLoad` (client shell / other auth paths).

### Walkthrough proof (Playwright against `http://127.0.0.1:8787`)

See `docs/evidence/tier3/brand-and-ssr-walkthrough.json`:

- `/lab`, `/pharmacy`, `/billing`, `/nursing`, `/lab/collection` — **not** bounced to `/login`
- Screenshots: `brand-lab.png`, `brand-pharmacy.png`, `brand-billing.png`, `brand-nursing.png`, `lab-collection-ssr.png`

## Item 9 — Brand: Oak Haven vs Maple

Canonical demo brand: **Oak Haven Medical** (matches `@oakhaven.demo` emails + admin desk).

Remaining `Maple Hospital` / `MAPLE ·` strings in `src/` were removed this round:

- `src/lib/doctor-prescription-format.ts` → Oak Haven Medical
- `src/lib/lab-desk/analytics.ts` → OAK HAVEN MEDICAL · SPECIMEN
- `src/components/lab-desk/ShiftReportModal.tsx` → OAK HAVEN MEDICAL LABORATORY

Left intentionally: street address `"55 Maple Ave, Austin"` in reception mock demographics (not hospital brand).

### Screenshot proof

- Admin: `docs/evidence/tier3/brand-admin.png` — sidebar **Oak Haven Medical**
- Lab: `docs/evidence/tier3/brand-lab.png` — **Oak Haven Medical** + **OAK HAVEN · LABORATORY**
- Pharmacy / billing / nursing: same walkthrough JSON (`hasMaple: false`, `hasOakHaven: true`)

## Item 10 — PHI Worker latency (auth cache attempt)

### Change

`src/server/phi-reads.ts` — 20s in-memory cache of `authorizePhiRead` results keyed by FNV token fingerprint + requested hospitalId (max 200 entries). Skips repeated `auth.getUser` + membership/patient lookups within TTL.

### Measured numbers (`docs/evidence/phi-worker-latency-profile-after-auth-cache.json`)

| Metric | ms |
|---|---|
| Worker burst (8 hits) | 850, 280, 786, 362, 849, 440, 256, **201** |
| Worker median | **441** |
| Worker min (best cached) | **202** |
| Direct Supabase service-role median | **236** |
| Ratio worker median / direct | **1.87×** |

Earlier baseline (pre-cache parallel auth): worker median **~353ms** vs direct **~113ms** (~3×) in `phi-worker-latency-profile-after-parallel.json`. Absolute times vary with Supabase RTT; the gap is still ~2× at median.

### Verdict — stop here

Short-lived membership/JWT memoization helps **best-case** (worker min ≈ direct), but **median is not meaningfully under ~1.5–2× direct** under local Vite/Workers + remote Supabase. Closing the rest needs larger work (edge JWT verify without Auth Admin round-trip, regional pooling, or co-locating DB). **Stopping per scope — no further chase.**
