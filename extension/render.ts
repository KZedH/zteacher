// Graph rendering for the zteacher teacher. Pure Node: no pi
// imports, no network. The module reads the course state, draws
// the topic graph, and encodes a PNG.

import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- font

// A 5x5 bitmap font, one glyph = 5 bytes, one byte per row.
// Bit 4 (0x10) is the leftmost column of the glyph.

const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x1f, 0x11, 0x11],
  B: [0x1e, 0x11, 0x1e, 0x11, 0x1e],
  C: [0x0f, 0x10, 0x10, 0x10, 0x0f],
  D: [0x1e, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x1e, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x1e, 0x10, 0x10],
  G: [0x0f, 0x10, 0x13, 0x11, 0x0f],
  H: [0x11, 0x11, 0x1f, 0x11, 0x11],
  I: [0x1f, 0x04, 0x04, 0x04, 0x1f],
  J: [0x01, 0x01, 0x01, 0x11, 0x0e],
  K: [0x11, 0x12, 0x1c, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x1e, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x15, 0x0e],
  R: [0x1e, 0x11, 0x1e, 0x12, 0x11],
  S: [0x0f, 0x10, 0x0e, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x15, 0x1b, 0x11],
  X: [0x11, 0x0a, 0x04, 0x0a, 0x11],
  Y: [0x11, 0x0a, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x13, 0x15, 0x19, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x0e],
  "2": [0x1e, 0x01, 0x0e, 0x10, 0x1f],
  "3": [0x1e, 0x01, 0x0e, 0x01, 0x1e],
  "4": [0x12, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x1e],
  "6": [0x0e, 0x10, 0x1e, 0x11, 0x0e],
  "7": [0x1f, 0x02, 0x04, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x0e, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x0f, 0x01, 0x0e],
  "-": [0x00, 0x00, 0x0e, 0x00, 0x00],
  ".": [0x00, 0x00, 0x00, 0x00, 0x04],
  ":": [0x00, 0x04, 0x00, 0x04, 0x00],
  "_": [0x00, 0x00, 0x00, 0x00, 0x1f],
  "/": [0x01, 0x02, 0x04, 0x08, 0x10],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00],
};

const GLYPH_W = 5;
const GLYPH_H = 5;

// ---------------------------------------------------------------- PNG

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crcInput = Buffer.concat([Buffer.from(type, "ascii"), data]);
  out.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return out;
}

function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- canvas

type RGBA = [number, number, number, number];

class Canvas {
  width: number;
  height: number;
  px: Uint8Array;

  constructor(width: number, height: number, bg: RGBA) {
    this.width = width;
    this.height = height;
    this.px = new Uint8Array(width * height * 4);
    this.fillRect(0, 0, width, height, bg);
  }

  set(x: number, y: number, c: RGBA): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
    this.px[i + 3] = c[3];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.set(xx, yy, c);
      }
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let xx = x; xx < x + w; xx++) {
      this.set(xx, y, c);
      this.set(xx, y + h - 1, c);
    }
    for (let yy = y; yy < y + h; yy++) {
      this.set(x, yy, c);
      this.set(x + w - 1, yy, c);
    }
  }

  hLine(x1: number, x2: number, y: number, c: RGBA): void {
    if (x1 > x2) [x1, x2] = [x2, x1];
    for (let x = x1; x <= x2; x++) this.set(x, y, c);
  }

  vLine(x: number, y1: number, y2: number, c: RGBA): void {
    if (y1 > y2) [y1, y2] = [y2, y1];
    for (let y = y1; y <= y2; y++) this.set(x, y, c);
  }

  text(x: number, y: number, s: string, scale: number, c: RGBA): void {
    let cx = x;
    for (const raw of s.toUpperCase()) {
      const glyph = FONT[raw] ?? FONT["-"];
      for (let row = 0; row < GLYPH_H; row++) {
        for (let col = 0; col < GLYPH_W; col++) {
          if (glyph[row] & (1 << (GLYPH_W - 1 - col))) {
            this.fillRect(cx + col * scale, y + row * scale, scale, scale, c);
          }
        }
      }
      cx += (GLYPH_W + 1) * scale;
    }
  }

  textWidth(s: string, scale: number): number {
    return s.length * (GLYPH_W + 1) * scale;
  }

  png(): Buffer {
    return encodePng(this.width, this.height, this.px);
  }
}

// ---------------------------------------------------------------- model

