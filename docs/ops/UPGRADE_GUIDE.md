# Upgrade Guide

1. Read `docs/release/RELEASE_NOTES_*.md` and migration notes.
2. Apply pending Supabase migrations; verify with migration history list.
3. Build immutable image/Worker version (`GIT_COMMIT`, `BUILD_VERSION`).
4. Deploy to staging → run post-deploy checklist.
5. Promote to production with approval gate.

Do not skip DLQ/audit verification after upgrades that touch PHI paths.
