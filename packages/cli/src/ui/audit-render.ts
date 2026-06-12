/**
 * Audit report renderer.
 *
 * Takes an AuditReport (structured AI output) plus the underlying facts
 * and renders a terminal-friendly display, plus Markdown and PDF-exportable
 * representations.
 */

import type { AuditReport } from "@loopkit/shared";
import type { AuditFacts } from "../analytics/audit.js";
import { colors, box, kv, badge, divider } from "./theme.js";
import { scoreBar, gradient } from "./layout.js";

/**
 * Render the audit as a terminal display.
 * Returns the formatted string (caller prints it).
 */
export function renderAuditTerminal(
  report: AuditReport,
  facts: AuditFacts,
): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(`  ${gradient("Founder Audit")}  ${colors.muted(`· last ${report.periodWeeks} weeks`)}`);
  lines.push("");

  // Headline metrics
  lines.push(divider(colors.brand("Headline")));
  lines.push("");
  const tasksPerWeek =
    report.periodWeeks > 0
      ? Math.round(report.totalTasksCompleted / report.periodWeeks)
      : 0;
  const c = report.comparedToCohort;
  const cmp = (you: number, cohort: number, unit: string): string => {
    const delta = you - cohort;
    const sign = delta > 0 ? "+" : "";
    const color = delta >= 0 ? colors.success : colors.danger;
    return `${color(`${sign}${delta}${unit}`)} ${colors.muted(`vs ${cohort}${unit} median`)}`;
  };

  lines.push(
    `  ${kv("Tasks completed", `${report.totalTasksCompleted} (${tasksPerWeek}/wk)`)}  ${cmp(c.tasksPerWeek.you, c.tasksPerWeek.cohortMedian, "/wk")}`,
  );
  lines.push(
    `  ${kv("Streak", `${c.streak.you} weeks`)}  ${cmp(c.streak.you, c.streak.cohortMedian, " wk")}`,
  );
  lines.push(
    `  ${kv("Velocity", badge(report.velocityTrend, report.velocityTrend === "accelerating" ? "success" : report.velocityTrend === "declining" ? "error" : "warning"))}`,
  );
  lines.push(
    `  ${kv("Override rate", `${(report.overrideRate * 100).toFixed(0)}%`)}`,
  );
  lines.push(
    `  ${kv("Feedback acted on", `${(report.feedbackActedOnRate * 100).toFixed(0)}%`)}`,
  );
  lines.push("");

  // Pattern evolution sparkline
  if (report.patternEvolution.length > 0) {
    lines.push(divider(colors.brand("Pattern Evolution")));
    lines.push("");
    for (const p of report.patternEvolution.slice(0, 8)) {
      const typeColor =
        p.dominantTaskType === "distribution"
          ? colors.warning
          : p.dominantTaskType === "product"
          ? colors.success
          : p.dominantTaskType === "feedback"
          ? colors.info
          : colors.muted;
      lines.push(
        `  ${colors.muted(`W${String(p.week).padStart(2)}`)}  ${typeColor(p.dominantTaskType.padEnd(12))}  ${p.note ?? ""}`,
      );
    }
    lines.push("");
  }

  // The 4 big lines
  lines.push(divider(colors.brand("The Read")));
  lines.push("");

  lines.push(
    box(
      [
        colors.brand.bold("Top avoidance pattern"),
        "",
        report.topAvoidancePattern,
      ].join("\n"),
      "What you keep skipping",
    ),
  );
  lines.push("");

  lines.push(
    box(
      [
        colors.brand.bold("Biggest insight"),
        "",
        report.biggestInsight,
      ].join("\n"),
      "What the data shows",
    ),
  );
  lines.push("");

  lines.push(
    box(
      [
        colors.success.bold("One change for next month"),
        "",
        report.oneChangeForNextMonth,
        "",
        colors.muted("Risk if unchanged:"),
        colors.warning(report.riskIfUnchanged),
      ].join("\n"),
      "Concrete next move",
    ),
  );

  return lines.join("\n");
}

/**
 * Render the audit as Markdown (suitable for export).
 */
export function renderAuditMarkdown(
  report: AuditReport,
  facts: AuditFacts,
): string {
  const tasksPerWeek =
    report.periodWeeks > 0
      ? Math.round(report.totalTasksCompleted / report.periodWeeks)
      : 0;

  const c = report.comparedToCohort;
  const lines: string[] = [
    `# Founder Audit — last ${report.periodWeeks} weeks`,
    "",
    `_Generated ${new Date().toISOString().split("T")[0]} by LoopKit_`,
    "",
    `## Headline`,
    "",
    `| Metric | You | Cohort median |`,
    `| --- | --- | --- |`,
    `| Tasks completed | ${report.totalTasksCompleted} (${tasksPerWeek}/wk) | ${c.tasksPerWeek.cohortMedian}/wk |`,
    `| Current streak | ${c.streak.you} weeks | ${c.streak.cohortMedian} weeks |`,
    `| Shipping score | ${c.shippingScore.you}% | ${c.shippingScore.cohortMedian}% |`,
    `| Velocity | ${report.velocityTrend} | — |`,
    `| Override rate | ${(report.overrideRate * 100).toFixed(0)}% | — |`,
    `| Feedback acted on | ${(report.feedbackActedOnRate * 100).toFixed(0)}% | — |`,
    "",
    `## Pattern evolution`,
    "",
  ];

  for (const p of report.patternEvolution) {
    lines.push(`- **Week ${p.week}** — ${p.dominantTaskType}${p.note ? ` (${p.note})` : ""}`);
  }

  lines.push("");
  lines.push(`## What you keep skipping`);
  lines.push("");
  lines.push(report.topAvoidancePattern);
  lines.push("");
  lines.push(`## What the data shows`);
  lines.push("");
  lines.push(report.biggestInsight);
  lines.push("");
  lines.push(`## One change for next month`);
  lines.push("");
  lines.push(report.oneChangeForNextMonth);
  lines.push("");
  lines.push(`**Risk if unchanged:** ${report.riskIfUnchanged}`);
  lines.push("");

  return lines.join("\n");
}
