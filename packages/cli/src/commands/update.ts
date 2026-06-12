import fs from "node:fs";
import path from "node:path";
import {
  readConfig,
  readBriefJson,
  getLogsDir,
  getShipDir,
  readRevenueHistory,
  getConsecutiveWeeksStreak,
  ensureDir,
  getRoot,
} from "../storage/local.js";
import {
  colors,
  clog,
  ceremonyIntro,
  ceremonyOutro,
  select,
  isCancel,
  text,
  spinner,
  box,
} from "../ui/theme.js";
import { generateStructured } from "../ai/client.js";
import {
  INVESTOR_UPDATE_SYSTEM_PROMPT,
  InvestorUpdateSchema,
  buildInvestorUpdatePrompt,
  type InvestorUpdate,
} from "../ai/prompts/update.js";
import { labsGate } from "./labs.js";

interface ParsedLoop {
  weekNumber: number;
  dateStr: string;
  tasksCompleted: number;
  tasksOpen: number;
  shippingScore: number;
  feedbackResponses: number;
  weekWin: string;
  nextFocus: string;
  tension: string;
}

export async function updateCommand(
  monthOption: string | undefined,
  options: { year?: string }
): Promise<void> {
  if (!labsGate("update")) return;

  ceremonyIntro("Investor Update Generator");

  const config = readConfig();
  const slug = config.activeProject;
  if (!slug) {
    clog.error("No active project context. Run `loopkit init` first.");
    ceremonyOutro("Failed.");
    return;
  }

  const briefData = readBriefJson(slug);
  const productName = briefData?.answers?.name || (briefData as any)?.name || slug;

  let targetYear = options.year ? parseInt(options.year) : new Date().getFullYear();
  let targetMonthIndex = -1;
  let targetMonthName = "";

  if (monthOption) {
    try {
      const parsed = parseMonth(monthOption);
      targetMonthIndex = parsed.monthIndex;
      targetMonthName = parsed.monthName;
    } catch (e: any) {
      clog.error(e.message);
      ceremonyOutro("Failed.");
      return;
    }
  } else {
    // Dynamic month selector
    const lastMonths = [];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastMonths.push({
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        value: `${d.getFullYear()}-${d.getMonth()}`,
      });
    }

    const selected = await select({
      message: "Select month for the investor update:",
      options: [
        ...lastMonths,
        { label: "Manual input...", value: "manual" },
      ],
    });

    if (isCancel(selected)) {
      ceremonyOutro("Cancelled.");
      return;
    }

    if (selected === "manual") {
      const manualMonth = await text({
        message: "Enter month (e.g. april, may, 05):",
        placeholder: "april",
        validate: (val) => {
          try {
            parseMonth(val);
            return undefined;
          } catch (e: any) {
            return e.message;
          }
        },
      });

      if (isCancel(manualMonth)) {
        ceremonyOutro("Cancelled.");
        return;
      }

      const parsed = parseMonth(manualMonth as string);
      targetMonthIndex = parsed.monthIndex;
      targetMonthName = parsed.monthName;
    } else {
      const [y, m] = (selected as string).split("-");
      targetYear = parseInt(y);
      targetMonthIndex = parseInt(m);
      targetMonthName = monthNames[targetMonthIndex];
    }
  }

  clog.step(`Targeting: ${targetMonthName} ${targetYear}`);

  // 1. Scan Loop Logs
  const targetWeeks: ParsedLoop[] = [];
  const logsDir = getLogsDir();
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir).filter((f) => /^week-\d+\.md$/.test(f));
    for (const file of files) {
      const content = fs.readFileSync(path.join(logsDir, file), "utf-8");
      const weekNumber = parseInt(file.replace("week-", "").replace(".md", ""));

      // Active project check
      const projectRef = `project:${slug}`;
      const containsProjectRef = content.includes(projectRef);
      const containsAnyProjectRef = content.includes("project:");
      if (containsAnyProjectRef && !containsProjectRef) {
        continue;
      }

      const parsed = parseLoopLogMarkdown(weekNumber, content);
      if (parsed) {
        const logDate = new Date(parsed.dateStr);
        if (
          !isNaN(logDate.getTime()) &&
          logDate.getFullYear() === targetYear &&
          logDate.getMonth() === targetMonthIndex
        ) {
          targetWeeks.push(parsed);
        }
      }
    }
  }

  // 2. Scan Ship Logs
  const targetShipments: string[] = [];
  const shipDir = getShipDir();
  if (fs.existsSync(shipDir)) {
    const files = fs.readdirSync(shipDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
    for (const file of files) {
      const content = fs.readFileSync(path.join(shipDir, file), "utf-8");
      const matchesProduct =
        content.includes(`**Product:** ${productName}`) || content.includes(`**Product:** ${slug}`);
      if (!matchesProduct) continue;

      const dateStr = file.replace(".md", "");
      const logDate = new Date(dateStr);
      if (
        !isNaN(logDate.getTime()) &&
        logDate.getFullYear() === targetYear &&
        logDate.getMonth() === targetMonthIndex
      ) {
        const match = content.match(/\*\*What shipped:\*\*?\s*(.*)/i);
        if (match) {
          targetShipments.push(match[1].trim());
        }
      }
    }
  }

  // 3. MRR Calculation
  const revenueHistory = readRevenueHistory();
  const sortedHistory = [...revenueHistory]
    .map((entry) => ({ ...entry, dateObj: new Date(entry.date) }))
    .filter((entry) => !isNaN(entry.dateObj.getTime()))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const startOfMonth = new Date(targetYear, targetMonthIndex, 1);
  const endOfMonth = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59, 999);

  const startMRREntry = sortedHistory.filter((entry) => entry.dateObj < startOfMonth).pop();
  const startMRR = startMRREntry ? startMRREntry.mrr : 0;
  const currency = startMRREntry?.currency || "USD";

  const endMRREntry = sortedHistory.filter((entry) => entry.dateObj <= endOfMonth).pop();
  const endMRR = endMRREntry ? endMRREntry.mrr : startMRR;
  const finalCurrency = endMRREntry?.currency || currency;

  const mrrDeltaVal = endMRR - startMRR;
  let mrrDeltaStr = "";
  if (startMRR === 0) {
    mrrDeltaStr =
      mrrDeltaVal > 0
        ? `${formatCurrency(endMRR, finalCurrency)} (+$${mrrDeltaVal}, first revenue!)`
        : `${formatCurrency(endMRR, finalCurrency)}`;
  } else {
    const percentChange = ((mrrDeltaVal / startMRR) * 100).toFixed(1);
    const prefix = mrrDeltaVal >= 0 ? "+" : "";
    mrrDeltaStr = `${formatCurrency(startMRR, finalCurrency)} ➔ ${formatCurrency(
      endMRR,
      finalCurrency
    )} (${prefix}${percentChange}%)`;
  }

  // 4. Aggregated stats
  const weeksTracked = targetWeeks.length;
  const totalTasksCompleted = targetWeeks.reduce((sum, w) => sum + w.tasksCompleted, 0);
  const totalFeedbackResponses = targetWeeks.reduce((sum, w) => sum + w.feedbackResponses, 0);

  let monthEndStreak = 0;
  if (targetWeeks.length > 0) {
    const sortedWeeks = [...targetWeeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const latestWeek = sortedWeeks[sortedWeeks.length - 1];
    monthEndStreak = getConsecutiveWeeksStreak(latestWeek.weekNumber) + 1;
  }

  // AI Structured Generation
  const s = spinner();
  s.start("Synthesising monthly progress with AI...");

  let updateData: InvestorUpdate;
  let fallbackUsed = false;

  const aggregatedMetrics = {
    weeksTracked,
    tasksCompleted: totalTasksCompleted,
    feedbackResponses: totalFeedbackResponses,
    mrrDelta: mrrDeltaStr,
    streak: monthEndStreak,
  };

  const rawShipments = targetShipments;
  const rawLearnings = targetWeeks
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((w) => ({
      weekNumber: w.weekNumber,
      date: w.dateStr,
      win: w.weekWin,
      focus: w.nextFocus,
      tension: w.tension,
    }));

  try {
    updateData = await generateStructured({
      command: "update",
      system: INVESTOR_UPDATE_SYSTEM_PROMPT,
      prompt: buildInvestorUpdatePrompt({
        productName,
        bet: briefData?.brief?.bet || (briefData as any)?.bet,
        icp: briefData?.answers?.icp || (briefData as any)?.icpNote || (briefData as any)?.icp,
        riskiestAssumption: briefData?.brief?.riskiestAssumption || (briefData as any)?.riskiestAssumption,
        monthName: targetMonthName,
        year: targetYear,
        aggregatedMetrics,
        rawShipments,
        rawLearnings,
      }),
      schema: InvestorUpdateSchema,
      tier: "creative",
      temperature: 0.3,
    });
    s.stop("AI Synthesis complete.");
  } catch (err) {
    s.stop("AI Synthesis failed. Using local heuristic fallback.");
    fallbackUsed = true;
    updateData = {
      executiveSummary: `${productName} made steady progress in ${targetMonthName} ${targetYear}. We tracked ${weeksTracked} weeks, completing ${totalTasksCompleted} tasks and collecting ${totalFeedbackResponses} feedback responses. MRR delta: ${mrrDeltaStr}.`,
      featuresShipped:
        rawShipments.length > 0 ? rawShipments : ["Routine maintenance and stability improvements."],
      keyLearnings:
        rawLearnings.length > 0
          ? rawLearnings.map((w) => `Week ${w.weekNumber} Win: ${w.win}`).slice(0, 3)
          : ["Maintained continuous engineering focus."],
      nextMonthFocus:
        rawLearnings.length > 0
          ? rawLearnings[rawLearnings.length - 1].focus
          : "Continue shipping features and talking to users.",
      tensionsAndRisks:
        rawLearnings.filter((w) => w.tension).length > 0
          ? rawLearnings
              .filter((w) => w.tension)
              .map((w) => w.tension)
              .slice(0, 3)
          : ["No major blockers identified."],
    };
  }

  // 5. Generate Outputs
  const updatesDir = path.join(getRoot(), "updates");
  ensureDir(updatesDir);

  const formattedMonthStr = `${targetYear}-${(targetMonthIndex + 1).toString().padStart(2, "0")}`;
  const mdFileName = `${slug}-update-${formattedMonthStr}.md`;
  const htmlFileName = `${slug}-update-${formattedMonthStr}.html`;

  const mdPath = path.join(updatesDir, mdFileName);
  const htmlPath = path.join(updatesDir, htmlFileName);

  // Render Markdown
  const mdLines = [
    `# Investor Update — ${targetMonthName} ${targetYear} | project:${slug}`,
    "",
    `_Generated by LoopKit on ${new Date().toISOString().split("T")[0]}_`,
    "",
    "## Executive Summary",
    updateData.executiveSummary,
    "",
    "## Traction & Key Metrics",
    `- **MRR Growth:** ${mrrDeltaStr}`,
    `- **Active Streak:** ${monthEndStreak} weeks 🔥`,
    `- **Feedback Volume:** ${totalFeedbackResponses} customer responses`,
    `- **Tasks Completed:** ${totalTasksCompleted} tasks finished across ${weeksTracked} active weeks`,
    "",
    "## Product & Features Shipped",
    ...updateData.featuresShipped.map((f) => `- ${f}`),
    "",
    "## Key Learnings & Insights",
    ...updateData.keyLearnings.map((l) => `- ${l}`),
    "",
    "## Risks & Tensions",
    ...updateData.tensionsAndRisks.map((t) => `- ${t}`),
    "",
    "## Next Month's Focus",
    `- ${updateData.nextMonthFocus}`,
  ];
  fs.writeFileSync(mdPath, mdLines.join("\n"));

  // Render HTML
  const htmlContent = buildHtmlReport({
    productName,
    monthName: targetMonthName,
    year: targetYear,
    mrrDelta: mrrDeltaStr,
    streak: monthEndStreak,
    tasksCompleted: totalTasksCompleted,
    weeksTracked,
    feedbackResponses: totalFeedbackResponses,
    executiveSummary: updateData.executiveSummary,
    featuresShipped: updateData.featuresShipped,
    keyLearnings: updateData.keyLearnings,
    tensionsAndRisks: updateData.tensionsAndRisks,
    nextMonthFocus: updateData.nextMonthFocus,
  });
  fs.writeFileSync(htmlPath, htmlContent);

  // Render Premium Terminal Card
  const formattedMRR = mrrDeltaStr.includes("➔")
    ? mrrDeltaStr.split("➔")[1].split("(")[0].trim()
    : mrrDeltaStr;

  const cardLines = [
    `  ${colors.primary.bold(productName.toUpperCase())} — ${targetMonthName.toUpperCase()} ${targetYear}`,
    `  ${colors.dim("──────────────────────────────────────────")}`,
    `  ${colors.secondary.bold("MRR Status:")}   ${formattedMRR} (${
      mrrDeltaStr.includes("(") ? mrrDeltaStr.slice(mrrDeltaStr.indexOf("(") + 1, -1) : "No change"
    })`,
    `  ${colors.secondary.bold("Streak:")}       🔥 ${monthEndStreak} consecutive weeks`,
    `  ${colors.secondary.bold("Velocity:")}     ${totalTasksCompleted} tasks completed across ${weeksTracked} loops`,
    `  ${colors.secondary.bold("Feedback:")}     💬 ${totalFeedbackResponses} responses collected`,
    `  ${colors.dim("──────────────────────────────────────────")}`,
    `  ${colors.success.bold("Markdown:")}    .loopkit/updates/${mdFileName}`,
    `  ${colors.success.bold("HTML Report:")} .loopkit/updates/${htmlFileName}`,
  ];

  console.log("\n");
  console.log(box(cardLines.join("\n"), `Month Summary Card`));

  ceremonyOutro(
    `Investor Update generated. ${
      fallbackUsed ? "Fallback data saved." : "Aesthetic update reports written."
    }`
  );
}

