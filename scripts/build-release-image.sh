#!/usr/bin/env bash
# Build the release image from the exact clean HEAD with OCI labels + dual tags.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is dirty — refuse release build" >&2
  git status -sb >&2
  exit 1
fi

COMMIT="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short=12 HEAD)"
VERSION="${BUILD_VERSION:-}"
if [[ -z "$VERSION" ]]; then
  VERSION="$(git describe --tags --exact-match HEAD 2>/dev/null || true)"
fi
if [[ -z "$VERSION" ]]; then
  VERSION="sha-$SHORT"
fi
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SOURCE_URL="${OCI_SOURCE:-https://github.com/JyothirmayuduS/health-ally-pro}"

echo "Building medora-app from clean HEAD"
echo "  commit=$COMMIT"
echo "  version=$VERSION"
echo "  built_at=$BUILT_AT"

docker build \
  --build-arg "GIT_COMMIT=$COMMIT" \
  --build-arg "BUILD_VERSION=$VERSION" \
  --build-arg "BUILT_AT=$BUILT_AT" \
  --build-arg "BUILD_DIRTY=false" \
  --build-arg "BUILD_ENVIRONMENT=release" \
  -t "medora-app:$VERSION" \
  -t "medora-app:$SHORT" \
  -t "medora-app:sha-$SHORT" \
  .

DIGEST="$(docker image inspect "medora-app:$SHORT" --format '{{index .RepoDigests 0}}' 2>/dev/null || true)"
ID="$(docker image inspect "medora-app:$SHORT" --format '{{.Id}}')"
REV="$(docker image inspect "medora-app:$SHORT" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')"
VER="$(docker image inspect "medora-app:$SHORT" --format '{{index .Config.Labels "org.opencontainers.image.version"}}')"

echo "IMAGE_ID=$ID"
echo "OCI_REVISION=$REV"
echo "OCI_VERSION=$VER"
echo "LOCAL_DIGEST_HINT=$DIGEST"
echo "TAGS=medora-app:$VERSION medora-app:$SHORT medora-app:sha-$SHORT"

if [[ "$REV" != "$COMMIT" ]]; then
  echo "ERROR: OCI revision ($REV) != HEAD ($COMMIT)" >&2
  exit 1
fi
