/**
 * zteacher pi extension.
 *
 * /teacher arms or disarms the teacher in the current project. The armed
 * state is the file <project>/.pi/zteacher.json. Armed, the extension:
 * - adds the zteacher skills (skills/), which load the doctrine in ../docs/,
 * - adds a system prompt section with the voice doctrine and the doctrine path,
 * - activates the `graph` and `progress` tools.
 * Disarmed, pi runs as an ordinary coding agent. The course state in
 * .zteacher/ stays.
 *
 * The tools read local files and run local programs only. They make no
 * network calls.
 */

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, "docs");
const SKILLS = join(ROOT, "extension", "skills");
const TOOLS = ["graph", "progress"];
const CHROME = [
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/Applications/Chromium.app/Contents/MacOS/Chromium",
];

function armFile(cwd: string): string {
	return join(cwd, CONFIG_DIR_NAME, "zteacher.json");
}

function isArmed(cwd: string): boolean {
	return existsSync(armFile(cwd));
}

function arm(cwd: string): void {
	mkdirSync(dirname(armFile(cwd)), { recursive: true });
	writeFileSync(armFile(cwd), `${JSON.stringify({ armed: true }, null, "\t")}\n`, "utf8");
}

function disarm(cwd: string): void {
	rmSync(armFile(cwd), { force: true });
	const dir = dirname(armFile(cwd));
	if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
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

type Node = { id: string; topic: string; proposition: string; cite: string };
type Edge = { type: string; from: string; to: string };

function readGraph(cwd: string): { nodes: Node[]; edges: Edge[] } {
	const path = join(cwd, ".zteacher", "graph.jsonl");
	if (!existsSync(path)) throw new Error(`No topic graph: ${path} does not exist.`);
	const nodes: Node[] = [];
	const edges: Edge[] = [];
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
			if ("id" in item) nodes.push(item as Node);
			else edges.push(item as Edge);
		});
	const ids = new Set(nodes.map((n) => n.id));
	for (const e of edges) {
		if (e.type !== "requires") throw new Error(`Edge ${e.from} -> ${e.to} has the type ${e.type}, not requires.`);
		if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`Edge ${e.from} -> ${e.to} names a node that is not in the graph.`);
	}
	return { nodes, edges };
}

function mermaid(nodes: Node[], edges: Edge[]): string {
	const key = new Map(nodes.map((n, i) => [n.id, `n${i}`]));
	const label = (s: string) => s.replace(/"/g, "#quot;");
	return [
		"graph TD",
		...nodes.map((n) => `  ${key.get(n.id)}["${label(n.topic)}<br/><small>${label(n.id)}</small>"]`),
		...edges.map((e) => `  ${key.get(e.from)} --> ${key.get(e.to)}`),
	].join("\n");
}

export default function (pi: ExtensionAPI) {
	function setTools(ctx: ExtensionContext): void {
		const others = pi.getActiveTools().filter((t) => !TOOLS.includes(t));
		pi.setActiveTools(isArmed(ctx.cwd) ? [...others, ...TOOLS] : others);
	}

	pi.on("session_start", async (_event, ctx) => {
		setTools(ctx);
		if (isArmed(ctx.cwd)) ctx.ui.setStatus("zteacher", "teacher armed");
	});

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
		description: "Render the topic graph of .zteacher/graph.jsonl as an image, inline in the terminal.",
		promptSnippet: "Show the zteacher topic graph inline",
		promptGuidelines: ["Use graph to show the zteacher topic graph to the learner."],
		parameters: Type.Object({}),
		defaultActive: false,
		async execute(_id, _params, signal, _onUpdate, ctx) {
			const { nodes, edges } = readGraph(ctx.cwd);
			const work = mkdtempSync(join(tmpdir(), "zteacher-graph-"));
			try {
				const input = join(work, "graph.mmd");
				const output = join(work, "graph.png");
				const config = join(work, "puppeteer.json");
				const chrome = CHROME.find((c) => existsSync(c));
				writeFileSync(input, mermaid(nodes, edges), "utf8");
				writeFileSync(config, JSON.stringify(chrome ? { executablePath: chrome, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] }));
				const run = await pi.exec("mmdc", ["-i", input, "-o", output, "-p", config, "-s", "2", "-b", "white"], {
					signal,
					timeout: 120_000,
				});
				if (run.code !== 0 || !existsSync(output)) {
					throw new Error(`mmdc did not render the graph (exit ${run.code}):\n${run.stderr || run.stdout}`);
				}
				return {
					content: [
						{ type: "text", text: `Topic graph: ${nodes.length} nodes, ${edges.length} requires edges.` },
						{ type: "image", data: readFileSync(output).toString("base64"), mimeType: "image/png" },
					],
					details: { nodes: nodes.length, edges: edges.length },
				};
			} finally {
				rmSync(work, { recursive: true, force: true });
			}
		},
	});

	pi.registerTool({
		name: "progress",
		label: "Course progress",
		description: "Print the course state of .zteacher/progress.md: the status of each node and the log.",
		promptSnippet: "Print the zteacher course progress",
		parameters: Type.Object({}),
		defaultActive: false,
		async execute(_id, _params, _signal, _onUpdate, ctx) {
			const path = join(ctx.cwd, ".zteacher", "progress.md");
			if (!existsSync(path)) throw new Error(`No progress file: ${path} does not exist.`);
			const text = readFileSync(path, "utf8");
			return { content: [{ type: "text", text }], details: { path } };
		},
	});
}
