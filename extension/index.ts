/**
 * zteacher pi extension.
 *
 * /teacher arms or disarms the teacher in the current project. The armed
 * state is the marker file <project>/.zteacher/armed (host-neutral; both
 * hosts read the same marker). Armed, the extension:
 * - adds the four skills (skills/), which load the doctrine in ../docs/,
 * - adds a system prompt section with the voice doctrine and the doctrine path,
 * - activates the `graph` and `progress` tools.
 * Disarmed, pi runs as an ordinary coding agent. The course state in
 * .zteacher/ stays.
 *
 * The tools read local files only. They make no network calls. The graph
 * renderer is pure Node (render.ts): no Chrome, no npm dependency.
 */

import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Container, Image, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import {
	graphText,
	renderGraph,
	type CourseGraph,
	type GraphEdge,
	type GraphNode,
} from "./render.ts";

const HERE = fileURLToPath(import.meta.url);
const DOCS = join(HERE, "..", "..", "docs");
const SKILLS = join(HERE, "..", "skills");
const TOOLS = ["graph", "progress"];

function armedMarker(cwd: string): string {
	return join(cwd, ".zteacher", "armed");
}

function isArmed(cwd: string): boolean {
	return existsSync(armedMarker(cwd));
}

function arm(cwd: string): void {
	mkdirSync(join(cwd, ".zteacher"), { recursive: true });
	writeFileSync(armedMarker(cwd), "teacher armed");
}

function disarm(cwd: string): void {
	rmSync(armedMarker(cwd), { force: true });
}

function segment(): string {
	return [
		"zteacher is armed in this project. You teach a course to the learner.",
		`The doctrine is in ${DOCS}/: syllabus.md, probe.md, graph.md, lesson.md, and voice.md.`,
		"The course state is in .zteacher/ of the project. The doctrine gives the format of each file.",
		"Before each step of the course, read its skill: zteacher-syllabus, zteacher-probe, zteacher-graph, or zteacher-lesson.",
		"The `graph` tool shows the topic graph. The `progress` tool prints `.zteacher/progress.md`.",
		"These voice rules apply to each message:",
		"",
		readFileSync(join(DOCS, "voice.md"), "utf8"),
	].join("\n");
}

// Course state ----------------------------------------------------------

function readGraph(cwd: string): CourseGraph {
	const path = join(cwd, ".zteacher", "graph.jsonl");
	if (!existsSync(path)) throw new Error(`No topic graph: ${path} does not exist. Write the syllabus and the graph first.`);
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	readFileSync(path, "utf8")
		.split("\n")
		.forEach((line, index) => {
			if (!line.trim()) return;
			let item: Record<string, unknown>;
			try {
				item = JSON.parse(line);
			} catch {
				throw new Error(`graph.jsonl line ${index + 1} is not JSON.`);
			}
			if ("id" in item) nodes.push(item as unknown as GraphNode);
			else edges.push(item as unknown as GraphEdge);
		});
	const ids = new Set(nodes.map((n) => n.id));
	for (const e of edges) {
		if (e.type !== "requires") throw new Error(`Edge ${e.from} -> ${e.to} has the type ${String(e.type)}, not requires.`);
		if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`Edge ${e.from} -> ${e.to} names a node that the graph does not hold.`);
	}
	return { nodes, edges };
}

function readStatus(cwd: string): Record<string, string> {
	const path = join(cwd, ".zteacher", "progress.md");
	const status: Record<string, string> = {};
	if (!existsSync(path)) return status;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		const name = /([a-z0-9-]+)\s*\|\s*(planned|lesson-open|check-passed)/.exec(line);
		if (name) status[name[1]] = name[2];
	}
	return status;
}

// Teacher tools --------------------------------------------------------

function setTools(pi: ExtensionAPI, cwd: string): void {
	const others = pi.getActiveTools().filter((name) => !TOOLS.includes(name));
	pi.setActiveTools(isArmed(cwd) ? [...others, ...TOOLS] : others);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		setTools(pi, ctx.cwd);
		if (isArmed(ctx.cwd)) ctx.ui.setStatus("zteacher", "teacher armed");
	});

	// The skills load only in an armed project, so the doctrine
	// reaches the agent only when the teacher is on.
	pi.on("resources_discover", async (event) => {
		return isArmed(event.cwd) ? { skillPaths: [SKILLS] } : {};
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!isArmed(ctx.cwd)) return;
		event.systemPromptOptions.sections.zteacher = segment();
	});

	pi.registerCommand("teacher", {
		description: "Arm or disarm the zteacher teacher in this project",
		handler: async (_args, ctx) => {
			if (isArmed(ctx.cwd)) {
				disarm(ctx.cwd);
				ctx.ui.notify("zteacher disarmed. The course state in .zteacher/ stays.", "info");
			} else {
				arm(ctx.cwd);
				ctx.ui.notify("zteacher armed.", "info");
			}
			await ctx.reload();
			return;
		},
	});

	pi.registerTool({
		name: "graph",
		label: "Topic graph",
		description:
			"Show the topic graph of the course: each node, its status, and the requires edges. Renders the graph as a PNG inline in the terminal.",
		promptSnippet: "Show the zteacher topic graph inline",
		promptGuidelines: ["Use graph to show the zteacher topic graph to the learner."],
		parameters: Type.Object({}),
		defaultActive: false,
		async execute(_id, _params, _signal, _onUpdate, ctx) {
			const graph = readGraph(ctx.cwd);
			const status = readStatus(ctx.cwd);
			const png = renderGraph({ graph, status });
			return {
				content: [{ type: "text", text: graphText({ graph, status }) }],
				details: {
					png: png.toString("base64"),
					nodes: graph.nodes.length,
					edges: graph.edges.length,
				},
			};
		},
		renderResult(result, _options, theme) {
			const container = new Container();
			const caption = new Text("", 0, 0);
			caption.setText(theme.fg("success", `Topic graph: ${result.details.nodes} nodes, ${result.details.edges} edges`));
			container.addChild(caption);
			if (result.details.png) {
				container.addChild(
					new Image(result.details.png, "image/png", {
						fallbackColor: (s: string) => theme.fg("muted", s),
					}),
				);
			}
			return container;
		},
	});

	pi.registerTool({
		name: "progress",
		label: "Course progress",
		description: "Print the course state of .zteacher/progress.md: the status of each node and the log.",
		promptSnippet: "Print the zteacher course progress",
		parameters: Type.Object({}),
		defaultActive: false,
		async execute(_id, _params, _onUpdate, ctx) {
			const path = join(ctx.cwd, ".zteacher", "progress.md");
			if (!existsSync(path)) throw new Error(`No progress file: ${path} does not exist.`);
			const text = readFileSync(path, "utf8");
			return { content: [{ type: "text", text }], details: { path, status: readStatus(ctx.cwd) } };
		},
	});
}
