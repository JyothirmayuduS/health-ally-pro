# Digest-pinned Node 22 bookworm-slim (glibc — required for Cloudflare workerd).
ARG NODE_DIGEST=sha256:ef03a3d0e663b3c9d38c95be3fd31a100514d41df2599562b68a58a57f979adf

# ---------- deps (cached) ----------
FROM node:22-bookworm-slim@${NODE_DIGEST} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN npm run build \
  && npm prune --omit=dev

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

# Production node_modules only (vite/wrangler are runtime deps for preview/workerd)
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/.wrangler/deploy ./.wrangler/deploy
COPY --from=build /app/vite.config.ts /app/wrangler.jsonc /app/tsconfig.json ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/tmp /tmp \
  && chown -R medora:medora /app

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
