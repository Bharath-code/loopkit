/**
 * Loop log frontmatter parser.
 *
 * As of v0.2.0, loop logs are written with YAML frontmatter so analytics
 * modules can read structured fields without brittle regex. Old logs (without
 * frontmatter) still work — the parser falls back to regex extraction.
 *
 * Frontmatter format:
 * ---
 * week: 23
 * date: 2026-06-12
 * project: proposalai
 * tasksCompleted: 4
 * tasksTotal: 5
 * shippingScore: 80
 * loopkitScore: 74
 * streak: 6
 * override: false
 * tension: null
 * ---
 *
 * We deliberately implement a minimal parser (no external deps) since the
 * shape is fixed and known. If you need to add a field, also update the
 * schema in this file.
 */

export interface LoopLogFrontmatter {
  week: number;
  date: string;
  project: string;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
  loopkitScore: number | null;
  streak: number | null;
  override: boolean;
  tension: string | null;
}

export interface ParsedLoopLog {
  frontmatter: LoopLogFrontmatter | null;
  body: string;
  /** True if we extracted via regex fallback (old log format) */
  isLegacy: boolean;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseFrontmatterBlock(block: string): Partial<LoopLogFrontmatter> {
  const out: Record<string, unknown> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    const value = raw.trim();

    if (value === "" || value === "null") {
      out[key] = null;
    } else if (value === "true") {
      out[key] = true;
    } else if (value === "false") {
      out[key] = false;
    } else if (/^-?\d+$/.test(value)) {
      out[key] = parseInt(value, 10);
    } else {
      out[key] = value;
    }
  }
  return out as Partial<LoopLogFrontmatter>;
}

function legacyExtract(content: string): Partial<LoopLogFrontmatter> {
  const get = (re: RegExp): string | null => content.match(re)?.[1]?.trim() ?? null;
  const numOrNull = (re: RegExp): number | null => {
    const v = get(re);
    if (v === null) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  };

  return {
    week: numOrNull(/# Week (\d+)/) ?? 0,
    date: get(/Week \d+ — (\d{4}-\d{2}-\d{2})/) ?? "",
    project: get(/\| project:([^\n|]+)/) ?? "",
    tasksCompleted: numOrNull(/- Tasks completed:\s*(\d+)/) ?? 0,
    tasksTotal:
      (numOrNull(/- Tasks completed:\s*(\d+)/) ?? 0) +
      (numOrNull(/- Tasks open:\s*(\d+)/) ?? 0),
    shippingScore: numOrNull(/- Shipping score:\s*(\d+)%/i) ?? 0,
    loopkitScore: numOrNull(/- LoopKit Score:\s*(\d+)/i) ?? numOrNull(/\*\*LoopKit Score:\*\*\s*(\d+)/i),
    override: /_Override:/.test(content),
    tension: get(/\*\*Tension:\*\*\s*([^\n]+)/),
  };
}

/**
 * Parse a loop log's content into structured frontmatter + body.
 * If the content lacks frontmatter, falls back to regex extraction
 * and marks the result as legacy.
 */
export function parseLoopLog(content: string): ParsedLoopLog {
  const match = content.match(FRONTMATTER_RE);
  if (match) {
    const parsed = parseFrontmatterBlock(match[1]);
    const body = content.slice(match[0].length);
    const fm: LoopLogFrontmatter = {
      week: parsed.week ?? 0,
      date: parsed.date ?? "",
      project: parsed.project ?? "",
      tasksCompleted: parsed.tasksCompleted ?? 0,
      tasksTotal: parsed.tasksTotal ?? 0,
      shippingScore: parsed.shippingScore ?? 0,
      loopkitScore: parsed.loopkitScore ?? null,
      streak: parsed.streak ?? null,
      override: parsed.override ?? false,
      tension: parsed.tension ?? null,
    };
    return { frontmatter: fm, body, isLegacy: false };
  }

  // Fallback: legacy log without frontmatter
  const legacy = legacyExtract(content);
  return {
    frontmatter: {
      week: legacy.week ?? 0,
      date: legacy.date ?? "",
      project: legacy.project ?? "",
      tasksCompleted: legacy.tasksCompleted ?? 0,
      tasksTotal: legacy.tasksTotal ?? 0,
      shippingScore: legacy.shippingScore ?? 0,
      loopkitScore: legacy.loopkitScore ?? null,
      streak: legacy.streak ?? null,
      override: legacy.override ?? false,
      tension: legacy.tension ?? null,
    },
    body: content,
    isLegacy: true,
  };
}

/**
 * Build a YAML frontmatter block from a structured object.
 * Used by saveLoopLog.
 */
export function buildFrontmatter(fm: Partial<LoopLogFrontmatter>): string {
  const lines = ["---"];
  const keys: (keyof LoopLogFrontmatter)[] = [
    "week",
    "date",
    "project",
    "tasksCompleted",
    "tasksTotal",
    "shippingScore",
    "loopkitScore",
    "streak",
    "override",
    "tension",
  ];
  for (const k of keys) {
    const v = fm[k];
    if (v === null || v === undefined) {
      lines.push(`${k}: null`);
    } else if (typeof v === "string") {
      lines.push(`${k}: ${v}`);
    } else if (typeof v === "boolean") {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}
