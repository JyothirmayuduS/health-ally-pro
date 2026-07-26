#!/usr/bin/env bash
# Generate a runtime metrics bearer token (never baked into the image).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="$ROOT/ops/observability/metrics_bearer_token"
ENV_DOCKER="$ROOT/.env.docker"

if [[ -f "$TOKEN_FILE" && -s "$TOKEN_FILE" ]]; then
  TOKEN="$(tr -d '\n\r' < "$TOKEN_FILE")"
  echo "Reusing existing metrics token file ($(wc -c < "$TOKEN_FILE" | tr -d ' ') bytes)."
else
  TOKEN="$(openssl rand -hex 32)"
  printf '%s' "$TOKEN" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
  echo "Wrote $TOKEN_FILE"
fi

if [[ -f "$ENV_DOCKER" ]]; then
  if grep -q '^METRICS_BEARER_TOKEN=' "$ENV_DOCKER"; then
    # Rewrite value without printing it
    tmp="$(mktemp)"
    grep -v '^METRICS_BEARER_TOKEN=' "$ENV_DOCKER" > "$tmp"
    printf 'METRICS_BEARER_TOKEN=%s\n' "$TOKEN" >> "$tmp"
    mv "$tmp" "$ENV_DOCKER"
    echo "Updated METRICS_BEARER_TOKEN in .env.docker"
  else
    printf '\nMETRICS_BEARER_TOKEN=%s\n' "$TOKEN" >> "$ENV_DOCKER"
    echo "Appended METRICS_BEARER_TOKEN to .env.docker"
  fi
else
  printf 'METRICS_BEARER_TOKEN=%s\n' "$TOKEN" > "$ENV_DOCKER"
  echo "Created .env.docker with METRICS_BEARER_TOKEN"
fi
