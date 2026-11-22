#!/usr/bin/env bash
# One-time setup: point git at .githooks/ so each commit runs the gate.
#   ./scripts/setup-hooks.sh        # run from the repo root or a worktree root
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooks"Path" .githooks
echo "hooks: .githooks/ (pre-commit, pre-merge-commit run scripts/check.sh)"
