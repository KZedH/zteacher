# Make zteacher

<context>
You make zteacher in this repo. zteacher turns a project into a
learning project. It ships two hosts: a pi extension and a Claude
Code mod. A person turns the teacher on in a project. The project
agent then runs a course: it writes a syllabus, draws a topic
graph, and runs one lesson for each node. The person writes the
lesson code, and one check gates each node. The learning half of
`~/code/drone-rl-gym` moves into zteacher. That repo keeps only
the gym.
</context>

The person directs the work. Each decision that sets a
precedent goes to the person as one question. Facts come from your
tools, not from guesses.

## How you work

<working_rules>
- **Notes**. Keep `BUILD-NOTES.md` at the repo root, not in the
  layout. At the start of each session, read it and `git log`. At
  the end of each phase, record the status, each "Done when"
  result, and the open questions. Commit each completed step in its
  task worktree. The work is long, so the notes and the commits
  hold the state across sessions.
- **Gate checks**. Do not remove or weaken a check that you made
  earlier. This holds for an STE check, a commit gate, a hole
  test, or a "Done when" check. A weaker check hides a defect.
  If a check looks incorrect, put the question to the person.
- **Self-check**. Before you mark a phase complete, operate each of
  its "Done when" checks.
- **Scope**. Make only what the phases specify. Add no function,
  alternative, abstraction, or file that a phase does not name.
  Each added part is more code for the person to examine.
- **Sources first**. Read each source before you write doctrine
  that cites it. Cite the section, not your memory.
</working_rules>

## The model

Three layers:

- **Doctrine**. The teaching method, written as documents in this
  repo. One source of truth holds each rule.
- **Hosts**. A pi extension and a Claude Code mod. Each host loads
  the same doctrine into its agent and adds its own tools and
  commands. The doctrine stays one layer, so a repair in one document
  repairs the two hosts.
- **State**. The course files in `.zteacher/` of the learning
  project. The state is plain files. Each host reads the same
  state with its own tools.

The state files hold the course. Each host reads and writes
these files.

## The workflow in a learning project

The toggle arms or disarms the teacher in that project. Armed, the
agent holds the doctrine and the tools. Disarmed, the agent acts
as an ordinary coding agent. The course files stay after disarming,
so the person can arm the teacher again and continue the course.

1. **Syllabus**. The person gives one high level goal. The agent
   reads the goal and writes `.zteacher/syllabus.md`. The syllabus
   has three parts, in the shape of the
   CS 7642 syllabus (see References):
   - **General information**. Short prose. It names the goal and
     states why the objective is worth reaching.
   - **Objectives**. The measurable states the learner will hold.
     The agent settles each objective with the person, then
     writes it.
   - **Resources**. The material for the course. The agent first
     searches the `~/code/zwiki` wiki. A resource that zwiki does
     not hold goes into zwiki first, then into the syllabus. Thus
     zwiki stays the one source of course material.
2. **Measurement**. The agent probes before it draws the graph.
   It asks one question at a time. Each answer moves an edge, so
   the next question depends on it. It brackets the edge of each
   strand: the floor the person holds and the ceiling the person
   does not hold. The probe result goes to
   `.zteacher/probe-<date>.md`.
3. **Topic graph**. The agent draws the graph from the resources,
   not from the syllabus alone. The resources hold the sections
   that the nodes cite. Each node names a topic, states it
   as one proposition, and cites the section that develops it.
   Each edge means `requires`: the source node must be held
   before the target node. The graph is the minimal tree: the
   smallest set of nodes and edges that leads from what the
   person holds to the objectives. The person confirms
   the graph before the first lesson, because the lessons follow
   the graph order. Subsequent probe results can
   revise the graph, because the graph is a hypothesis, not a
   contract.
4. **Lessons**. One lesson for each node, in topological order.
   The lesson plan sits in
   `.zteacher/lessons/<node-slug>/plan.md`. A lesson is one
   large worked example with holes. The skeleton holds
   the boilerplate and one `HOLE n` for each decision that the
   lesson teaches. Each hole test shows XFAIL until the person
   fills the hole. Each next lesson has larger holes. The lesson
   runs in its own worktree on a `lesson-<name>` branch. `main`
   carries no holes, so `main` always holds working code. One
   check closes each lesson, at the end.
   The code is the teaching: the person learns from the work, not
   from questions. When a check fails, repair the node before the
   next node opens. The next node requires the node that fails its
   check.
