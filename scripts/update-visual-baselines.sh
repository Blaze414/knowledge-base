#!/usr/bin/env bash
# Regenerate Playwright baselines inside the pinned Playwright container so
# every teammate produces byte-identical PNGs regardless of host OS/fonts.
#
# Usage:
#   scripts/update-visual-baselines.sh                   # update all
#   scripts/update-visual-baselines.sh tests/visual/pages.spec.ts
set -euo pipefail

# Keep this pinned to the same version as devDependencies["@playwright/test"].
IMAGE="mcr.microsoft.com/playwright:v1.61.1-jammy"

docker run --rm -it \
  -v "$PWD":/work -w /work \
  --ipc=host \
  -e CI=1 \
  "$IMAGE" \
  bash -lc "bun install --frozen-lockfile && bun run test:visual:update -- $*"
