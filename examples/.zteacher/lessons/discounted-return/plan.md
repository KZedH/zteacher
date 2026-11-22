# Lesson: Discounted return

Node: discounted-return
Branch: lesson-discounted-return
Worktree: /Users/learner/code/toy-rl-lesson-discounted-return

## Goal
Write a function that gives the discounted return G_0 of a reward
list, in one pass over the list.

## Facts
- G_t = r_t + gamma * G_(t+1), and G is 0 after the last step
  (Sutton and Barto 2nd ed., equation 3.9). Examined 2026-11-22.

## Holes
1. HOLE 1: the order of the loop over the rewards, in lesson.py

## Done when
`pytest test_lesson.py -v` shows that each hole test passes, and the
check of the lesson passes.

## Result