function parseMonth(monthStr: string): { monthIndex: number; monthName: string } {
  const clean = monthStr.trim().toLowerCase();
  const months = [
    { names: ["january", "jan", "1", "01"], index: 0, name: "January" },
    { names: ["february", "feb", "2", "02"], index: 1, name: "February" },
    { names: ["march", "mar", "3", "03"], index: 2, name: "March" },
    { names: ["april", "apr", "4", "04"], index: 3, name: "April" },
    { names: ["may", "5", "05"], index: 4, name: "May" },
    { names: ["june", "jun", "6", "06"], index: 5, name: "June" },
    { names: ["july", "jul", "7", "07"], index: 6, name: "July" },
    { names: ["august", "aug", "8", "08"], index: 7, name: "August" },
    { names: ["september", "sep", "9", "09"], index: 8, name: "September" },
    { names: ["october", "oct", "10"], index: 9, name: "October" },
    { names: ["november", "nov", "11"], index: 10, name: "November" },
    { names: ["december", "dec", "12"], index: 11, name: "December" },
  ];

  for (const m of months) {
    if (m.names.includes(clean)) {
      return { monthIndex: m.index, monthName: m.name };
    }
  }

  throw new Error(
    `Invalid month: "${monthStr}". Please specify a month name (e.g. 'may', 'april') or number (e.g. '5', '05').`
  );
}

