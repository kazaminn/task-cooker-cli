#!/usr/bin/env bash
set -euo pipefail

echo "[setup] Installing dependencies..."
pnpm install --frozen-lockfile

if [[ "${RUN_AI_FIX:-true}" == "true" ]]; then
  echo "[setup] Running AI fix flow (lint:related --fix + format + related tests)..."
  pnpm run ai:fix
else
  echo "[setup] RUN_AI_FIX=false -> running check-only flow."
  pnpm run ai:check
fi

echo "[setup] Done."
