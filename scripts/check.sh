#!/usr/bin/env bash
# The commit gate of zteacher. Every commit passes it (see .githooks/).
#   ./scripts/check.sh        # run from the repo root or a worktree root
#
# Checks:
#   1. The STE check of the unslop skill on each doctrine document and
#      on AGENTS.md. Exit 0 = no hard hits.
#   2. scripts/check_state.py on examples/.zteacher: the sample course
#      state is valid and host-neutral.
#   3. The graph renderer renders examples/.zteacher/graph.jsonl to a
#      PNG without error (pure Node; no network).
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
run() { # run NAME COMMAND...
	local name="$1"; shift
	if "$@" >/tmp/zteacher-check-$name.log 2>&1; then echo "ok:   $name"; else
		echo "FAIL: $name"; sed 's/^/      /' "/tmp/zteacher-check-$name.log" | head -20
		fail=1
	fi
}

ste=ste_check.py
unslop="$HOME/.agents/skills/unslop"
[ -f "$unslop/scripts/$ste" ] || unslop="$HOME/.claude/skills/unslop"
[ -f "$unslop/scripts/$ste" ] || {
	echo "FAIL: the unslop skill is not in ~/.agents/skills/unslop or ~/.claude/skills/unslop"
	exit 1
}

run ste_check python3 "$unslop/scripts/$ste" docs/*.md AGENTS.md \
	--glossary GLOSSARY.md --keep --summary
run check_state python3 scripts/check_state.py examples/.zteacher
run render_check node --experimental-strip-types scripts/render_check.ts

exit "$fail"
