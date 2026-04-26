import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {
  type Config,
  type InitAnswers,
  type Brief,
  type Task,
  type ShipLog,
  type LoopLog,
  ConfigSchema,
  slugify,
  formatDate,
} from "@loopkit/shared";

const LOOPKIT_DIR = ".loopkit";

// ─── Token Encryption ───────────────────────────────────────────

const ENCRYPTION_PREFIX = "enc:";

function deriveKey(): Buffer {
  const salt = "loopkit";
  const material = `${os.hostname()}:${os.userInfo().username}:loopkit-salt-v1`;
  return crypto.scryptSync(material, salt, 32);
}

function encryptToken(plain: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return ENCRYPTION_PREFIX + combined.toString("base64");
}

function decryptToken(value: string): string | null {
  if (!value.startsWith(ENCRYPTION_PREFIX)) return value; // plaintext fallback
  try {
    const key = deriveKey();
    const combined = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64");
    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const encrypted = combined.subarray(32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    return null;
  }
}

// ─── Path Resolvers ─────────────────────────────────────────────

export function getRoot(): string {
  return path.join(process.cwd(), LOOPKIT_DIR);
}

export function getConfigPath(): string {
  return path.join(getRoot(), "config.json");
}

export function getProjectDir(slug: string): string {
  return path.join(getRoot(), "projects", slug);
}

export function getBriefPath(slug: string): string {
  return path.join(getProjectDir(slug), "brief.md");
}

export function getBriefJsonPath(slug: string): string {
  return path.join(getProjectDir(slug), "brief.json");
}

export function getDraftPath(slug: string): string {
  return path.join(getProjectDir(slug), "draft.json");
}

export function getTasksPath(slug: string): string {
  return path.join(getProjectDir(slug), "tasks.md");
}

export function getCutPath(slug: string): string {
  return path.join(getProjectDir(slug), "cut.md");
}

export function getShipDir(): string {
  return path.join(getRoot(), "ships");
}

export function getShipLogPath(date?: string): string {
  return path.join(getShipDir(), `${date || formatDate()}.md`);
}

export function getLogsDir(): string {
  return path.join(getRoot(), "logs");
}

export function getLoopLogPath(weekNum: number): string {
  return path.join(getLogsDir(), `week-${weekNum}.md`);
}

// ─── Directory Setup ────────────────────────────────────────────

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function ensureLoopkitDir(): void {
  ensureDir(getRoot());
  ensureDir(path.join(getRoot(), "projects"));
  ensureDir(getShipDir());
  ensureDir(getLogsDir());
  ensureDir(getPulseDir());
}

export function getPulseDir(): string {
  return path.join(getRoot(), "pulse");
}

export function getPulseResponsesPath(): string {
  return path.join(getPulseDir(), "responses.json");
}

export function readPulseResponses(): string[] {
  const filePath = getPulseResponsesPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as string[];
  } catch {
    return [];
  }
}

export function appendPulseResponse(text: string): void {
  ensureDir(getPulseDir());
  const responses = readPulseResponses();
  responses.push(text.trim());
  fs.writeFileSync(getPulseResponsesPath(), JSON.stringify(responses, null, 2));
}

// ─── Cut Archive ────────────────────────────────────────────────

export function appendToCut(slug: string, taskLine: string, cutDate: string): void {
  ensureProjectDir(slug);
  const cutPath = getCutPath(slug);
  const header = `\n## Cut on ${cutDate}\n`;
  const entry = `- [~] ${taskLine}\n`;
  if (!fs.existsSync(cutPath)) {
    fs.writeFileSync(cutPath, `# ${slug} — Cut Tasks\n${header}${entry}`);
  } else {
    fs.appendFileSync(cutPath, `${header}${entry}`);
  }
}

export function ensureProjectDir(slug: string): void {
  ensureDir(getProjectDir(slug));
}

// ─── Config ─────────────────────────────────────────────────────

