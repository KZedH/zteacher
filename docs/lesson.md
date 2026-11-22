# Lesson

This document gives the rules for a lesson. These are its plan,
its skeleton, its holes and hole tests, the lock, and the branch.
They also include the check that closes the lesson, and the merge
to `main`. The document also gives the rules for `progress.md`,
the file that records each lesson.

Sources: `~/code/drone-rl-gym/AGENTS.md`, parts `Lessons` and
`Workflow` (commit 44459c3); `~/code/drone-rl-gym/docs/_scratch/lesson-plan.md`,
parts `Skills` and `Problem 1.1`; `~/code/drone-rl-gym/.claude/hooks/guard_lessons.py`,
the module docstring; `tests/test_hover.py` on the branch
`lesson-hover-1d`, the `holes` decorator; LearnHarness
`docs/teaching-methodology.md`, sections 5, 7a, and 9.

## What a lesson is

A lesson teaches one node of the topic graph (see
[graph.md](graph.md)). It is one large worked example with holes.
The agent writes the boilerplate. The learner writes each
decision that the lesson teaches, in a hole.

The code is the teaching. The learner learns from the work, not
from questions. The lesson starts with the problem and the
minimum facts that the problem needs. It does not start with a
lecture.

The agent does all the logistics: the facts, the boilerplate, the
tests, the branches, and the course state files. Thus all the work
of the learner goes into the decisions of the lesson.

## The sequence of lessons

Give one lesson for each node, in a topological order of the
graph. Open a lesson only when each node that it requires has a
passed check.

A lesson builds on the code of the nodes that it requires. That
code is on `main`, and its checks passed. Thus, when a hole test
fails, the cause is in the new node, not in an earlier node.

Each lesson has larger holes than the lesson before it. The holes
become larger until the learner writes full files.

## The check, and why it comes after the work

LearnHarness gives a check after each reasoning step. zteacher
teaches by code, so it uses checks after completed work:

- Each hole is one reasoning step. Its hole test is the check of
  that step. An incorrect fill fails its test immediately, so the
  error shows before the learner builds on it.
