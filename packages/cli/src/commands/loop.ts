import * as p from "@clack/prompts";
import { LoopSynthesisSchema, UnstuckTasksSchema, getWeekNumber, formatDate } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { LOOP_SYSTEM_PROMPT, buildLoopPrompt } from "../ai/prompts/loop.js";
import { UNSTUCK_SYSTEM_PROMPT, buildUnstuckPrompt } from "../ai/prompts/unstuck.js";
import {
  readConfig,
  writeConfig,
  readBriefJson,
  readTasksFile,
  readShipLog,
  saveLoopLog,
  loopLogExists,
  readLastNLoopLogs,
  getConsecutiveWeeksStreak,
} from "../storage/local.js";
import { recordEvent, startTelemetryPrompt, isTelemetryEnabled } from "../analytics/telemetry.js";
import { computeShippingDNA, type ShippingDNA } from "../analytics/dna.js";
import { detectChurnRisk, renderChurnWarning } from "../analytics/churn.js";
import { checkMissedSunday, saveAutoLoopDraft } from "../analytics/autoLoop.js";
import { predictSuccess, renderPrediction } from "../analytics/predictor.js";
import { colors, header, box, pass, warn, info, nextStep, scoreBar, shortcutsHint, emptyState } from "../ui/theme.js";

