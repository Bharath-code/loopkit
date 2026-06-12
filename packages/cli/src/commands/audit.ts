/**
 * loopkit audit — The Founder Therapy Command.
 *
 * Reads the last 8 weeks of loop logs, ships, pulse responses, and tasks.
 * Generates a structured report comparing the founder to a synthetic cohort
 * baseline. Surfaces the one pattern they keep avoiding and the one change
 * to make next month.
 *
 * Usage:
 *   loopkit audit                 # 8-week default, terminal output
 *   loopkit audit --weeks 12      # longer window
 *   loopkit audit --export md    # save to .loopkit/audits/audit-YYYY-MM-DD.md
 *   loopkit audit --export pdf   # render via pdfkit
 *   loopkit audit --cohort       # show cohort comparison
 */

import fs from "node:fs";
import path from "node:path";
import { AuditReportSchema, type AuditReport } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } from "../ai/prompts/audit.js";
import { gatherAuditFacts, compareToCohort, type AuditFacts } from "../analytics/audit.js";
import { renderAuditTerminal, renderAuditMarkdown } from "../ui/audit-render.js";
import {
  ceremonyIntro,
  ceremonyOutro,
  clog,
  colors,
  box,
  spinner,
  info,
  isCancel,
  confirm,
  text,
} from "../ui/theme.js";
import { getRoot } from "../storage/local.js";

interface AuditOptions {
  weeks?: number;
  export?: "md" | "pdf";
  cohort?: boolean;
}

export async function auditCommand(options: AuditOptions = {}): Promise<void> {
  const weeks = options.weeks ?? 8;
  ceremonyIntro("Founder Audit", {
    tagline: `Looking back ${weeks} weeks. Be honest, not optimistic.`,
  });

  // ── Gather facts (no AI) ────────────────────────────────────────
  const s = spinner();
  s.start("Reading your last 8 weeks…");

  const facts = gatherAuditFacts(weeks);
  const cohort = compareToCohort(facts);

  if (!facts.hasEnoughData) {
    s.stop("Not enough data yet.");
    console.log(
      box(
        [
          colors.warning.bold("Need at least 2 weeks of data"),
          "",
          "Run `loopkit loop` at least twice to build the audit's foundation.",
          "",
          colors.muted("Tip: the audit gets sharper every Sunday you ship."),
        ].join("\n"),
        "Audit unavailable",
      ),
    );
    ceremonyOutro("Run `loopkit loop` this Sunday and try again.");
    return;
  }

  s.stop(`Read ${facts.periodWeeks} weeks.`);

  // ── Cohort-only mode ────────────────────────────────────────────
  if (options.cohort) {
    console.log(
      box(
        [
          colors.brand.bold("You vs. the cohort"),
          "",
          `${kvString("Shipping score", `${cohort.shippingScore.you}% (cohort: ${cohort.shippingScore.cohortMedian}%)`)}`,
          `${kvString("Streak", `${cohort.streak.you} wks (cohort: ${cohort.streak.cohortMedian} wks)`)}`,
          `${kvString("Tasks/week", `${cohort.tasksPerWeek.you} (cohort: ${cohort.tasksPerWeek.cohortMedian})`)}`,
        ].join("\n"),
        "Cohort comparison",
      ),
    );
    ceremonyOutro("Done.");
    return;
  }

  // ── AI synthesis ───────────────────────────────────────────────
  const ai = spinner();
  ai.start("Synthesizing the read…");

  let report: AuditReport;
  try {
    const generated = await generateStructured({
      command: "loop",
      system: AUDIT_SYSTEM_PROMPT,
      prompt: buildAuditPrompt(facts),
      schema: AuditReportSchema,
      tier: "creative",
      temperature: 0.4,
    });
    // Inject the cohort comparison (AI shouldn't fabricate it)
    report = { ...generated, comparedToCohort: cohort };
    ai.stop("Synthesis complete.");
  } catch (err) {
    ai.stop("AI unavailable.");
    clog.error(
      `Could not generate audit: ${err instanceof Error ? err.message : String(err)}`,
    );
    clog.message("Showing local facts only (no AI read):\n");
    console.log(
      box(
        [
          `${kvString("Tasks completed", String(facts.totalTasksCompleted))}`,
          `${kvString("Weeks shipped", `${facts.totalTasksShipped}/${facts.periodWeeks}`)}`,
          `${kvString("Velocity", facts.velocityTrend)}`,
          `${kvString("Current streak", `${facts.currentStreak} weeks`)}`,
          `${kvString("DNA pattern", facts.dnaPattern ?? "n/a")}`,
        ].join("\n"),
        "Local facts (no AI)",
      ),
    );
    ceremonyOutro("Try again when AI is available.");
    return;
  }

  // ── Render ─────────────────────────────────────────────────────
  console.log(renderAuditTerminal(report, facts));

  // ── Export ─────────────────────────────────────────────────────
  if (options.export) {
    const out = await maybeExport(report, facts, options.export);
    if (out) {
      clog.success(`Exported to ${out}`);
    }
  } else {
    // Offer export interactively
    const wantExport = await confirm({
      message: "Export as Markdown?",
    });
    if (!isCancel(wantExport) && wantExport) {
      const out = await maybeExport(report, facts, "md");
      if (out) {
        clog.success(`Exported to ${out}`);
      }
    }
  }

  info("Tip: re-run after every 4 weeks to track pattern evolution.");
  ceremonyOutro("Audit complete. The pattern is named; what you do with it is up to you.");
}