export function readConfig(): Config {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    const defaults: Config = { version: 1 };
    writeConfig(defaults);
    return defaults;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const config = ConfigSchema.parse(raw);
    // Decrypt auth token if encrypted
    if (config.auth?.apiKey) {
      const decrypted = decryptToken(config.auth.apiKey);
      if (decrypted) {
        config.auth.apiKey = decrypted;
      } else {
        console.warn("⚠ Failed to decrypt auth token. Run `loopkit auth` again.");
        delete config.auth.apiKey;
      }
    }
    return config;
  } catch {
    const defaults: Config = { version: 1 };
    writeConfig(defaults);
    return defaults;
  }
}

export function writeConfig(config: Config): void {
  ensureLoopkitDir();
  const toWrite = { ...config };
  // Encrypt auth token before writing
  if (toWrite.auth?.apiKey && !toWrite.auth.apiKey.startsWith(ENCRYPTION_PREFIX)) {
    toWrite.auth.apiKey = encryptToken(toWrite.auth.apiKey);
  }
  fs.writeFileSync(getConfigPath(), JSON.stringify(toWrite, null, 2));
}

// ─── Brief ──────────────────────────────────────────────────────

export function briefExists(slug: string): boolean {
  return fs.existsSync(getBriefPath(slug));
}

export function projectExists(slug: string): boolean {
  return fs.existsSync(getProjectDir(slug));
}

export function saveBrief(
  slug: string,
  answers: InitAnswers,
  brief?: Brief
): void {
  ensureProjectDir(slug);

  // Save raw JSON for machine consumption
  const jsonData = { answers, brief: brief || null, createdAt: new Date().toISOString() };
  fs.writeFileSync(getBriefJsonPath(slug), JSON.stringify(jsonData, null, 2));

  // Save human-readable markdown
  const md = renderBriefMarkdown(answers, brief);
  fs.writeFileSync(getBriefPath(slug), md);
}

export function readBriefJson(
  slug: string
): { answers: InitAnswers; brief: Brief | null } | null {
  const jsonPath = getBriefJsonPath(slug);
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return null;
  }
}

