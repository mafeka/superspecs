#!/usr/bin/env bash
# Installs SuperSpec into a target repository.
#
#   curl -fsSL https://raw.githubusercontent.com/mafeka/superspecs/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/mafeka/superspecs/main/install.sh | bash -s -- /path/to/repo --force
#
# With no argument, installs into the current directory. This is a thin
# wrapper: it clones the superspecs repo to a temp dir and delegates the
# actual work to bin/install.js, so the install logic lives in exactly one
# place regardless of how it's invoked (this script, or `npx github:mafeka/superspecs`).

set -euo pipefail

REPO_URL="https://github.com/mafeka/superspecs.git"

for cmd in git node; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[superspecs] ERROR: $cmd is required and was not found on PATH." >&2
    exit 1
  fi
done

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "[superspecs] Fetching installer from $REPO_URL..."
git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR"

node "$TMP_DIR/bin/install.js" "$@"