export async function loopCommand(): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
    process.exit(1);
  }

  const weekNum = getWeekNumber();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const isSunday = dayOfWeek === 0;

  p.intro(colors.primary.bold(`LoopKit — Week ${weekNum} Review`));
  console.log(shortcutsHint());

  // ─── Telemetry consent (once, on Sunday) ──────────────────────
  if (isSunday) {
    await startTelemetryPrompt();
  }

  // ─── Auto-Loop: missed Sunday detection (Monday only) ─────────
  const isMonday = dayOfWeek === 1;
  if (isMonday && !loopLogExists(weekNum)) {
    const autoDraft = checkMissedSunday(slug);
    if (autoDraft) {
      console.log(colors.warning("\n  🤖 Auto-Loop: Looks like you missed Sunday's ritual."));
      console.log(colors.dim("  I've drafted your week summary from local data.\n"));

      const confirm = await p.confirm({
        message: "Save this auto-generated loop draft?",
      });

      if (!p.isCancel(confirm) && confirm) {
        saveAutoLoopDraft(slug, autoDraft);
        console.log(pass(`Week ${autoDraft.weekNumber} auto-loop saved.`));
        console.log(colors.dim("  Run `loopkit loop` again for full AI synthesis."));
        p.outro(colors.muted("Auto-loop complete. See you next Sunday."));
        return;
      } else {
        console.log(info("Skipping auto-loop. Running full loop instead."));
      }
    }
  }

  // ─── Mid-week check ──────────────────────────────────────────
  if (!isSunday) {
    console.log(colors.muted("  Mid-week check-in mode (full loop runs Sunday).\n"));
  }

  // ─── Gather local data ───────────────────────────────────────
  const briefData = readBriefJson(slug);
  const tasksContent = readTasksFile(slug);
  const shipLog = readShipLog();

  // Parse tasks
  let tasksCompleted: string[] = [];
  let tasksOpen: string[] = [];
  let totalTasks = 0;

  if (tasksContent) {
    const lines = tasksContent.split("\n");
    for (const line of lines) {
      if (/^\s*-\s*\[x\]/i.test(line)) {
        tasksCompleted.push(line.replace(/^\s*-\s*\[x\]\s*/, "").trim());
      } else if (/^\s*-\s*\[ \]/.test(line)) {
        tasksOpen.push(line.replace(/^\s*-\s*\[ \]\s*/, "").trim());
      }
    }
    totalTasks = tasksCompleted.length + tasksOpen.length;
  }

  const shippingScore =
    totalTasks > 0
      ? Math.round((tasksCompleted.length / totalTasks) * 100)
      : 0;

  // ─── Record telemetry (anonymous, opt-in only) ────────────────
  if (isTelemetryEnabled()) {
    const projectType = briefData?.answers?.mvp
      ? detectProjectType(briefData.answers.mvp)
      : undefined;

    recordEvent({
      command: "loop:data",
      tasksCompleted: tasksCompleted.length,
      tasksTotal: totalTasks,
      hasShipLog: !!shipLog,
      projectType,
    });
  }

  // ─── Week Summary (instant, local data) ──────────────────────
  console.log(header("Week in Numbers"));
  console.log(`  ${colors.success("Done:")} ${tasksCompleted.length}`);
  console.log(`  ${colors.warning("Open:")} ${tasksOpen.length}`);
  console.log(`  ${colors.white("Shipped:")} ${shipLog ? "Yes" : "Not yet"}`);
  console.log(`  ${colors.white.bold("Score:")} ${scoreBar(shippingScore, 100)}`);

  const pastStreak = getConsecutiveWeeksStreak(weekNum);
  const currentStreak = pastStreak + 1;
  if (currentStreak >= 2) {
    console.log(`  ${colors.primary.bold("Streak:")} 🔥 ${currentStreak} consecutive weeks`);
  }

  // ─── Handle no data (first week) ─────────────────────────────
  if (tasksCompleted.length === 0 && !shipLog) {
    console.log(
      emptyState(
        "No tracking data yet — that's fine for week 1. Everyone starts somewhere.",
        "Start tracking tasks",
        "loopkit track --add \"First task\""
      )
    );

    const progress = await p.text({
      message: "What did you make progress on?",
      placeholder: "e.g. Set up the project, wrote the first draft",
    });

    const nextThing = await p.text({
      message: "What's next week's one thing?",
      placeholder: "e.g. Ship the MVP landing page",
    });

    if (!p.isCancel(progress) && !p.isCancel(nextThing)) {
      const logContent = [
        `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
        "",
        `**Progress:** ${progress}`,
        `**Next:** ${nextThing}`,
        "",
        `**Shipping Score:** ${shippingScore}%`,
        "",
        "_Week 1 baseline set._",
      ].join("\n");

      saveLoopLog(weekNum, logContent);
      console.log(info(`Loop log saved → .loopkit/logs/week-${weekNum}.md`));
    }

    p.outro(colors.muted(`Week ${weekNum} baseline set. See you next Sunday.`));
    return;
  }

  // ─── Unstuck Mode: 0 tasks this week ──────────────────────────
  if (totalTasks === 0 && tasksCompleted.length === 0) {
    console.log(colors.warning("\n  No tasks this week. Feeling stuck?\n"));

    const wantUnstuck = await p.confirm({
      message: "Generate 3 micro-tasks to get unstuck? (30-90 min each)",
    });

    if (!p.isCancel(wantUnstuck) && wantUnstuck) {
      const us = p.spinner();
      us.start("Generating micro-tasks from your brief...");

      try {
        const unstuck = await generateStructured({
          command: "loop",
          system: UNSTUCK_SYSTEM_PROMPT,
          prompt: buildUnstuckPrompt({
            productName: briefData?.answers.name || slug,
            problem: briefData?.answers.problem,
            icp: briefData?.answers.icp,
            bet: briefData?.brief?.bet,
            riskiestAssumption: briefData?.brief?.riskiestAssumption,
            mvpPlainEnglish: briefData?.brief?.mvpPlainEnglish,
          }),
          schema: UnstuckTasksSchema,
          tier: "fast",
          temperature: 0.4,
        });

        us.stop("Micro-tasks ready.");

        console.log(header("Your 3 Micro-Tasks"));
        for (let i = 0; i < unstuck.microTasks.length; i++) {
          console.log(`  ${colors.success(`${i + 1}.`)} ${unstuck.microTasks[i]}`);
        }
        console.log(colors.dim(`\n  ${unstuck.encouragement}`));

        const wantAdd = await p.confirm({
          message: "Add these to your tasks.md?",
        });

        if (!p.isCancel(wantAdd) && wantAdd) {
          const existing = readTasksFile(slug) || "";
          const newTasks = unstuck.microTasks
            .map((t, i) => `- [ ] #W${weekNum}-${i + 1} ${t}`)
            .join("\n");

          let updated = existing;
          if (updated.includes("## This Week")) {
            updated = updated.replace("## This Week\n", `## This Week\n${newTasks}\n`);
          } else {
            updated += `\n## This Week\n${newTasks}\n`;
          }

          const { writeTasksFile } = await import("../storage/local.js");
          writeTasksFile(slug, updated);
          console.log(pass("Micro-tasks added to tasks.md"));
        }
      } catch {
        us.stop("Failed.");
        console.log(warn("AI unavailable. Try again when connected."));
      }
    }
  }

  // ─── Mid-week: no AI by default ──────────────────────────────
  if (!isSunday) {
    const runFull = await p.confirm({
      message: "Run full AI synthesis anyway?",
    });

    if (p.isCancel(runFull) || !runFull) {
      p.outro(colors.muted("Check back Sunday for full loop."));
      return;
    }
  }

  // ─── AI Synthesis ────────────────────────────────────────────
  const s = p.spinner();
  s.start("Synthesizing your week...");

  try {
    const synthesis = await generateStructured({
      command: "loop",
      system: LOOP_SYSTEM_PROMPT,
      prompt: buildLoopPrompt({
        productName: briefData?.answers.name || slug,
        weekNumber: weekNum,
        bet: briefData?.brief?.bet,
        riskiestAssumption: briefData?.brief?.riskiestAssumption,
        tasksCompleted,
        tasksOpen,
        shipLog: shipLog || undefined,
      }),
      schema: LoopSynthesisSchema,
      tier: "fast",
      temperature: 0.3,
    });

    s.stop("Synthesis complete.");

    // ─── Show recommendation ────────────────────────────────────
    console.log(
      box(
        [
          colors.white.bold("THE ONE THING"),
          "",
          synthesis.oneThing,
          "",
          colors.dim(synthesis.rationale),
          ...(synthesis.tension
            ? ["", colors.warning.bold("TENSION"), synthesis.tension]
            : []),
        ].join("\n"),
        `Week ${weekNum}`
      )
    );

    // ─── Accept / Change / Skip ─────────────────────────────────
    const action = await p.select({
      message: "This week's priority:",
      options: [
        { value: "accept", label: "[a]ccept — set as #1 task" },
        { value: "change", label: "[c]hange — type your own" },
        { value: "skip", label: "[s]kip — no task set" },
      ],
    });

    let overridden = false;
    let overrideReason: string | undefined;
    let finalOneThing = synthesis.oneThing;

    if (!p.isCancel(action)) {
      if (action === "change") {
        const custom = await p.text({
          message: "What's your one thing instead?",
        });
        if (!p.isCancel(custom)) {
          finalOneThing = custom;
          overridden = true;

          const reason = await p.text({
            message: "Why different? (helps improve future suggestions)",
            placeholder: "Optional — press Enter to skip",
          });
          if (!p.isCancel(reason) && reason) {
            overrideReason = reason;
          }
        }
      }

      if (action === "accept" || action === "change") {
        const existing = readTasksFile(slug) || "";
        const newTask = `- [ ] #W${weekNum}-p ${finalOneThing} — created:${formatDate()}`;
        let updated: string;
        if (existing.includes("## This Week")) {
          updated = existing.replace("## This Week\n", `## This Week\n${newTask}\n`);
        } else {
          updated = `# ${briefData?.answers.name || slug} — Tasks\n\n## This Week\n${newTask}\n\n## Backlog\n`;
        }
        const { writeTasksFile } = await import("../storage/local.js");
        writeTasksFile(slug, updated);
        console.log(pass(`Set as next week's #1: "${finalOneThing}"`));
      }
    }

    // ─── BIP Post ───────────────────────────────────────────────
    console.log(header("Build-in-Public Post"));
    console.log(box(synthesis.bipPost));

    const charCount = synthesis.bipPost.length;
    console.log(
      colors.dim(`  ${charCount}/280 characters${charCount > 280 ? colors.warning(" ⚠ over limit") : ""}`)
    );

    const postAction = await p.select({
      message: "Post:",
      options: [
        { value: "use", label: "[u]se as-is" },
        { value: "skip", label: "[s]kip" },
      ],
    });

    // ─── Save loop log ──────────────────────────────────────────
    const logContent = [
      `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
      "",
      "## Summary",
      `- Tasks completed: ${tasksCompleted.length}`,
      `- Tasks open: ${tasksOpen.length}`,
      `- Shipping score: ${shippingScore}%`,
      `- Shipped Friday: ${shipLog ? "Yes" : "No"}`,
      "",
      "## The One Thing",
      finalOneThing,
      "",
      `_Rationale: ${synthesis.rationale}_`,
      ...(overridden
        ? [`_Override: ${overrideReason || "No reason given"}_`]
        : []),
      ...(synthesis.tension ? ["", `**Tension:** ${synthesis.tension}`] : []),
      "",
      "## BIP Post",
      synthesis.bipPost,
    ].join("\n");

    saveLoopLog(weekNum, logContent);
    console.log(info(`Loop log saved → .loopkit/logs/week-${weekNum}.md`));

    // ─── Shipping DNA (after 4+ weeks) ────────────────────────────
    const dna = computeShippingDNA();
    if (dna) {
      displayDNA(dna);
    }

    // ─── Churn Guardian v1 ────────────────────────────────────────
    const churnRisk = detectChurnRisk();
    if (churnRisk) {
      console.log(renderChurnWarning(churnRisk));
    }

    // ─── Success Predictor v1 (after 8+ weeks) ────────────────────
    const prediction = predictSuccess(slug);
    if (prediction) {
      renderPrediction(prediction);
    }

    // ─── Override rate warning ───────────────────────────────────
    checkOverrideRate();
  } catch (error) {
    s.stop("Synthesis failed.");
    console.log(colors.danger("AI unavailable. Saving week data without synthesis."));

    const logContent = [
      `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
      "",
      `- Tasks completed: ${tasksCompleted.length}`,
      `- Tasks open: ${tasksOpen.length}`,
      `- Shipping score: ${shippingScore}%`,
      "",
      "_AI synthesis unavailable._",
    ].join("\n");

    saveLoopLog(weekNum, logContent);
  }

  console.log(nextStep("init"));
  p.outro(colors.muted(`Week ${weekNum} complete. See you next Sunday.`));
}

