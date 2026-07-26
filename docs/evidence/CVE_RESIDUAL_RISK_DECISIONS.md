# Residual Critical / High CVE risk decisions (medora-app slim bookworm image)

Source scan: `docs/evidence/trivy-scan-after-slim.json` (Critical 5, High 19, Fixable 0).

## Critical

| CVE | Package | Installed | Exploitability in this image | Network exposure | Privilege | Upstream | Disposition | Rationale |
|-----|---------|-----------|------------------------------|------------------|-----------|----------|-------------|-----------|
| CVE-2026-13221 | perl-base | 5.36.0-7+deb12u3 | Low — perl interpreter present as Debian dependency; app entrypoint is Node/`vite preview`/`workerd`, not perl CGI | No perl service listens | local user `medora` (non-root) | Unfixed in Debian bookworm at scan time | **waiting upstream** (temp accept with controls) | Not in request path; no setuid perl helpers exposed; remove-perl blocked by base image deps; distroless/Chainguard blocked by workerd glibc + wrangler needs |
| CVE-2026-42496 | perl-base | same | Low | None | non-root | Unfixed | **waiting upstream** | Same compensating controls as above |
| CVE-2026-57433 | perl-base | same | Low | None | non-root | Unfixed | **waiting upstream** | Same |
| CVE-2026-8376 | perl-base | same | Low | None | non-root | Unfixed | **waiting upstream** | Same |
| CVE-2023-45853 | zlib1g | 1:1.2.13.dfsg-1 | Low–Medium historically for minizip path in zlib contrib; system zlib used by native libs (wget/openssl clients) — classic zip-bomb/path issues require attacker-controlled zip parsing | App does not expose zip upload decompress via zlib minizip API | non-root | Unfixed on bookworm package | **mitigated** | No user-facing zip inflate via vulnerable minizip; container read-only + non-root + no new privileges; tracked for base refresh |

## High (summary dispositions)

| CVE(s) | Package(s) | Disposition | Rationale |
|--------|------------|-------------|-----------|
| CVE-2026-53615 | util-linux / mount / lib*uuid/blkid/mount/smartcols / bsdutils | waiting upstream | Host tooling in container; not exposed as network service; non-root + cap_drop ALL |
| CVE-2026-41992 | gzip | waiting upstream | Local compression tool; not a listening service |
| CVE-2026-54369 | libacl1 | waiting upstream | Library only; no ACL admin network surface |
| CVE-2025-69720 | libtinfo6 / ncurses-* | waiting upstream | Terminal libs; unused in headless server path |
| CVE-2026-42497, CVE-2026-48962, CVE-2026-57432, CVE-2026-9538 | perl-base | waiting upstream | Same as Critical perl set |
| CVE-2026-58471, CVE-2026-58472 | wget | mitigated | wget used only for localhost healthcheck by HEALTHCHECK; not for untrusted URL fetch |

## Base-image alternatives tested / constrained

- Newer Debian slim: still carries unfixed perl/zlib until Debian publishes fixes.
- Distroless / Chainguard / Wolfi: not adopted — Cloudflare `workerd` + `vite preview` require glibc Node tooling currently proven only on bookworm-slim digest-pinned image; regressions would require full security+clinical matrix.

## Release decision

Critical findings are **not** silent “unfixed = ignore”. They are formally **waiting upstream** / **mitigated** with compensating controls (non-root, read-only rootfs, cap_drop ALL, no-new-privileges, metrics auth, PHI Worker-only). They remain a residual risk for **Enterprise Ready** until base image refresh removes them or a compatible hardened base is validated.
