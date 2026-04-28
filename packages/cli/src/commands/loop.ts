import * as p from "@clack/prompts";
import { LoopSynthesisSchema, UnstuckTasksSchema, getWeekNumber, formatDate, detectProjectCategory } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { LOOP_SYSTEM_PROMPT, buildLoopPrompt } from "../ai/prompts/loop.js";
import { UNSTUCK_SYSTEM_PROMPT, buildUnstuckPrompt } from "../ai/prompts/unstuck.js";
import {
  readConfig,
  writeConfig,
  readBriefJson,
  readTasksFile,
  readShipLog,
  readPulseResponses,
  readLoopLog,
  saveLoopLog,
  loopLogExists,
  readLastNLoopLogs,
  getConsecutiveWeeksStreak,
  readRevenueHistory,
  appendRevenueEntry,
  getLatestMRR,
} from "../storage/local.js";
import { pushLoopLogToConvex, getConvexProjectId } from "../storage/sync.js";
import { recordEvent, startTelemetryPrompt, isTelemetryEnabled } from "../analytics/telemetry.js";
import { computeShippingDNA, type ShippingDNA } from "../analytics/dna.js";
import { detectChurnRisk, renderChurnWarning } from "../analytics/churn.js";
import { checkMissedSunday, saveAutoLoopDraft } from "../analytics/autoLoop.js";
import { predictSuccess, renderPrediction } from "../analytics/predictor.js";
import { detectPatterns } from "../analytics/patterns.js";
import { getPriorityMoment, recordMomentShown } from "../analytics/coach.js";
import { computeLoopKitScore, renderLoopKitScore, readLoopKitScoreFromLog } from "../analytics/score.js";
import { buildProofCard, buildTweetLine, copyToClipboard } from "../ui/proof-card.js";
import { colors, header, box, pass, warn, info, nextStep, scoreBar, shortcutsHint, emptyState, patternCard, coachingCard } from "../ui/theme.js";

interface LoopProof {
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  weeksActive: number;
  decisionsMade: number;
  feedbackResponses: number;
  feedbackActedOn: boolean;
}