// ─── Shipping DNA Display ────────────────────────────────────────

function displayDNA(dna: ShippingDNA): void {
  if (!dna) return;

  const patternEmoji: Record<string, string> = {
    Marathoner: "🏃",
    Sprinter: "⚡",
    Perfectionist: "🎯",
    Reactor: "🌊",
    "All-Star": "🌟",
  };

  const emoji = patternEmoji[dna.pattern] || "📊";

  console.log(header(`${emoji} Your Shipping DNA`));

  const dnaLines = [
    colors.white.bold(`Pattern: ${dna.pattern}`),
    colors.dim(`  ${dna.patternDescription}`),
    "",
    colors.white.bold("Metrics"),
    `  ${colors.secondary("Average tasks/week:")} ${dna.avgTasksCompleted}`,
    `  ${colors.secondary("Average score:")} ${dna.avgScore}/100`,
    `  ${colors.secondary("Velocity:")} ${colors.warning(dna.velocityTrend)}`,
    `  ${colors.secondary("Completion style:")} ${dna.completionStyle}`,
    `  ${colors.secondary("Weeks tracked:")} ${dna.totalWeeks}`,
    `  ${colors.warning("Streak:")} ${dna.streak} weeks 🔥`,
  ];

  if (dna.strengths.length > 0) {
    dnaLines.push("");
    dnaLines.push(colors.white.bold("Strengths"));
    for (const s of dna.strengths) {
      dnaLines.push(`  ${pass(s)}`);
    }
  }

  if (dna.riskWarnings.length > 0) {
    dnaLines.push("");
    dnaLines.push(colors.warning.bold("Watch Out"));
    for (const r of dna.riskWarnings) {
      dnaLines.push(`  ${warn(r)}`);
    }
  }

  console.log(box(dnaLines.join("\n"), `Week ${dna.totalWeeks} DNA`));
}

