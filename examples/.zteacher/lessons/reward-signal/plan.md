# Lesson: Reward signal

Node: reward-signal
Branch: lesson-reward-signal
Worktree: /Users/learner/code/toy-rl-lesson-reward-signal

## Goal
Run one episode of a toy environment and collect the reward of each
step in a list.

## Facts
- The toy environment has `reset()` and `step(action)`. `step`
  returns `(reward, done)`. Examined 2026-11-22.

## Holes
1. HOLE 1: when the episode loop stops, in lesson.py

## Done when
`pytest test_lesson.py -v` shows that each hole test passes, and the
check of the lesson passes.

## Result
2026-11-22: check passed. 2 of 2 hole tests pass. Merged to main.