function kvString(key: string, value: string): string {
  return `${colors.muted(key.padEnd(20))} ${value}`;
}

async function maybeExport(
  report: AuditReport,
  facts: AuditFacts,
  format: "md" | "pdf",
): Promise<string | null> {
  const auditsDir = path.join(getRoot(), "audits");
  fs.mkdirSync(auditsDir, { recursive: true });
  const stamp = new Date().toISOString().split("T")[0];
  const base = `audit-${stamp}`;

  if (format === "md") {
    const out = path.join(auditsDir, `${base}.md`);
    fs.writeFileSync(out, renderAuditMarkdown(report, facts), "utf-8");
    return out;
  }

  if (format === "pdf") {
    // Defer to optional pdfkit. If not available, fall back to MD.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfkit = await import("pdfkit" as string).catch(() => null);
      if (!pdfkit) {
        clog.warn("PDF export requires the optional 'pdfkit' package.");
        clog.message("Install with: pnpm add -D pdfkit");
        clog.message("Falling back to Markdown export.");
        const out = path.join(auditsDir, `${base}.md`);
        fs.writeFileSync(out, renderAuditMarkdown(report, facts), "utf-8");
        return out;
      }
      const out = path.join(auditsDir, `${base}.pdf`);
      await writePdf(out, report, facts, (pdfkit as any).default ?? pdfkit);
      return out;
    } catch (err) {
      clog.error(
        `PDF export failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  return null;
}

async function writePdf(
  out: string,
  report: AuditReport,
  facts: AuditFacts,
  PDFDocument: any,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 60 });
      const stream = fs.createWriteStream(out);
      doc.pipe(stream);
      doc.fontSize(22).text("Founder Audit", { align: "left" });
      doc.fontSize(11).fillColor("#666").text(`Last ${report.periodWeeks} weeks · generated ${new Date().toISOString().split("T")[0]}`);
      doc.moveDown();
      doc.fillColor("#000").fontSize(14).text("Headline");
      doc.fontSize(11);
      doc.text(`Tasks completed: ${report.totalTasksCompleted}`);
      doc.text(`Velocity: ${report.velocityTrend}`);
      doc.text(`Streak: ${report.comparedToCohort.streak.you} weeks (cohort median ${report.comparedToCohort.streak.cohortMedian})`);
      doc.text(`Override rate: ${(report.overrideRate * 100).toFixed(0)}%`);
      doc.text(`Feedback acted on: ${(report.feedbackActedOnRate * 100).toFixed(0)}%`);
      doc.moveDown();
      doc.fontSize(14).text("What you keep skipping");
      doc.fontSize(11).text(report.topAvoidancePattern);
      doc.moveDown();
      doc.fontSize(14).text("Biggest insight");
      doc.fontSize(11).text(report.biggestInsight);
      doc.moveDown();
      doc.fontSize(14).text("One change for next month");
      doc.fontSize(11).text(report.oneChangeForNextMonth);
      doc.moveDown();
      doc.fontSize(14).text("Risk if unchanged");
      doc.fontSize(11).text(report.riskIfUnchanged);
      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
