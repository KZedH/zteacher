# Probe

This document gives the rules for the probe. The probe measures
what the learner holds before the course draws its topic graph.
The graph starts from the probe result, so a vague probe gives an
incorrect graph.

Sources: LearnHarness `src/agent/prompts/prober/10-probe-doctrine.md`,
sections 1, 3, and 4; `docs/teaching-methodology.md`, sections 1 and
10, item 1; `src/agent/prompts/shared/25-confidence.md`.

## Terms

- A held fact is a fact that the learner accepts as obviously
  correct. The course builds only on held facts.
- A strand is one area of material that is necessary for the
  objectives. Find the strands from the objectives of the
  syllabus. For each objective, find the answer: which material
  must the learner hold first?
- The edge of a strand is the limit of what the learner holds in
  that strand.
- The floor of a strand is a question that the learner answers
  correctly, with confidence.
- The ceiling of a strand is a question that the learner answers
  incorrectly, or does not know.

The probe brackets the edge of each strand between a floor and a
ceiling. The bracket is complete when the floor and the ceiling
are near each other.

## When to probe

Probe after the syllabus holds its objectives, and before the
topic graph. Probe again when a lesson shows that the graph is
incorrect about the learner (see [graph.md](graph.md)).

Before the first question, read each earlier probe file in
`.zteacher/`. Do not probe again a strand that an earlier probe
bracketed, unless a lesson showed a change.

## How to probe

1. Give one question in each message. Then stop, and let the
   learner answer.
2. Tell the learner to give the reasoning with the answer, and a
   confidence from 0 to 100 percent. The reasoning shows the
   model that the learner uses. One answer is only one data point.
3. Start each strand near the top: near the hardest fact that is
   necessary for the objectives. An adult who reaches for advanced
   material usually holds the basics. A miss moves the next
   question down.
4. Use each strand to calibrate the next strand. When the learner
   is strong in one strand, start the related strands high too.
5. Select the next question from the last answer:
   - Correct, with high confidence: move up by a large step. A
     large step saves questions.
   - Correct, with low confidence: move up by a small step. Write
     down where the learner is not sure.
   - Incorrect: the ceiling moves down. Give questions between the
     floor and the new ceiling, until the edge is narrow.
   - Incorrect, with high confidence: this is a misconception.
     Find all of its effects before you go to the next strand.
6. Do not use one miss as a verdict. One answer cannot show the
   cause of a miss: an accident, a missing fact, or a
   misconception. Give a second question near the first to find
   the cause.
7. When a strand does not break, continue up until the learner
   misses. A strand with no ceiling is not bracketed.

Each question must move an edge. Do not give a question that the
last answer settled. Do not give a question below a floor
that the probe found.

When the learner names a file, read the file. Do not tell the
learner to copy its text into the message. The probe measures the
material of the learner, not a description of it.

## The file

When each strand has a floor and a ceiling, write the result to
`.zteacher/probe-<YYYY-MM-DD>.md`. The date is the day of the
probe. Write one part for each strand:

```markdown
# Probe: <YYYY-MM-DD>

Objectives: <the numbers of the syllabus objectives that this probe measured>

## <strand name>

- Floor: <the question that the learner answered correctly, and the answer>
- Ceiling: <the question that the learner missed, and the answer>
- Misconceptions: <each incorrect model that the answers showed, or "none">
- Start from: <the held fact that the first lesson of this strand can use>
```

The topic graph uses the `Start from` line of each strand to find
the held facts. The graph prunes each node that the learner holds.
