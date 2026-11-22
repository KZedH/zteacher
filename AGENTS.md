# zteacher

zteacher turns a project into a learning project. The learner arms
the teacher in a project. The agent of the project then writes a
syllabus, probes the learner, and makes a topic graph. Then it
gives one lesson for each node of the graph. The learner writes the lesson
code, and one check closes each node.

## Layout

- `docs/`: the doctrine. One file holds one doctrine: `syllabus.md`,
  `probe.md`, `graph.md`, `lesson.md`, and `voice.md`. Each document
  also gives the format of the course state file that it owns.
- `extension/`: the pi extension. `/teacher` arms or disarms the
  teacher. The `graph` and `progress` tools show the course state.
- `extension/skills/`: one skill for each step of a course. Each
  skill points to its doctrine document. The two hosts use these
  skills.
- `claude-mod/`: the Claude Code mod. `setup.py TARGET` arms the
  teacher in a project, and `teardown.py TARGET` disarms it.
- `examples/.zteacher/`: a sample course state.

## Doctrine rules

- One document holds each rule. A different document points to the
  rule. It does not write the rule again.
- A host loads the doctrine. A host does not write a rule of its own
  about the method of teaching. Thus a repair in one document repairs
  the two hosts.
- No file in `.zteacher/` names a host.
- The tools of the teacher make no network calls.

## Write a document

Each document passes the STE check with exit status 0:

```sh
python3 ~/.claude/skills/unslop/scripts/ste_check.py FILE --glossary GLOSSARY.md --keep
```

This applies to `docs/`, the skills, `claude-mod/segment.md`, and
this file. Read each source before you cite it, and cite its section.

## Workflow

1. Work in a worktree on a new branch:
   `git worktree add ../zteacher-<task> -b <task>`.
2. Before each commit, operate the STE check on each changed
   document.
3. Merge to `main` with a fast forward only:
   `git merge --ff-only <task>`.

## Operate the hosts

- pi: `pi -e <zteacher>/extension`, then `/teacher` in the project.
- Claude Code: `<zteacher>/claude-mod/setup.py <project>`. Operate
  `setup.py` again after a change to `docs/voice.md`, because the
  segment holds a copy of its text.