// ─── Project Type Detection ─────────────────────────────────────

const PROJECT_KEYWORDS: Record<string, string[]> = {
  saas: ["saas", "subscription", "b2b", "platform", "dashboard", "crm"],
  mobile: ["app", "ios", "android", "mobile", "flutter", "react native"],
  cli: ["cli", "command", "terminal", "tool", "npm", "script"],
  api: ["api", "backend", "endpoint", "microservice"],
  newsletter: ["newsletter", "blog", "content", "writing", "media"],
  marketplace: ["marketplace", "two-sided", "matching", "booking"],
  ai: ["ai ", "llm", "gpt", "machine learning", "ml", "model"],
  ecommerce: ["shop", "store", "ecommerce", "checkout", "cart"],
};

function detectProjectType(mvpDescription: string): string | undefined {
  const lower = mvpDescription.toLowerCase();
  for (const [type, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return type;
    }
  }
  return "other";
}

// ─── Override Rate Warning ──────────────────────────────────────

function checkOverrideRate(): void {
  const WINDOW = 4; // weeks to look back
  const THRESHOLD = 2; // ≥2 overrides in 4 weeks = warning

  const logs = readLastNLoopLogs(WINDOW, slug);
  if (logs.length < WINDOW) return; // Not enough history yet

  const overrideCount = logs.filter((l) => l.overridden).length;
  if (overrideCount >= THRESHOLD) {
    console.log(
      warn(
        `Override rate: ${overrideCount}/${WINDOW} weeks — you've changed the AI recommendation more than half the time.`
      )
    );
    console.log(
      colors.muted(
        "  This may mean the AI needs better context. Try updating your brief: `loopkit init --analyze`"
      )
    );
  }
}