function renderBriefMarkdown(answers: InitAnswers, brief?: Brief): string {
  const lines: string[] = [];
  lines.push(`# ${answers.name} — Product Brief`);
  lines.push("");
  lines.push(`_Generated by LoopKit on ${formatDate()}_`);
  lines.push("");

  if (brief) {
    lines.push("## The Bet");
    lines.push("");
    lines.push(`> ${brief.bet}`);
    lines.push("");
    lines.push("## Scores");
    lines.push("");
    lines.push(`| Dimension | Score | Note |`);
    lines.push(`|---|---|---|`);
    lines.push(`| ICP | ${brief.icpScore}/10 | ${brief.icpNote} |`);
    lines.push(`| Problem | ${brief.problemScore}/10 | ${brief.problemNote} |`);
    lines.push(`| MVP Scope | ${brief.mvpScore}/10 | ${brief.mvpNote} |`);
    lines.push("");
    lines.push(`**Overall: ${brief.overallScore}/10**`);
    lines.push("");
    lines.push("## Riskiest Assumption");
    lines.push("");
    lines.push(brief.riskiestAssumption);
    lines.push("");
    lines.push("## Validate Before You Build");
    lines.push("");
    lines.push(brief.validateAction);
    lines.push("");
    lines.push("## MVP in Plain English");
    lines.push("");
    lines.push(brief.mvpPlainEnglish);
  } else {
    lines.push("_AI analysis unavailable. Scores pending._");
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Raw Answers");
  lines.push("");
  lines.push(`**Problem:** ${answers.problem}`);
  lines.push("");
  lines.push(`**ICP:** ${answers.icp}`);
  lines.push("");
  lines.push(`**Why unsolved:** ${answers.whyUnsolved}`);
  lines.push("");
  lines.push(`**MVP:** ${answers.mvp}`);

  return lines.join("\n");
}

// ─── Draft (session resume) ─────────────────────────────────────

export function saveDraft(
  slug: string,
  partialAnswers: Partial<InitAnswers>,
  lastQuestion: number
): void {
  ensureProjectDir(slug);
  const draft = { partialAnswers, lastQuestion, savedAt: new Date().toISOString() };
  fs.writeFileSync(getDraftPath(slug), JSON.stringify(draft, null, 2));
}

export function readDraft(
  slug: string
): { partialAnswers: Partial<InitAnswers>; lastQuestion: number } | null {
  const draftPath = getDraftPath(slug);
  if (!fs.existsSync(draftPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(draftPath, "utf-8"));
  } catch {
    return null;
  }
}

export function deleteDraft(slug: string): void {
  const draftPath = getDraftPath(slug);
  if (fs.existsSync(draftPath)) {
    fs.unlinkSync(draftPath);
  }
}

// ─── Tasks ──────────────────────────────────────────────────────

export function readTasksFile(slug: string): string | null {
  const tasksPath = getTasksPath(slug);
  if (!fs.existsSync(tasksPath)) return null;
  return fs.readFileSync(tasksPath, "utf-8");
}

export function writeTasksFile(slug: string, content: string): void {
  ensureProjectDir(slug);
  fs.writeFileSync(getTasksPath(slug), content);
}

export function createTasksScaffold(slug: string, projectName: string): void {
  const content = `# ${projectName} — Tasks

## This Week

## Backlog
`;
  writeTasksFile(slug, content);
}

// ─── Ship Logs ──────────────────────────────────────────────────

export function saveShipLog(content: string, date?: string): void {
  ensureDir(getShipDir());
  fs.writeFileSync(getShipLogPath(date), content);
}

export function readShipLog(date?: string): string | null {
  const logPath = getShipLogPath(date);
  if (!fs.existsSync(logPath)) return null;
  return fs.readFileSync(logPath, "utf-8");
}

export function shipLogExists(date?: string): boolean {
  return fs.existsSync(getShipLogPath(date));
}

// ─── Loop Logs ──────────────────────────────────────────────────

export function saveLoopLog(weekNum: number, content: string): void {
  ensureDir(getLogsDir());
  fs.writeFileSync(getLoopLogPath(weekNum), content);
}

export function readLoopLog(weekNum: number): string | null {
  const logPath = getLoopLogPath(weekNum);
  if (!fs.existsSync(logPath)) return null;
  return fs.readFileSync(logPath, "utf-8");
}

export function loopLogExists(weekNum: number): boolean {
  return fs.existsSync(getLoopLogPath(weekNum));
}

// ─── List Projects ──────────────────────────────────────────────

export function listProjects(): string[] {
  const projectsDir = path.join(getRoot(), "projects");
  if (!fs.existsSync(projectsDir)) return [];
  return fs.readdirSync(projectsDir).filter((f) => {
    return fs.statSync(path.join(projectsDir, f)).isDirectory();
  });
}

// ─── Loop Logs — read last N weeks ──────────────────────────────

export function readLastNLoopLogs(n: number, slug?: string): Array<{ weekNumber: number; overridden: boolean }> {
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) return [];

  const files = fs
    .readdirSync(logsDir)
    .filter((f) => /^week-\d+\.md$/.test(f))
    .sort((a, b) => {
      const wA = parseInt(a.replace("week-", "").replace(".md", ""));
      const wB = parseInt(b.replace("week-", "").replace(".md", ""));
      return wB - wA;
    })
    .slice(0, n);

  return files
    .map((f) => {
      const weekNumber = parseInt(f.replace("week-", "").replace(".md", ""));
      const content = fs.readFileSync(path.join(logsDir, f), "utf-8");
      const overridden = content.includes("_Override:");
      return { weekNumber, overridden, content };
    })
    .filter((log) => {
      if (!slug) return true;
      const projectMatch = log.content.includes(`project:${slug}`);
      const noProjectRef = !log.content.includes("project:");
      return projectMatch || noProjectRef;
    })
    .map(({ weekNumber, overridden }) => ({ weekNumber, overridden }));
}

// ─── Streak Calculation ─────────────────────────────────────────

export function getConsecutiveWeeksStreak(currentWeekNum: number): number {
  let streak = 0;
  let checkWeek = currentWeekNum - 1;
  
  while (checkWeek > 0) {
    if (loopLogExists(checkWeek)) {
      streak++;
      checkWeek--;
    } else {
      break;
    }
  }
  
  return streak;
}