export async function loopCommand(options?: { revenue?: string }): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
    process.exit(1);
  }

  // ─── --revenue flag: direct MRR save ─────────────────────────
  // Usage: loopkit loop --revenue 240
  if (options?.revenue !== undefined) {
    p.intro(colors.primary.bold("LoopKit — Revenue Update"));
    const parsed = parseFloat(String(options.revenue).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(parsed) || parsed < 0) {
      console.log(colors.danger(`Invalid amount: "${options.revenue}". Use a number like --revenue 240`));
      process.exit(1);
    }
    const weekNum = getWeekNumber();
    const prev = getLatestMRR();
    const delta = prev !== null ? parsed - prev : null;
    appendRevenueEntry({
      date: new Date().toISOString().split("T")[0],
      weekNumber: weekNum,
      mrr: parsed,
      currency: "USD",
      source: "manual",
    });
    const history = readRevenueHistory();
    if (history.length === 1) {
      console.log(pass(colors.success.bold(`🎉 First revenue logged! MRR: $${parsed}`)));
    } else {
      const deltaStr =
        delta !== null && delta !== 0
          ? delta > 0
            ? colors.success(` ↑+$${delta}`)
            : colors.danger(` ↓$${Math.abs(delta)}`)
          : "";
      console.log(pass(`MRR logged: $${parsed}${deltaStr}`));
    }
    p.outro(colors.success.bold("Revenue saved. Keep shipping. 🚀"));
    return;
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

  // ─── Build pulse context for AI ──────────────────────────────
  const pulseResponses = readPulseResponses();
  const pulseData =
    pulseResponses.length > 0
      ? `${pulseResponses.length} responses. Recent: ${pulseResponses
          .slice(-5)
          .map((r, i) => `${i + 1}. "${r}"`)
          .join(" | ")}`
      : undefined;

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

  // ─── Build previousWeeks for AI accountability context ───────
  const previousLogsRaw = readLastNLoopLogs(3, slug).filter(
    (l) => l.weekNumber !== weekNum,
  );
  const previousWeeks = previousLogsRaw
    .map((l) => {
      const content = readLoopLog(l.weekNumber);
      if (!content) return null;
      const scoreMatch = content.match(/[Ss]hipping score:\s*(\d+)%/);
      const oneThingMatch = content.match(/## The One Thing\n([^\n]+)/);
      return {
        weekNumber: l.weekNumber,
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
        oneThing: oneThingMatch ? oneThingMatch[1].trim() : "",
      };
    })
    .filter(Boolean) as Array<{ weekNumber: number; score: number; oneThing: string }>;

  const proof = computeLoopProof({
    slug,
    weekNum,
    shippingScore,
    tasksCompleted,
    tasksOpen,
  });

  // ─── Record telemetry (anonymous, opt-in only) ────────────────
  if (isTelemetryEnabled()) {
    const projectType = briefData?.answers?.mvp
      ? detectProjectCategory(briefData.answers.mvp)
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
  } else if (pastStreak === 0 && proof.weeksActive >= 2) {
    console.log(warn("  Streak reset — you missed a week. Let's start a new one today."));
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
        `**Score Delta:** ${formatScoreDelta(proof.scoreDelta)}`,
        `**Weeks Active:** ${proof.weeksActive}`,
        `**Decisions Made:** ${proof.decisionsMade}`,
        `**Feedback Responses:** ${proof.feedbackResponses}`,
        `**Feedback Acted On:** ${proof.feedbackActedOn ? "Yes" : "No"}`,
        "",
        "_Week 1 baseline set._",
      ].join("\n");

      saveLoopLog(weekNum, logContent);
      console.log(info(`Loop log saved → .loopkit/logs/week-${weekNum}.md`));

      const convexProjectId = getConvexProjectId(slug);
      if (convexProjectId) {
        await pushLoopLogToConvex({
          projectId: convexProjectId,
          weekNumber: weekNum,
          date: formatDate(),
          tasksCompleted: tasksCompleted.length,
          tasksTotal: totalTasks,
          shippingScore,
          proof,
          overridden: false,
        });
      }
    }

    p.outro(colors.muted(`Week ${weekNum} baseline set. See you next Sunday.`));
    return;
  }

  // ─── Unstuck Mode: 0 tasks (only triggers after week 1) ──────
  if (totalTasks === 0 && tasksCompleted.length === 0 && proof.weeksActive >= 2) {
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
        pulseData,
        previousWeeks: previousWeeks.length > 0 ? previousWeeks : undefined,
      }),
      schema: LoopSynthesisSchema,
      tier: "fast",
      temperature: 0.3,
    });

    s.stop("Synthesis complete.");

    // ─── Show week reward + proof ────────────────────────────────
    console.log(header("What Moved Forward"));
    console.log(box([synthesis.weekWin, "", colors.dim(synthesis.founderNote)].join("\n"), `Week ${weekNum}`));
    renderProof(proof);

    // ─── LoopKit Score™ (GF-1) ──────────────────────────────────
    const scoreBreakdown = computeLoopKitScore();
    let currentLoopKitScore: number | null = null;
    if (scoreBreakdown) {
      const prevWeekLog = previousLogsRaw.length > 0 ? previousLogsRaw[0] : null;
      const prevScore = prevWeekLog ? readLoopKitScoreFromLog(prevWeekLog.weekNumber) : null;
      console.log(renderLoopKitScore(scoreBreakdown, prevScore));
      currentLoopKitScore = scoreBreakdown.score;
    }

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

    // ─── Proof Card (GF-2) ───────────────────────────────────
    const latestMRR = getLatestMRR();
    const proofCardData = {
      productName: briefData?.answers.name || slug,
      weekNum,
      shippingScore,
      tasksCompleted: tasksCompleted.length,
      tasksTotal: totalTasks,
      streak: pastStreak + 1,
      feedbackResponses: proof.feedbackResponses,
      loopkitScore: currentLoopKitScore,
      oneThing: finalOneThing,
      mrr: latestMRR,
      currency: "USD",
    };

    const proofCardText = buildProofCard(proofCardData);
    const tweetLine = buildTweetLine(proofCardData);

    console.log(header("Proof Card"));
    console.log(box(proofCardText, `Week ${weekNum} Card`));
    console.log(colors.dim(`  Tweet: ${tweetLine}`));

    const copied = await copyToClipboard(tweetLine);
    if (copied) {
      console.log(pass("Tweet line copied to clipboard — paste and share!"));
    }


    // ─── Save loop log ──────────────────────────────────────────
    const logContent = [
      `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
      "",
      "## Summary",
      `- Tasks completed: ${tasksCompleted.length}`,
      `- Tasks open: ${tasksOpen.length}`,
      `- Shipping score: ${shippingScore}%`,
      `- Shipped Friday: ${shipLog ? "Yes" : "No"}`,
      `- Score delta: ${formatScoreDelta(proof.scoreDelta)}`,
      `- Weeks active: ${proof.weeksActive}`,
      `- Decisions made: ${proof.decisionsMade}`,
      `- Feedback responses: ${proof.feedbackResponses}`,
      `- Feedback acted on: ${proof.feedbackActedOn ? "Yes" : "No"}`,
      ...(currentLoopKitScore !== null ? [`**LoopKit Score:** ${currentLoopKitScore}`] : []),
      "",
      "## What Moved Forward",
      synthesis.weekWin,
      "",
      synthesis.founderNote,
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

    const convexProjectId2 = getConvexProjectId(slug);
    if (convexProjectId2) {
      await pushLoopLogToConvex({
        projectId: convexProjectId2,
        weekNumber: weekNum,
        date: formatDate(),
        tasksCompleted: tasksCompleted.length,
        tasksTotal: totalTasks,
        shippingScore,
        synthesis: {
          oneThing: finalOneThing,
          rationale: synthesis.rationale,
          tension: synthesis.tension || null,
          bipPost: synthesis.bipPost,
          weekWin: synthesis.weekWin,
          founderNote: synthesis.founderNote,
        },
        proof,
        overridden,
        overrideReason,
        bipPost: synthesis.bipPost,
      });
    }

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

    // ─── Pattern Interrupt (IE-9) ─────────────────────────────────
    const patternResult = detectPatterns(slug);
    if (patternResult) {
      console.log(patternCard(patternResult.patterns, patternResult.totalWeeks));
    }

    // ─── Success Predictor v1 (after 8+ weeks) ────────────────────
    const prediction = predictSuccess(slug);
    if (prediction) {
      renderPrediction(prediction);
    }

    // ─── AI Coach v1 (IE-10) ─────────────────────────────────────
    if (config.coaching?.enabled !== false) {
      const coachMoment = getPriorityMoment(slug);
      if (coachMoment) {
        console.log(coachingCard(coachMoment));
        recordMomentShown(coachMoment.id);
      }
    }

    // ─── Override rate warning ───────────────────────────────────
    checkOverrideRate(slug);

    // ─── Revenue prompt (GF-4) ──────────────────────────────────
    // Only prompt on Sunday (the full ritual) and when no --revenue flag was used
    if (isSunday && !options?.revenue) {
      await maybePromptRevenue(slug, weekNum);
    }

    await maybeShowUpgradeIntent(proof);
  } catch (error) {
    s.stop("Synthesis failed.");
    console.log(colors.danger("AI unavailable. Saving week data without synthesis."));

    const logContent = [
      `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
      "",
      `- Tasks completed: ${tasksCompleted.length}`,
      `- Tasks open: ${tasksOpen.length}`,
      `- Shipping score: ${shippingScore}%`,
      `- Score delta: ${formatScoreDelta(proof.scoreDelta)}`,
      `- Weeks active: ${proof.weeksActive}`,
      `- Decisions made: ${proof.decisionsMade}`,
      `- Feedback responses: ${proof.feedbackResponses}`,
      `- Feedback acted on: ${proof.feedbackActedOn ? "Yes" : "No"}`,
      "",
      "_AI synthesis unavailable._",
    ].join("\n");

    saveLoopLog(weekNum, logContent);

    const convexProjectId3 = getConvexProjectId(slug);
    if (convexProjectId3) {
      await pushLoopLogToConvex({
        projectId: convexProjectId3,
        weekNumber: weekNum,
        date: formatDate(),
        tasksCompleted: tasksCompleted.length,
        tasksTotal: totalTasks,
        shippingScore,
        proof,
        overridden: false,
      });
    }

    // Still show pattern interrupt even when AI is down
    const patternResultOffline = detectPatterns(slug);
    if (patternResultOffline) {
      console.log(patternCard(patternResultOffline.patterns, patternResultOffline.totalWeeks));
    }
  }

  console.log(nextStep("track"));
  p.outro(colors.muted(`Week ${weekNum} closed. You made the next move visible.`));
}

