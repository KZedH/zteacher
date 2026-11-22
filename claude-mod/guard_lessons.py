#!/usr/bin/env python3
"""Claude Code PreToolUse guard for locked lesson files.

During a lesson, each file with holes has a lock line: a line that
starts with "# LESSON-LOCK:". The user fills the holes and then removes
the lock line. While the line is in a file, an agent cannot change it:

- Edit, Write, MultiEdit, and NotebookEdit of a locked file are denied.
  A Write that creates a new file, and an Edit that adds the lock line to
  a file that is not locked, are permitted.
- A Bash command that names a locked file (or a folder that holds one)
  must be a read command, or a Rex command that opens the file in nvim or
  vim for the user.
- In a worktree on a lesson-* branch, git commands that can discard the
  user's work (checkout, restore, reset, stash, clean, rm, mv, switch)
  are denied.
- rex send and rex send-key are denied when the target pane shows the
  name of a locked file, or when the guard cannot read the pane.

Set LESSON_GUARD=off before you start Claude Code to turn the guard off
for that session. Reads the hook input (JSON) on stdin.
"""

import glob
import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

LOCK_PATTERN = "^# LESSON-LOCK:"
LOCK = re.compile(LOCK_PATTERN, re.MULTILINE)
REASON = (
    "This file has a LESSON-LOCK line: the user fills its holes. Give a hint, "
    "or name the line of the first error, and let the user change the file. "
    "To turn this guard off, start Claude Code with LESSON_GUARD=off."
)
DISCARD_REASON = (
    "This worktree is on a lesson branch. This git command can discard the "
    "user's work. Ask the user to run it."
)
CANNOT_READ_PANE = "The lesson guard cannot read the target pane, so it denies rex send."
READ_COMMANDS = {"cat", "cd", "head", "tail", "less", "grep", "rg", "ls", "wc", "diff", "file"}
READ_GIT = {"diff", "log", "show", "status", "blame", "add", "commit", "push", "grep"}
DISCARD_GIT = {"checkout", "restore", "reset", "stash", "clean", "rm", "mv", "switch"}
EDITORS = {"nvim", "vim"}
REX_OPEN = {"split", "run", "window"}
REX_TYPE = {"send", "send-key"}
REX_SERVER_FLAGS = {"-S", "--server", "-C", "--client"}
REX_TARGET_FLAGS = {"-s", "--session", "-w", "--window", "-b", "--block"}
SEPARATORS = {";", "&&", "||", "|", "&", "(", ")"}


def deny(reason: str = REASON) -> NoReturn:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )
    sys.exit(0)


def git(cwd: Path, *arguments: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(cwd), *arguments], capture_output=True, text=True, check=False
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def is_locked(path: Path) -> bool:
    """A file with a lock line, or a folder whose tracked files include one."""
    try:
        if path.is_dir():
            return bool(git(path, "grep", "-l", "-E", LOCK_PATTERN, "--", "."))
        return path.is_file() and bool(LOCK.search(path.read_text(errors="ignore")))
    except OSError:
        return False


def locked_names(cwd: Path) -> set[str]:
    """The file names of each locked file in each worktree of the repository."""
    names: set[str] = set()
    for line in git(cwd, "worktree", "list", "--porcelain").splitlines():
        if line.startswith("worktree "):
            root = Path(line.removeprefix("worktree "))
            for match in git(root, "grep", "-l", "-E", LOCK_PATTERN).splitlines():
                names.add(Path(match).name)
    return names


def git_subcommand(words: list[str]) -> str | None:
    if Path(words[0]).name != "git":
        return None
    index = 1
    while index < len(words) and words[index].startswith("-"):
        index += 2 if words[index] in {"-c", "-C"} else 1
    return words[index] if index < len(words) else None


