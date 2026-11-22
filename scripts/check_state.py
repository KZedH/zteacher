"""The course state check: one .zteacher/ folder.

    python3 scripts/check_state.py PATH_TO_.zteacher

Exit 0 when the folder holds a valid course state: the syllabus with
its three parts, one or more probe files, a topic graph of nodes and
requires edges that name real nodes, one lesson plan per known node,
a progress file, and no host name in any file.
"""
import json, re, sys
from pathlib import Path

root = Path(sys.argv[1])
errors = []
need = {"syllabus": root / "syllabus.md", "progress": root / "progress.md", "graph": root / "graph.jsonl"}
for name, p in need.items():
    if not p.is_file():
        errors.append(f"missing {p}")
probes = sorted(root.glob("probe-*.md"))
plans = sorted(root.glob("lessons/*/plan.md"))
if not probes: errors.append("no probe-<date>.md")
if not plans: errors.append("no lessons/<id>/plan.md")
for p in probes:
    if not re.fullmatch(r"probe-\d{4}-\d{2}-\d{2}\.md", p.name): errors.append(f"bad probe name {p.name}")
nodes, edges = {}, []
for i, line in enumerate((root / "graph.jsonl").read_text().splitlines(), 1):
    if not line.strip(): continue
    try: obj = json.loads(line)
    except json.JSONDecodeError as e: errors.append(f"graph.jsonl:{i} not JSON: {e}"); continue
    if "id" in obj:
        for k in ("topic", "proposition", "cite"):
            if not obj.get(k): errors.append(f"graph.jsonl:{i} node {obj['id']} lacks {k}")
        if not re.fullmatch(r"[a-z0-9-]+", obj["id"]): errors.append(f"graph.jsonl:{i} bad id")
        nodes[obj["id"]] = obj
    else:
        edges.append((i, obj))
for i, e in edges:
    if e.get("type") != "requires": errors.append(f"graph.jsonl:{i} edge type {e.get('type')}")
    for k in ("from", "to"):
        if e.get(k) not in nodes: errors.append(f"graph.jsonl:{i} edge {k} {e.get(k)} not a node")
for p in plans:
    if p.parent.name not in nodes: errors.append(f"plan {p} names no node")
syl = (root / "syllabus.md").read_text()
for part in ("## General information", "## Objectives", "## Resources"):
    if part not in syl: errors.append(f"syllabus lacks {part}")
hosts = re.compile(r"\b(pi|claude|claude code|codex|anthropic)\b", re.I)
for p in root.rglob("*"):
    if p.is_file() and hosts.search(p.read_text()):
        errors.append(f"{p} names a host: {hosts.search(p.read_text()).group(0)}")
print(f"nodes={len(nodes)} edges={len(edges)} probes={len(probes)} plans={len(plans)}")
print("\n".join(errors) or "OK")
sys.exit(1 if errors else 0)
