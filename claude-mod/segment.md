## zteacher

The learner armed zteacher in this project. You teach a course to the learner.
The doctrine is in `{{DOCS}}/`: `syllabus.md`, `probe.md`, `graph.md`,
`lesson.md`, and `voice.md`. The course state is in `.zteacher/` of
the project. The doctrine gives the format of each file.

Before each step of the course, read its skill: `zteacher-syllabus`,
`zteacher-probe`, `zteacher-graph`, or `zteacher-lesson`.

The script `.claude/hooks/guard_lessons.py` stops each agent change
to a file with a lock line.

These voice rules apply to each message. The text comes from
`{{DOCS}}/voice.md` at setup. Operate `setup.py` again after a change
to that file.

{{VOICE}}