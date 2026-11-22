# Topic graph

This document gives the rules for the topic graph. The topic graph
is the plan of the course: the facts that the course teaches, and
the sequence that the facts must follow.

Sources: LearnHarness `docs/teaching-methodology.md`, sections 3, 4,
6, and 7b; `src/agent/prompts/teacher/10-planning.md`, all parts;
`src/agent/prompts/teacher/05-method.md`, principle i.

## Nodes and edges

Knowledge is a graph. Each node is one proposition: a fact that
a person can say in one sentence and can examine. Each edge is a
connection between two propositions.

A node has four fields:

- `id`: the slug of the node. Use only the characters `a-z`, `0-9`,
  and `-`. Select the slug one time. Do not change it, because the
  lesson branches and `progress.md` use it.
- `topic`: the name of the topic, in two to five words.
- `proposition`: the fact, in one sentence.
- `cite`: the section of a resource that develops the fact.

An edge has three fields:

- `type`: always `requires`.
- `from`: the `id` of the node that the learner must hold first.
- `to`: the `id` of the node that requires it.

The two ends of each edge must be nodes of the graph. The graph
must have no loop.

A topological order is a sequence of all the nodes in which each
node comes after each node that it requires.

## Cite the resources

Make the graph from the resources of the syllabus, not from the
syllabus alone. Read each section before you write a node that
cites it.

Write each `cite` as the title of a resource of the syllabus,
then the section: `Sutton and Barto 2nd ed., section 3.3`. The
cite must name a resource that the `Resources` part of the
syllabus holds.

## The minimal tree

The graph is the minimal tree. It is the smallest set of nodes
and edges that goes from what the learner holds to the
objectives.

- Do not put in a node that the learner holds. The `Start from`
  lines of the probe file give the held facts (see
  [probe.md](probe.md)).
- Do not put in a node that is not on a path to an objective.
  This rule applies also when the topic is of interest.
- Use the shortest path to each objective that the material
  permits.

## The roots

A root is a node that requires no other node. Each root must be
one of these:

- A fact that the learner holds, from the probe.
- A fact that the learner can accept as stated, with no caveat.
  A definition or a statement about all members of a set is a
  good root, for example "all communication between computers
  goes through packets".

Examine each root before you show the graph. If a root follows
from a simpler fact that the learner can accept, put that simpler
fact below it as a new root.

A small number of roots is better than many. When the lessons are complete, the
learner sees each loose fact follow from a small number of root
facts. This change from loose facts to a structure is the payoff
of the course.

## A node is a landmark, not a step

A node is a large unit. One lesson teaches one node (see
[lesson.md](lesson.md)). The reasoning steps of the lesson are its
holes. A node can have one hole or five. Do not divide the
graph into nodes of one step each.

## Agree the graph

Show the graph to the learner before the first lesson. The lessons
follow the graph, so the learner must agree with it first. Wait
for the answer of the learner. If the learner wants a change,
change the graph and show it again.

## Revise the graph

The graph is a hypothesis about the learner, not a contract. The
probe is its first data. Each lesson gives more data.

Change the graph when the data shows that it is incorrect. These
are the changes:

- Add a node when a lesson shows that the learner does not hold a
  fact that the graph uses.
- Remove a node when a lesson shows that the learner holds it.
- Change an edge when the material shows a different dependency.

Do not change the `id` of a node, and do not remove a node that
has a passed check. After a change, show the new graph to the
learner before the next lesson opens.

## The file

The file is `.zteacher/graph.jsonl`. Each line is one JSON object.
A node line has the keys `id`, `topic`, `proposition`, and `cite`.
An edge line has the keys `type`, `from`, and `to`. Write the node
lines first, then the edge lines.

```jsonl
{"id": "reward-signal", "topic": "Reward signal", "proposition": "At each step the environment gives the agent one scalar reward.", "cite": "Sutton and Barto 2nd ed., section 3.2"}
{"id": "discounted-return", "topic": "Discounted return", "proposition": "The return is the sum of the future rewards, each multiplied by gamma to the power of its delay.", "cite": "Sutton and Barto 2nd ed., section 3.3"}
{"type": "requires", "from": "reward-signal", "to": "discounted-return"}
```

The edge reads: the learner must hold `reward-signal` before
`discounted-return`.
