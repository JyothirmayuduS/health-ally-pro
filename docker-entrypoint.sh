#!/bin/sh
# Runtime bridge for Cloudflare vite preview / workerd.
# Prefer process-env inclusion over writing secrets to disk (.dev.vars on disk is avoided).
set -eu
cd /app

# Remove any stale .dev.vars so CF does not prefer an empty/stale file over process env
rm -f .dev.vars

# Refuse to enable forced-failure in production unless explicitly allowed for safe staging
case "${PHI_AUDIT_FORCE_FAIL-}" in
  1|true|TRUE)
    if [ "${NODE_ENV-}" = "production" ] && [ "${MEDORA_ALLOW_FORCE_FAIL-}" != "1" ]; then
      unset PHI_AUDIT_FORCE_FAIL || true
      export PHI_AUDIT_FORCE_FAIL=
    fi
    ;;
  *)
    export PHI_AUDIT_FORCE_FAIL=
    ;;
esac

# Make container process env visible to the Workers runtime during vite preview
export CLOUDFLARE_INCLUDE_PROCESS_ENV=true

# Writable scratch dirs (compose tmpfs under read-only root)
mkdir -p /tmp /app/tmp \
  /app/node_modules/.vite-temp \
  /app/.wrangler/state \
  /app/.wrangler/registry \
  /app/.wrangler/tmp 2>/dev/null || true

exec "$@"
