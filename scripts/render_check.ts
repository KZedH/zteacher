// The render check of scripts/check.sh. Renders the graph of
// examples/.zteacher with the extension renderer and reports the size.
import { readFileSync, writeFileSync } from "node:fs";
import { renderGraph, graphText } from "../extension/render.ts";

const root = new URL("../examples/.zteacher/", import.meta.url).pathname;
const nodes = [];
const edges = [];
for (const line of readFileSync(root + "graph.jsonl", "utf8").split("\n")) {
	if (!line.trim()) continue;
	const item = JSON.parse(line);
	if (item.type === "requires") edges.push(item);
	else nodes.push(item);
}
const status = {};
for (const line of readFileSync(root + "progress.md", "utf8").split("\n")) {
	const name = /([a-z0-9-]+)\s*\|\s*(planned|lesson-open|check-passed)/.exec(line);
	if (name) status[name[1]] = name[2];
}
const input = { graph: { nodes, edges }, status };
const png = renderGraph(input);
writeFileSync("/tmp/zteacher-check-render.png", png);
console.log(`png ${png.length} bytes, ${nodes.length} nodes, ${edges.length} edges`);
console.log(graphText(input).split("\n")[0]);