5. **`progress`**. `.zteacher/progress.md` tracks each node:
   `planned`, `lesson-open`, `check-passed`, and the date. It also
   logs each check verdict and each lesson that merged to `main`.

## The teaching doctrine

Two sources hold the doctrine material. Write zteacher's own
canon in `docs/` from them. Do not copy the sources. The canon
must show exit status 0 on the STE check. It must hold each rule
in one document. Copied text does not do these two things.

<sources>
- LearnHarness theory and system prompts. The theory: knowledge
  is a graph of propositions. Teaching moves one reasoning step
  at a time, from what the learner holds. Each step lands as
  obviously correct, and a check catches the miss immediately. The plan
  is the minimal tree, and the plan map is a map, not the road.
  The system absorbs all logistics, so all the work of the learner goes
  into the material. The click is the payoff: loose facts
  fall into a structure that a small number of root facts
  supplies.
- The drone-rl-gym lesson pattern. Problem first. One skill for
  each group of problems. Hole granularity rules. Hole tests as
  behavior checks. The LESSON-LOCK mechanism. The merge flow.
</sources>

The two sources disagree on one point. LearnHarness runs a check
after each reasoning step. zteacher teaches by code, so it uses
checks after completed work. The lesson code puts the learner in contact with the material. A
hole with an incorrect fill fails its test immediately. The
test is the check.

One document for each doctrine, in `docs/`:

- `docs/probe.md`: how to bracket the edge. One question at a
  time. Start near the top. Each question moves an edge.
- `docs/graph.md`: what a node and an edge are. How to cite
  resources. When to revise the graph.
- `docs/lesson.md`: plan, skeleton, holes, hole tests, lock,
  branch, merge flow, and the check that closes each node.
- `docs/voice.md`: no praise. No agreement bias. No padding. No
  performed method. State what is correct and what is incorrect,
  plainly.
- `docs/syllabus.md`: the three parts and their order.

## What you make

Make the phases in this order. Finish each phase before the next.

1. **Doctrine documents** in `docs/`. Done when: `docs/` holds
   the five files above. Each document passes the STE check of the
   unslop skill with exit status 0. Each rule lives in one document
   only. Other documents point to that rule and do not restate it.
2. **Course state schema** for `.zteacher/`. Select the set of files:
   the syllabus, the probe, the graph (nodes and edges), the
   lesson plans, and `progress.md`. Plain markdown and JSONL.
   Done when: a scratch repo holds one file of each type. Each
   JSONL line parses as JSON. Each node has a topic, a proposition,
   and a cite. Each edge has the type `requires` and names two
   nodes of the graph. Each of the files alone shows its part of the
   course state. No file names a host.
3. **pi extension** in `extension/`. A `/teacher` command
   toggles the teacher. A package of skills loads the doctrine. A
   `graph` tool renders the topic graph inline with kitty
   graphics. A `progress` tool prints the course state. Read the
   pi extension and skills docs first (see References). The
   extension API comes from them, not from guesses. Done
   when: pi starts with the extension and shows no error. In
   a scratch repo, `/teacher` arms and then disarms the teacher.
   The `graph` tool renders the graph of that repo inline. The
   `progress` tool prints the same state that `progress.md` holds.
4. **Claude Code mod** in `claude-mod/`. A setup script and a
   teardown script arm and disarm the teacher in a target
   project. They install and remove the CLAUDE.md segment, the
   skills, and `guard_lessons.py` from the drone-rl-gym pattern. The mod
   reuses the same doctrine documents. Done when: the setup
   script and the teardown script each exit with status 0 on
   a scratch repo. After teardown, `git status` in the scratch
   repo shows no change apart from `.zteacher/`.
5. **End-to-end test**. In a scratch repo, with the pi extension
   armed: give a toy goal, write a syllabus, and make a five
   node graph. Open one lesson, fill one hole, and one check
   passes. Done when: each step leaves its state files in
   `.zteacher/`. `progress.md` shows the node move from `planned`
   to `lesson-open` to `check-passed`, each with a date, and logs
   the check verdict and the merge to `main`. When you examine
   `main`, you find no `HOLE`.

## Examples

These examples show the shape of three course files. They use a
toy goal. Phase 2 sets the file names and fields. The
drone-rl-gym pattern sets the hole mechanism. Do not copy
the toy content into the doctrine.