def is_editor_open(words: list[str]) -> bool:
    """A Rex command that opens files in nvim or vim, with no editor options.

    An option such as -c or +cmd can run editor commands, so it is not a read.
    """
    if Path(words[0]).name != "rex" or "--" not in words:
        return False
    split = words.index("--")
    program = words[split + 1 :]
    if not REX_OPEN & set(words[:split]):
        return False
    if not program or Path(program[0]).name not in EDITORS:
        return False
    return not any(w.startswith(("-", "+")) for w in program[1:])


def is_read(words: list[str]) -> bool:
    name = Path(words[0]).name
    if name in READ_COMMANDS:
        return ">" not in words and ">>" not in words
    if name == "git":
        return git_subcommand(words) in READ_GIT
    return is_editor_open(words)


def names_locked_file(words: list[str], cwd: Path) -> bool:
    """True if a word of the command names a locked file or folder (globs expanded).

    A quoted word such as 'echo > f' or "open('f', 'w')" can hold a path, so
    each part between spaces, quotes, and punctuation is also a candidate.
    """
    parts = {p for w in words for p in re.split(r"[\s'\"(),;=<>|&`]+", w)}
    for value in parts | set(words):
        if not value or value.startswith("-"):
            continue
        pattern = str(cwd / Path(value).expanduser())
        paths = glob.glob(pattern) if glob.has_magic(value) else [pattern]
        if any(is_locked(Path(p)) for p in paths):
            return True
    return False


def flag_values(words: list[str], flags: set[str]) -> list[str]:
    """Return each flag of FLAGS in WORDS with its value, as separate words."""
    found: list[str] = []
    for index, word in enumerate(words):
        name, equals, value = word.partition("=")
        if name not in flags:
            continue
        if equals:
            found += [name, value]
        elif index + 1 < len(words):
            found += [word, words[index + 1]]
    return found


def check_rex_typing(words: list[str], cwd: Path) -> None:
    """Deny rex send and rex send-key to a pane that shows a locked file."""
    if Path(words[0]).name != "rex" or not REX_TYPE & set(words):
        return
    names = locked_names(cwd)
    if not names:
        return
    capture = [
        "rex",
        *flag_values(words, REX_SERVER_FLAGS),
        "capture",
        *flag_values(words, REX_TARGET_FLAGS),
        "--trim",
    ]
    try:
        result = subprocess.run(capture, capture_output=True, text=True, timeout=5, check=False)
    except (OSError, subprocess.TimeoutExpired):
        deny(CANNOT_READ_PANE)
    if result.returncode != 0:
        deny(CANNOT_READ_PANE)
    if any(name in result.stdout for name in names):
        deny()


def simple_commands(command: str) -> list[list[str]]:
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    try:
        tokens = list(lexer)
    except ValueError:  # unbalanced quotes: no safe split
        return [command.split()]
    commands: list[list[str]] = [[]]
    for token in tokens:
        if token in SEPARATORS:
            commands.append([])
        else:
            commands[-1].append(token)
    return [c for c in commands if c]


def check_bash(command: str, cwd: Path) -> None:
    for words in simple_commands(command):
        if Path(words[0]).name == "cd" and len(words) > 1:
            cwd = cwd / Path(words[1]).expanduser()
            continue
        if git_subcommand(words) in DISCARD_GIT:
            target = Path(flag_values(words, {"-C"})[1]) if "-C" in words else cwd
            if git(cwd / target, "branch", "--show-current").startswith("lesson-"):
                deny(DISCARD_REASON)
        if not is_read(words) and names_locked_file(words, cwd):
            deny()
        check_rex_typing(words, cwd)


def main() -> None:
    if os.environ.get("LESSON_GUARD") == "off":
        return
    hook_input = json.load(sys.stdin)
    tool = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})
    cwd = Path(hook_input.get("cwd") or os.getcwd())
    if tool == "Bash":
        check_bash(tool_input.get("command", ""), cwd)
        return
    path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if path and is_locked(cwd / path):
        deny()


if __name__ == "__main__":
    main()
