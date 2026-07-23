# Digest-pinned Node 22 bookworm-slim (glibc — required for Cloudflare workerd).
ARG NODE_DIGEST=sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3

# ---------- deps (prod-only, cached) ----------
# npm ci --omit=dev installs only "dependencies" (vite/wrangler/@cloudflare/*/miniflare/workerd
# are true runtime deps here because `vite preview` boots the Workers runtime for SSR).
# `npm run build` does not require any devDependency (typecheck/lint/test tooling), so we never
# need to install, then prune, a separate dev tree — this avoids the extra ~120MB of devDeps
# ever touching a layer.
FROM node:22-bookworm-slim@${NODE_DIGEST} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN npm run build

# ---------- production runtime ----------
FROM node:22-bookworm-slim@${NODE_DIGEST} AS production
ARG GIT_COMMIT=unknown
ARG BUILD_VERSION=unknown
ARG BUILT_AT=unknown
ARG BUILD_DIRTY=false
ARG BUILD_ENVIRONMENT=docker

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    MEDORA_GIT_COMMIT=${GIT_COMMIT} \
    MEDORA_BUILD_VERSION=${BUILD_VERSION} \
    MEDORA_BUILT_AT=${BUILT_AT} \
    MEDORA_BUILD_DIRTY=${BUILD_DIRTY} \
    MEDORA_BUILD_ENVIRONMENT=${BUILD_ENVIRONMENT} \
    PHI_AUDIT_FORCE_FAIL= \
    CLOUDFLARE_INCLUDE_PROCESS_ENV=true

# tini for PID 1 signal handling; wget for healthcheck; non-root user
RUN groupadd -r medora && useradd -r -g medora -d /app -s /usr/sbin/nologin medora \
  && apt-get update && apt-get install -y --no-install-recommends \
       ca-certificates wget tini \
  && rm -rf /var/lib/apt/lists/*

# The base image's bundled npm CLI (used only to `npx vite preview` at runtime) ships its own
# vendored tar/sigstore/picomatch/brace-expansion/ip-address versions with known CVEs. Upgrading
# npm itself (not our app's dependency tree, which stays pinned to package-lock.json) resolves
# those without touching application behavior.
RUN npm install -g npm@latest && npm cache clean --force

# Production node_modules only (vite/wrangler are runtime deps for preview/workerd).
# --chown at COPY time (instead of a later `RUN chown -R`) avoids overlayfs copy-up
# duplicating the entire tree into a new layer, which previously ~doubled image size.
# `src/` IS required at runtime: `vite preview` re-resolves the TanStack Start plugin
# config on boot, which reads the file-based router entry straight from src/ (confirmed by
# smoke-testing — omitting src/ makes `vite preview` fail with
# "Could not resolve entry for router entry: router in /app/src").
COPY --from=build --chown=medora:medora /app/package.json /app/package-lock.json ./
COPY --from=build --chown=medora:medora /app/node_modules ./node_modules
COPY --from=build --chown=medora:medora /app/dist ./dist
COPY --from=build --chown=medora:medora /app/public ./public
COPY --from=build --chown=medora:medora /app/src ./src
COPY --from=build --chown=medora:medora /app/.wrangler/deploy ./.wrangler/deploy
COPY --from=build --chown=medora:medora /app/vite.config.ts /app/wrangler.jsonc /app/tsconfig.json ./
COPY --chown=medora:medora docker-entrypoint.sh /app/docker-entrypoint.sh

# musl-libc native addon variants are dead weight on glibc bookworm-slim; drop them
# (npm's optionalDependencies mechanism installs both when it can't be certain of libc
# at install time — neither is ever loaded on this base image).
RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/tmp /tmp \
  && chown medora:medora /app /app/tmp \
  && find /app/node_modules -mindepth 1 -maxdepth 2 -type d -iname '*-linux-*musl*' -exec rm -rf {} +

USER medora
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=8s --start-period=90s --retries=5 \
  CMD wget -q --spider "http://127.0.0.1:3000/api/status" || exit 1

LABEL org.opencontainers.image.title="medora" \
  org.opencontainers.image.revision="${GIT_COMMIT}" \
  org.opencontainers.image.version="${BUILD_VERSION}" \
  org.opencontainers.image.created="${BUILT_AT}" \
  org.opencontainers.image.description="Medora hospital OS — Cloudflare Workers preview runtime"

STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
