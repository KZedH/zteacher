#!/usr/bin/env python3
"""Disarm zteacher in a target project for Claude Code.

Usage: teardown.py TARGET

The script removes each part that setup.py installed: the CLAUDE.md
segment, the skill symlinks, the guard symlink, and the guard hooks in
.claude/settings.local.json. It removes a file or a folder that setup.py
made when nothing else remains in it. The course state in
TARGET/.zteacher/ stays, so the learner can arm the teacher again and
continue the course.
"""

import json
import sys
from pathlib import Path

from setup import GUARD, HOOK_COMMAND, SKILLS, remove_segment


def remove_claude_md(target: Path) -> None:
    path = target / "CLAUDE.md"
    if not path.exists():
        return
    text, created = remove_segment(path.read_text())
    if created and text == "":
        path.unlink()
    else:
        path.write_text(text)


def unlink(path: Path, source: Path) -> None:
    if path.is_symlink() and path.resolve() == source.resolve():
        path.unlink()


def remove_hooks(target: Path) -> None:
    path = target / ".claude" / "settings.local.json"
    if not path.exists():
        return
    settings = json.loads(path.read_text())
    hooks = settings.get("hooks", {})
    groups = hooks.get("PreToolUse", [])
    for group in groups:
        group["hooks"] = [h for h in group.get("hooks", []) if h.get("command") != HOOK_COMMAND]
    hooks["PreToolUse"] = [g for g in groups if g["hooks"]]
    if not hooks["PreToolUse"]:
        del hooks["PreToolUse"]
    if not hooks:
        settings.pop("hooks", None)
    if settings:
        path.write_text(json.dumps(settings, indent=2) + "\n")
    else:
        path.unlink()


def remove_empty(folder: Path) -> None:
    if folder.is_dir() and not any(folder.iterdir()):
        folder.rmdir()


def main() -> None:
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
        sys.exit("usage: teardown.py TARGET (a project folder)")
    target = Path(sys.argv[1]).resolve()
    remove_claude_md(target)
    for skill in SKILLS.iterdir():
        unlink(target / ".claude" / "skills" / skill.name, skill)
    unlink(target / ".claude" / "hooks" / "guard_lessons.py", GUARD)
    remove_hooks(target)
    for folder in ("skills", "hooks", ""):
        remove_empty(target / ".claude" / folder)
    print(f"zteacher disarmed in {target}. The course state in .zteacher/ stays.")


if __name__ == "__main__":
    main()