export interface GraphNode {
  id: string;
  topic: string;
  proposition: string;
  cite: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface CourseGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphInput {
  graph: CourseGraph;
  status: Record<string, string>; // node id -> status
}

// ---------------------------------------------------------------- layout

const COLORS = {
  bg: [30, 30, 46, 255] as RGBA,
  boxFill: [49, 50, 68, 255] as RGBA,
  planned: [108, 112, 134, 255] as RGBA,
  lessonOpen: [235, 203, 139, 255] as RGBA,
  checkPassed: [166, 227, 161, 255] as RGBA,
  text: [205, 214, 244, 255] as RGBA,
  edge: [148, 150, 178, 255] as RGBA,
  title: [137, 180, 250, 255] as RGBA,
};

const SCALE = 2;
const PAD = 6 * SCALE;
const LINE_GAP = 3 * SCALE;
const BOX_GAP_X = 16 * SCALE;
const BOX_GAP_Y = 6 * SCALE;
const MARGIN = 8 * SCALE;
const TITLE_H = 14 * SCALE;

function depthOf(id: string, incoming: Map<string, string[]>): Map<string, number> {
  const memo = new Map<string, number>();
  const visit = (node: string, stack: Set<string>): number => {
    if (memo.has(node)) return memo.get(node)!;
    if (stack.has(node)) return 0; // cycle guard
    stack.add(node);
    const sources = incoming.get(node) ?? [];
    const d = sources.length === 0 ? 0 : 1 + Math.max(...sources.map((s) => visit(s, stack)));
    stack.delete(node);
    memo.set(node, d);
    return d;
  };
  for (const node of incoming.keys()) visit(node, new Set());
  return memo;
}

export function renderGraph(input: GraphInput): Buffer {
  const { graph, status } = input;
  const nodes = graph.nodes;
  const edges = graph.edges;

  const incoming = new Map<string, string[]>();
  for (const n of nodes) incoming.set(n.id, []);
  for (const e of edges) incoming.get(e.to)?.push(e.from);
  const depth = depthOf("", incoming);

  // Column boxes: uniform width, two text lines (id, status).
  let boxW = 0;
  for (const n of nodes) {
    boxW = Math.max(boxW, n.id.length, (status[n.id] ?? "planned").length);
  }
  boxW = boxW * (GLYPH_W + 1) * SCALE + PAD * 2;
  const lineH = GLYPH_H * SCALE;
  const boxH = lineH * 2 + LINE_GAP + PAD * 2;

  const columns = new Map<number, string[]>();
  let maxDepth = 0;
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    maxDepth = Math.max(maxDepth, d);
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(n.id);
  }

  const pos = new Map<string, { x: number; y: number }>();
  let maxColumnH = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const col = columns.get(d) ?? [];
    const x = MARGIN + d * (boxW + BOX_GAP_X);
    let y = MARGIN + TITLE_H;
    for (const id of col) {
      pos.set(id, { x, y });
      y += boxH + BOX_GAP_Y;
    }
    maxColumnH = Math.max(maxColumnH, col.length * (boxH + BOX_GAP_Y));
  }

  const width = MARGIN * 2 + (maxDepth + 1) * boxW + maxDepth * BOX_GAP_X;
  const height = MARGIN * 2 + TITLE_H + maxColumnH;
  const canvas = new Canvas(width, height, COLORS.bg);

  canvas.text(MARGIN, MARGIN, "TOPIC GRAPH", SCALE, COLORS.title);

  const borderOf = (id: string): RGBA => {
    const s = status[id] ?? "planned";
    if (s === "check-passed") return COLORS.checkPassed;
    if (s === "lesson-open") return COLORS.lessonOpen;
    return COLORS.planned;
  };

  for (const n of nodes) {
    const p = pos.get(n.id)!;
    canvas.fillRect(p.x, p.y, boxW, boxH, COLORS.boxFill);
    canvas.strokeRect(p.x, p.y, boxW, boxH, borderOf(n.id));
    const textX = p.x + PAD;
    const textY = p.y + PAD;
    canvas.text(textX, textY, n.id, SCALE, COLORS.text);
    canvas.text(textX, textY + lineH + LINE_GAP, status[n.id] ?? "planned", SCALE, borderOf(n.id));
  }

  for (const e of edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const ax = a.x + boxW;
    const ay = a.y + Math.floor(boxH / 2);
    const bx = b.x - 1;
    const by = b.y + Math.floor(boxH / 2);
    const midX = ax + Math.floor((bx - ax) / 2);
    canvas.hLine(ax, midX, ay, COLORS.edge);
    canvas.vLine(midX, ay, by, COLORS.edge);
    canvas.hLine(midX, bx, by, COLORS.edge);
    // Arrowhead at the target box, pointing right.
    for (let i = 0; i < 4 * SCALE; i++) {
      canvas.set(bx - i, by - Math.floor(i / 2), COLORS.edge);
      canvas.set(bx - i, by + Math.floor(i / 2), COLORS.edge);
    }
  }

  return canvas.png();
}

// ---------------------------------------------------------------- text

export function graphText(input: GraphInput): string {
  const { graph, status } = input;
  const lines: string[] = [];
  lines.push(`Topic graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
  lines.push("");
  lines.push("Nodes:");
  for (const n of graph.nodes) {
    const s = status[n.id] ?? "planned";
    lines.push(`- ${n.id} [${s}] ${n.topic}: ${n.proposition} (${n.cite})`);
  }
  lines.push("");
  lines.push("Edges:");
  for (const e of graph.edges) {
    lines.push(`- ${e.from} requires ${e.to}`);
  }
  lines.push("");
  lines.push("Mermaid:");
  lines.push("```mermaid");
  lines.push("graph TD");
  for (const e of graph.edges) {
    lines.push(`  ${e.from} --> ${e.to}`);
  }
  lines.push("```");
  return lines.join("\n");
}