// ─── Proof Loop Helpers ──────────────────────────────────────────

function computeLoopProof({
  slug,
  weekNum,
  shippingScore,
  tasksCompleted,
  tasksOpen,
}: {
  slug: string;
  weekNum: number;
  shippingScore: number;
  tasksCompleted: string[];
  tasksOpen: string[];
}): LoopProof {
  const previousLogs = readLastNLoopLogs(100, slug).filter(
    (log) => log.weekNumber !== weekNum,
  );
  const previousScore = findPreviousScore(previousLogs.map((log) => log.weekNumber));
  const feedbackResponses = readPulseResponses().length;
  const taskText = [...tasksCompleted, ...tasksOpen].join(" ").toLowerCase();
  const feedbackActedOn =
    feedbackResponses > 0 &&
    /\b(feedback|pulse|user|customer|fix|onboarding|response)\b/.test(taskText);

  return {
    previousScore,
    currentScore: shippingScore,
    scoreDelta: shippingScore - previousScore,
    weeksActive: previousLogs.length + 1,
    decisionsMade: previousLogs.length + 1,
    feedbackResponses,
    feedbackActedOn,
  };
}

function findPreviousScore(weekNumbers: number[]): number {
  for (const weekNumber of weekNumbers.sort((a, b) => b - a)) {
    const log = readLoopLog(weekNumber);
    const score = parseShippingScore(log);
    if (score !== null) return score;
  }
  return 0;
}