<examples>
<example name="syllabus stub">
```markdown
# Syllabus: the discounted return

## General information
The goal: compute the discounted return of an episode. An agent
that learns a policy tries to maximize this quantity.

## Objectives
1. Given a reward list and a discount factor, compute the return
   by hand.
2. Write a function that computes the return in one pass.

## Resources
- Sutton and Barto, Reinforcement Learning, 2nd ed., sections 3.2
  and 3.3 (held in zwiki).
```
</example>

<example name="topic graph: two nodes and one requires edge, JSONL">
```jsonl
{"id": "reward-signal", "topic": "Reward signal", "proposition": "At each step the environment gives the agent one scalar reward.", "cite": "Sutton and Barto 2nd ed., section 3.2"}
{"id": "discounted-return", "topic": "Discounted return", "proposition": "The return is the sum of the future rewards, each multiplied by gamma to the power of its delay.", "cite": "Sutton and Barto 2nd ed., section 3.3"}
{"type": "requires", "from": "reward-signal", "to": "discounted-return"}
```
The edge reads: the person must hold `reward-signal` before
`discounted-return`.
</example>

<example name="skeleton with one hole and its XFAIL hole test">
```python
# lesson.py, on the branch lesson-discounted-return
def discounted_return(rewards, gamma):
    """Return G_0 for a list of rewards.

    HOLE 1: G_t = r_t + gamma * G_(t+1). In which order must
    the loop visit the rewards, so that one pass is enough?
    """
    # HOLE 1: write the loop.
    raise NotImplementedError("HOLE 1")
```
```python
# test_lesson.py
import pytest
from lesson import discounted_return

# XFAIL while HOLE 1 is open. An incorrect fill raises
# AssertionError, not NotImplementedError, so the test fails.
@pytest.mark.xfail(raises=NotImplementedError, reason="HOLE 1 open")
def test_hole_1_discounted_return():
    assert discounted_return([1.0, 1.0, 1.0], 0.5) == 1.75
```
</example>
</examples>

## Host mechanics

The two hosts share the doctrine and the course state. Their
mechanics are different:

- pi: the extension holds the commands and tools. The `graph`
  tool renders inline. The rex skill can open a Rex pane for the
  graph and for the open lesson files.
- Claude Code: the mod holds scripts and hooks. The graph renders
  when the person asks for it, through the kitty image protocol,
  or in a Rex pane.

The person decides each mechanic that sets a precedent. Put the question to the person.
Do not restate doctrine for each host; doctrine is one layer. A
restated rule drifts, and then the two hosts teach different
methods.

## Layout

```
zteacher/
  docs/          doctrine, one file for one doctrine
  extension/     pi extension
  claude-mod/    Claude Code mod
  examples/      a sample .zteacher/ course state
  AGENTS.md      conventions, workflow, and doctrine pointers
```

## References

Read each source before the phase that names it. Do not skip the
reads. The doctrine quality comes from them.

<references>
- LearnHarness theory:
  `/Applications/LearnHarness.app/Contents/Resources/server/standalone/docs/teaching-methodology.md`
- LearnHarness system prompts:
  `/Applications/LearnHarness.app/Contents/Resources/server/standalone/src/agent/prompts/`,
  folders `prober/`, `teacher/`, and `shared/`.
- The syllabus shape:
  `https://omscs.gatech.edu/sites/default/files/documents/Syllabi/CS%207642%202025-3.pdf`.
  The text layer of this PDF has errors. Use `General
  information`, `Objectives`, and `Resources` as the part names.
  Get the part shape from the drone-rl-gym lesson plan, which
  follows it.
- The drone-rl-gym lesson pattern:
  `~/code/drone-rl-gym/AGENTS.md` and
  `~/code/drone-rl-gym/docs/_scratch/lesson-plan.md`.
- The pi extension and skills docs:
  `/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/docs/`:
  `extensions.md`, `skills.md`, and `docs/tui.md` for inline
  graphics.
- The zwiki layout: `~/code/zwiki/` holds the wiki; its
  conventions sit in `AGENTS.md`.
</references>

## Constraints

<constraints>
- Each document you write follows the unslop skill. Operate its STE
  check, and supply the document only on exit status 0.
- The course state stays host-neutral: no files in `.zteacher/`
  name a host. Each host reads the same state, and a host name
  ties the course to one host.
- The teacher tools make no network calls. The tools must work
  offline and send no project data out.
- The git workflow of zteacher: one worktree for each task, a commit
  gate, and fast forward merges only. Fast forward merges keep the
  history linear, so each merge is one clear step.
</constraints>
