#!/usr/bin/env python3
"""Arm zteacher in a target project for Claude Code.

Usage: setup.py TARGET

The script installs three parts in TARGET:

- The zteacher segment in CLAUDE.md, between two marker lines. The
  segment points to the doctrine in docs/ of this repo and holds the
  text of docs/voice.md. Claude Code does not import a file from
  outside the project without an approval, so the text is copied.
- A symlink in .claude/skills/ for each skill of extension/skills/.
- A symlink .claude/hooks/guard_lessons.py, and its two PreToolUse
  hooks in .claude/settings.local.json.

teardown.py removes each part. The course state in TARGET/.zteacher/
is not touched by either script. A second run of setup.py replaces
the segment and keeps one copy of each hook.
"""

import json
import sys
from pathlib import Path

ZTEACHER = Path(__file__).resolve().parent.parent
DOCS = ZTEACHER / "docs"
SKILLS = ZTEACHER / "extension" / "skills"
GUARD = ZTEACHER / "claude-mod" / "guard_lessons.py"
SEGMENT = ZTEACHER / "claude-mod" / "segment.md"
BEGIN = "<!-- zteacher:begin"
END = "<!-- zteacher:end -->\n"
HOOK_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/guard_lessons.py'
MATCHERS = ["Bash", "Edit|Write|MultiEdit|NotebookEdit"]


def remove_segment(text: str) -> tuple[str, bool]:
    """Return TEXT without the zteacher segment, and the created flag of the segment."""
    start = text.find(BEGIN)
    if start < 0:
        return text, False
    header = text[start : text.index("-->", start)]
    fields = dict(f.split("=") for f in header.split()[2:])
    stop = text.index(END, start) + len(END)
    pre = int(fields.get("pre", "0"))
    return text[: start - pre] + text[stop:], fields.get("created") == "1"


def install_segment(target: Path) -> None:
    path = target / "CLAUDE.md"
    created = not path.exists()
    text, was_created = remove_segment("" if created else path.read_text())
    created = created or (was_created and text == "")
    pre = "" if text == "" else ("\n" if text.endswith("\n") else "\n\n")
    body = SEGMENT.read_text().replace("{{DOCS}}", str(DOCS)).replace("{{VOICE}}", (DOCS / "voice.md").read_text())
    header = f"{BEGIN} pre={len(pre)} created={int(created)} -->\n"
    path.write_text(text + pre + header + body + END)


def link(path: Path, source: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        if path.resolve() == source.resolve():
            return
        sys.exit(f"setup.py: {path} is a symlink to {path.resolve()}, not to {source}")
    if path.exists():
        sys.exit(f"setup.py: {path} exists and is not a zteacher symlink")
    path.symlink_to(source)


def install_hooks(target: Path) -> None:
    path = target / ".claude" / "settings.local.json"
    settings = json.loads(path.read_text()) if path.exists() else {}
    pre_tool_use = settings.setdefault("hooks", {}).setdefault("PreToolUse", [])
    for matcher in MATCHERS:
        hook = {"type": "command", "command": HOOK_COMMAND, "timeout": 10, "onFailure": "block"}
        group = next((g for g in pre_tool_use if g.get("matcher") == matcher), None)
        if group is None:
            pre_tool_use.append({"matcher": matcher, "hooks": [hook]})
        elif not any(h.get("command") == HOOK_COMMAND for h in group.get("hooks", [])):
            group.setdefault("hooks", []).append(hook)
    path.write_text(json.dumps(settings, indent=2) + "\n")


def main() -> None:
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
        sys.exit("usage: setup.py TARGET (a project folder)")
    target = Path(sys.argv[1]).resolve()
    install_segment(target)
    for skill in sorted(p for p in SKILLS.iterdir() if (p / "SKILL.md").is_file()):
        link(target / ".claude" / "skills" / skill.name, skill)
    link(target / ".claude" / "hooks" / "guard_lessons.py", GUARD)
    install_hooks(target)
    marker = target / ".zteacher" / "armed"
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text("teacher armed")
    print(f"zteacher armed in {target}")


if __name__ == "__main__":
    main()