function parseLoopLogMarkdown(weekNumber: number, content: string): ParsedLoop | null {
  const lines = content.split("\n");
  const firstLine = lines[0] || "";
  const dateMatch = firstLine.match(/—\s*(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  const dateStr = dateMatch[1];

  let tasksCompleted = 0;
  let tasksOpen = 0;
  let shippingScore = 0;
  let feedbackResponses = 0;
  let weekWin = "";
  let nextFocus = "";
  let tension = "";

  const compMatch =
    content.match(/-\s*Tasks completed:\s*(\d+)/i) ||
    content.match(/\*\*Tasks Completed:\*\*?\s*(\d+)/i);
  if (compMatch) tasksCompleted = parseInt(compMatch[1]);

  const openMatch =
    content.match(/-\s*Tasks open:\s*(\d+)/i) ||
    content.match(/\*\*Tasks Open:\*\*?\s*(\d+)/i);
  if (openMatch) tasksOpen = parseInt(openMatch[1]);

  const scoreMatch =
    content.match(/-\s*Shipping score:\s*(\d+)%/i) ||
    content.match(/\*\*Shipping Score:\*\*?\s*(\d+)%/i);
  if (scoreMatch) shippingScore = parseInt(scoreMatch[1]);

  const feedbackMatch =
    content.match(/-\s*Feedback responses:\s*(\d+)/i) ||
    content.match(/\*\*Feedback Responses:\*\*?\s*(\d+)/i);
  if (feedbackMatch) feedbackResponses = parseInt(feedbackMatch[1]);

  const movedForwardIdx = lines.findIndex((l) => l.trim() === "## What Moved Forward");
  const progressMatch = content.match(/\*\*Progress:\*\*?\s*(.*)/i);
  if (movedForwardIdx !== -1) {
    const nextHeaderIdx = lines.findIndex(
      (l, idx) => idx > movedForwardIdx && l.trim().startsWith("##")
    );
    const endIdx = nextHeaderIdx !== -1 ? nextHeaderIdx : lines.length;
    weekWin = lines.slice(movedForwardIdx + 1, endIdx).join("\n").trim();
  } else if (progressMatch) {
    weekWin = progressMatch[1].trim();
  }

  const oneThingIdx = lines.findIndex((l) => l.trim() === "## The One Thing");
  const nextMatch = content.match(/\*\*Next:\*\*?\s*(.*)/i);
  if (oneThingIdx !== -1) {
    const nextHeaderIdx = lines.findIndex(
      (l, idx) => idx > oneThingIdx && l.trim().startsWith("##")
    );
    const endIdx = nextHeaderIdx !== -1 ? nextHeaderIdx : lines.length;
    nextFocus = lines.slice(oneThingIdx + 1, endIdx).join("\n").trim();
  } else if (nextMatch) {
    nextFocus = nextMatch[1].trim();
  }

  const tensionMatch = content.match(/\*\*Tension:\*\*?\s*(.*)/i);
  if (tensionMatch) {
    tension = tensionMatch[1].trim();
  }

  return {
    weekNumber,
    dateStr,
    tasksCompleted,
    tasksOpen,
    shippingScore,
    feedbackResponses,
    weekWin,
    nextFocus,
    tension,
  };
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildHtmlReport(data: {
  productName: string;
  monthName: string;
  year: number;
  mrrDelta: string;
  streak: number;
  tasksCompleted: number;
  weeksTracked: number;
  feedbackResponses: number;
  executiveSummary: string;
  featuresShipped: string[];
  keyLearnings: string[];
  tensionsAndRisks: string[];
  nextMonthFocus: string;
}): string {
  const mrrVal = data.mrrDelta.includes("➔")
    ? data.mrrDelta.split("➔")[1].split("(")[0].trim()
    : data.mrrDelta;
  const mrrSub = data.mrrDelta.includes("(")
    ? data.mrrDelta.slice(data.mrrDelta.indexOf("("))
    : "No change";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Update — ${data.productName} (${data.monthName} ${data.year})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card-bg: rgba(24, 24, 27, 0.6);
      --border: rgba(39, 39, 42, 0.8);
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --primary: #7c3aed;
      --primary-gradient: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
      --success: #10b981;
      --warning: #f59e0b;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.05) 0px, transparent 50%);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      padding: 3rem 1.5rem;
      min-height: 100vh;
    }
    
    .container {
      max-width: 680px;
      margin: 0 auto;
    }
    
    header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 2rem;
    }
    
    .logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    
    .badge {
      background: var(--primary-gradient);
      color: #fff;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    
    .meta {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text);
      margin: 2.5rem 0 1rem;
      display: flex;
      align-items: center;
    }
    
    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: var(--border);
      margin-left: 1rem;
    }
    
    .exec-summary {
      font-size: 1.1rem;
      color: #f4f4f5;
      font-weight: 400;
      line-height: 1.7;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      backdrop-filter: blur(8px);
      transition: border-color 0.2s ease;
    }
    
    .metric-card:hover {
      border-color: rgba(124, 58, 237, 0.4);
    }
    
    .metric-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    
    .metric-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
    }
    
    .metric-sub {
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    
    .metric-sub.success { color: var(--success); }
    .metric-sub.warning { color: var(--warning); }
    .metric-sub.muted { color: var(--text-muted); }
    
    ul {
      list-style-type: none;
    }
    
    li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.75rem;
      color: #e4e4e7;
    }
    
    li::before {
      content: "✦";
      position: absolute;
      left: 0;
      color: #06b6d4;
      font-size: 0.875rem;
    }
    
    .risks-list li::before {
      content: "⚠";
      color: var(--warning);
    }
    
    .focus-box {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
      border: 1px solid rgba(124, 58, 237, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }
    
    .focus-box p {
      font-size: 1.05rem;
      color: #e4e4e7;
    }
    
    footer {
      margin-top: 4rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    footer a {
      color: var(--text);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-wrapper">
        <span class="badge">Investor Update</span>
        <span class="meta">${data.year}</span>
      </div>
      <h1>${data.productName}</h1>
      <div class="meta">Month of ${data.monthName} ${data.year} • Generated via LoopKit</div>
    </header>
    
    <main>
      <section>
        <div class="exec-summary">
          ${data.executiveSummary}
        </div>
      </section>
      
      <section>
        <h2 class="section-title">Traction & Key Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">MRR Status</div>
            <div class="metric-value">${mrrVal}</div>
            <div class="metric-sub success">${mrrSub}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Shipping Consistency</div>
            <div class="metric-value">${data.streak} Weeks</div>
            <div class="metric-sub success">🔥 Current Loop Streak</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Weekly Velocity</div>
            <div class="metric-value">${data.tasksCompleted} Tasks</div>
            <div class="metric-sub muted">Completed across ${data.weeksTracked} loops</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">ICP Feedback</div>
            <div class="metric-value">${data.feedbackResponses} Responses</div>
            <div class="metric-sub success">Collected from users</div>
          </div>
        </div>
      </section>
      
      <section>
        <h2 class="section-title">Product & Features Shipped</h2>
        <ul>
          ${data.featuresShipped.map((item) => `<li>${item}</li>`).join("\n")}
        </ul>
      </section>
      
      <section>
        <h2 class="section-title">Key Learnings & Insights</h2>
        <ul>
          ${data.keyLearnings.map((item) => `<li>${item}</li>`).join("\n")}
        </ul>
      </section>
      
      <section>
        <h2 class="section-title">Risks & Tensions</h2>
        <ul class="risks-list">
          ${data.tensionsAndRisks.map((item) => `<li>${item}</li>`).join("\n")}
        </ul>
      </section>
      
      <section>
        <h2 class="section-title">Next Month's Focus</h2>
        <div class="focus-box">
          <p>${data.nextMonthFocus}</p>
        </div>
      </section>
    </main>
    
    <footer>
      <p>Powered by <a href="https://loopkit.dev" target="_blank">LoopKit CLI</a>. Building in public, shipping weekly.</p>
    </footer>
  </div>
</body>
</html>`;
}