- One check closes each lesson, at the end. The check is in the
  part [Close the lesson](#close-the-lesson).

When a check fails, repair the node before the next node opens.
The next node requires the node of that check. Without a repair,
the next node cannot start on held facts.

## The plan file

The plan is `.zteacher/lessons/<node-id>/plan.md`. It has these
parts:

```markdown
# Lesson: <topic of the node>

Node: <node-id>
Branch: lesson-<node-id>
Worktree: <absolute path of the lesson worktree>

## Goal
<the problem, in a few sentences>

## Facts
<the minimum facts that the problem needs, with the date that you examined them>

## Holes
1. HOLE 1: <the decision>, in <file>
2. HOLE 2: <the decision>, in <file>

## Done when
<the command of the hole tests, and the condition of the check>

## Result
<the date and the verdict of the check, written when the lesson closes>
```

Give a fact only in one of two conditions. The learner cannot
get the fact from the resources in a short time, or the fact is a
convention of the project. Do not give a fact that is the answer
to a hole.

## Make a lesson

1. Make the worktree and the lesson branch from `main`:
   `git worktree add ../<repo>-lesson-<node-id> -b lesson-<node-id> main`.
2. Write the skeleton. Put the lesson code in its usual position in
   the project. The skeleton holds the boilerplate and one
   `HOLE n` for each decision that the lesson teaches.
3. Write the hole tests.
4. Make the proof of the hole tests.
5. Commit the skeleton and the hole tests.
6. Put the lock line on line 1 of each file with holes. Commit
   again.
7. Write the plan file, and set the node to `lesson-open` in
   `progress.md`.
8. Open each locked file in an editor for the learner, in the
   lesson worktree.

### The holes

Each hole raises `NotImplementedError("HOLE n")`. Its docstring,
or a comment above it, gives a question about the decision. The
question names the decision. It does not give the answer.

Make each hole one reasoning step. These are the limits:

- If the learner can fill a hole with a copy of one fact, the hole
  is too small. Fill it in the skeleton.
- If a hole needs two new ideas, it is too large. Divide it into
  two holes.

### The hole tests

Each hole test examines a behavior, not a formula. For example, a
test calls the filled function with an input that has a known
result. It
does not compare the text of the code to an answer.

A hole test shows XFAIL while its hole is empty. When the learner
fills the hole, the test passes or fails. Use a decorator that
catches `NotImplementedError` and calls `pytest.xfail`. With this
decorator, a filled hole does not show XPASS:

```python
import functools
import pytest

def holes(names):
    """Show the test as XFAIL while one of its holes is empty."""
    def decorate(test):
        @functools.wraps(test)
        def run(*args, **kwargs):
            try:
                test(*args, **kwargs)
            except NotImplementedError as error:
                pytest.xfail(f"needs {names}: {error}")
        return run
    return decorate
```

Each test names its holes in the decorator, for example
`@holes("HOLE 1")`.

### The proof

1. Fill the skeleton in a scratch copy. Keep the copy away from
   the lesson worktree.
2. Operate the hole tests on the copy. Make sure that each hole
   test passes.
3. Put one typical error of a learner in the copy. Operate the
   hole tests. Make sure that a hole test fails.
4. Do step 3 again for each typical error.
5. Remove the scratch copy.

An error that no hole test finds must be a correct alternative.
If it is not, add a hole test that finds it.

### The lock

The lock line is the first line of a file with holes. It starts
with `# LESSON-LOCK:`, then the node id:

```python
# LESSON-LOCK: list-slice
```

While the lock line is in a file, the agent does not change the
file. The learner removes the lock line at the end of the lesson.

## During the lesson

The learner writes the code in the holes. The agent can operate
the tests, and can change each file that is not locked.

- When the learner wants help with a hole, give one hint, or the
  line of the first error. Do not write the fill.
- When a hole test fails, give the test name and the line of the
  first error. The learner writes the correction.
- In the lesson worktree, do not give a git command that can
  discard the work of the learner, for example `git checkout`,
  `git reset`, `git stash`, or `git clean`. Tell the learner to
  give the command.

## Close the lesson

1. The learner removes each lock line and commits.
2. The agent removes each hole marker that it wrote: the `HOLE n`
   comments, the hole questions, and the `holes` decorators of
   the hole tests. The agent does not change the code of the
   learner. Commit.
3. If `main` has new commits, merge `main` into the lesson branch.
4. Do the check, in the lesson worktree. The check passes when
   these three conditions are all correct:
   - Each hole test passes. No test shows XFAIL or fails.
   - `git grep -n -e HOLE -e LESSON-LOCK` finds nothing.
   - The commit gate of the project passes, if the project has one.
5. Write the verdict of the check in the `Log` part of
   `progress.md`.
6. If the check fails, the node stays `lesson-open`. Give the
   learner the condition that is not correct. The learner repairs
   the node, and you do the check again. If the cause is a fact
   that the learner does not hold, revise the graph (see
   [graph.md](graph.md)).
7. If the check passes, set the node to `check-passed`. In the
   checkout of `main`, merge with a fast forward only:
   `git merge --ff-only lesson-<node-id>`.
8. Write the merge in the `Log` part of `progress.md`, with the
   commit of `main`.
9. Write the result in the plan file. Remove the lesson worktree.

A fast forward merge keeps the history of `main` linear, so each
merge is one clear step. `main` carries no holes, so `main` always
holds working code.

## The file `progress.md`

The file is `.zteacher/progress.md`. It has a table and a `Log`
part. The table has one row for each node of the graph, in a
topological order. This example shows the format.

```markdown
# Progress

| Node | Status | Planned | Lesson open | Check passed |
| --- | --- | --- | --- | --- |
| list-index | check-passed | 2026-11-22 | 2026-11-22 | 2026-11-23 |
| list-slice | planned | 2026-11-22 | | |

## Log

- 2026-11-23 check list-index: pass. 3 of 3 hole tests pass.
- 2026-11-23 merge lesson-list-index to main: 1a2b3c4
```

A node has one of three statuses:

- `planned`: the learner agreed the graph that holds the node.
- `lesson-open`: the lesson worktree and its plan file are on
  disk.
- `check-passed`: the check that closes the lesson passed.

When a node moves to a new status, write the status and the date
in its row. Do not remove an earlier date.

The `Log` part has two types of line. Add each line at the end:

- `<date> check <node-id>: pass. <evidence>` or
  `<date> check <node-id>: fail. <the condition that is not correct>`.
- `<date> merge lesson-<node-id> to main: <commit>`.

When the graph changes, add a row for each new node, and remove
the row of each removed node.

## Keep the course state out of git

Do not commit the files of `.zteacher/` to the project. The plan
files name each hole, and `main` carries no holes.