function parseShippingScore(content: string | null): number | null {
  if (!content) return null;
  const match =
    content.match(/Shipping score:\s*(\d+)%/i) ||
    content.match(/\*\*Shipping Score:\*\*\s*(\d+)%/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function renderProof(proof: LoopProof): void {
  const lines = [
    `${colors.white("Score:")} ${proof.previousScore}% -> ${proof.currentScore}% (${formatScoreDelta(proof.scoreDelta)})`,
    `${colors.white("Weeks active:")} ${proof.weeksActive}`,
    `${colors.white("Decisions made:")} ${proof.decisionsMade}`,
    `${colors.white("Feedback:")} ${proof.feedbackResponses} response${proof.feedbackResponses === 1 ? "" : "s"}${proof.feedbackActedOn ? " -> acted on" : ""}`,
  ];

  console.log(header("Proof This Week"));
  console.log(box(lines.join("\n")));
}

function formatScoreDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

async function maybeShowUpgradeIntent(proof: LoopProof): Promise<void> {
  if (proof.weeksActive !== 4 && proof.weeksActive !== 8) return;

  const isWeek8 = proof.weeksActive === 8;
  const message = isWeek8
    ? `${proof.weeksActive} weeks of data — want the dashboard and AI proxy to go deeper?`
    : "You're 4 weeks in — this is when the dashboard starts compounding. Want to unlock it?";

  const wantsUpgrade = await p.confirm({ message });

  if (p.isCancel(wantsUpgrade) || !wantsUpgrade) return;

  recordEvent({ command: "upgrade:intent:solo" });
  console.log(
    info(
      "Upgrade path: /login?intent=upgrade&plan=solo&source=cli-loop",
    ),
  );
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

// ─── Override Rate Warning ──────────────────────────────────────

function checkOverrideRate(slug: string): void {
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

// ─── GF-4: Revenue Prompt Helper ─────────────────────────────────

async function maybePromptRevenue(_slug: string, weekNum: number): Promise<void> {
  const latestMRR = getLatestMRR();
  const history = readRevenueHistory();

  const message =
    latestMRR !== null
      ? `Update MRR? (current: $${latestMRR})`
      : "Any revenue to log? (MRR in USD — press Enter to skip)";

  const revenueAnswer = await p.text({
    message,
    placeholder: latestMRR !== null ? `${latestMRR}` : "0 — skip with Enter",
  });

  if (p.isCancel(revenueAnswer)) return;

  const raw = (revenueAnswer as string).trim();
  if (!raw || raw === "0" || raw === "") return;

  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed) || parsed < 0) return;

  const mrr = Math.round(parsed * 100) / 100;
  const prev = history.length > 0 ? history[history.length - 1] : null;
  const delta = prev ? mrr - prev.mrr : null;

  appendRevenueEntry({
    date: new Date().toISOString().split("T")[0],
    weekNumber: weekNum,
    mrr,
    currency: "USD",
    source: "manual",
  });

  if (history.length === 0) {
    console.log(pass(colors.success.bold(`🎉 First revenue! MRR: $${mrr} — you're in business.`)));
  } else {
    const deltaStr =
      delta !== null && delta !== 0
        ? delta > 0
          ? colors.success(` ↑+$${delta}`)
          : colors.danger(` ↓$${Math.abs(delta)}`)
        : "";
    console.log(pass(`MRR updated: $${mrr}${deltaStr}`));
  }
}

