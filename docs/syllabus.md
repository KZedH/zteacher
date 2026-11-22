# Syllabus

This document gives the rules for the syllabus: the first file of a
course. The syllabus says what the learner wants to hold at the
end of the course, and which material the course uses.

Sources:

- The CS 7642 Reinforcement Learning syllabus of Georgia Tech, for
  Fall 2025. Its parts `General Information`, `Objectives`, and
  `Resources` give the part names.
- The `Goal` and `Skills` parts of
  `~/code/drone-rl-gym/docs/_scratch/lesson-plan.md` give the part
  shape.
- LearnHarness `src/agent/prompts/prober/10-probe-doctrine.md`,
  section 2.

## When to write it

Write the syllabus first, before the probe and before the topic
graph. The probe and the graph start from the objectives (see
[probe.md](probe.md) and [graph.md](graph.md)).

The learner gives one goal, frequently in one sentence. Write the
syllabus from that goal.

## The file

The file is `.zteacher/syllabus.md`. It has a title and three
parts, in this order:

```markdown
# Syllabus: <the goal, in a few words>

## General information
## Objectives
## Resources
```

### General information

Write a short paragraph. Name the goal. Say why the goal is worth
the work: what the learner can do when the course is complete.

### Objectives

An objective is a measurable condition that the learner will
hold at the end of the course. Write each objective as a task
that the learner can do. Then a test can show that the learner
holds it. For example, this is an objective:
`Write a function that computes the return in one pass`.
This is not an objective, because no test can show it:
`Understand returns`.

A goal such as "learn reinforcement learning" can mean many
different courses. Give the learner questions until each
objective is concrete. Give the questions one at a time, as the
probe does (see [probe.md](probe.md), rule 1). Agree each
objective with the learner, then write it. Give the
objectives as a numbered series.

### Resources

A resource is a source that holds the material of the course:
a book, a paper, or a set of documents. The nodes of the topic
graph cite sections of these resources.

1. Examine the zwiki wiki in `~/code/zwiki/` for the material of
   each objective.
2. If zwiki holds a resource, write it in the syllabus with the path of
   its zwiki page.
3. If zwiki does not hold a resource, add it to zwiki first. Obey
   the rules of `~/code/zwiki/AGENTS.md` to add it. Then write it
   in the syllabus.

Thus zwiki stays the one source of course material. Write each
resource on one line. Give its title, its edition, the sections
that the course uses, and its zwiki path.

The agent finds, reads, and selects the resources, not the
learner. The rule for logistics is in [lesson.md](lesson.md), part
`What a lesson is`.
