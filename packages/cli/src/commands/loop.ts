import { LoopSynthesisSchema, UnstuckTasksSchema, getWeekNumber, formatDate, detectProjectCategory } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { LOOP_SYSTEM_PROMPT, buildLoopPrompt } from "../ai/prompts/loop.js";
import { UNSTUCK_SYSTEM_PROMPT, buildUnstuckPrompt } from "../ai/prompts/unstuck.js";
import {
  readConfig,
  writeConfig,
  readBriefJson,
  readTasksFile,
  writeTasksFile,
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
import { pushLoopLogToConvex, getConvexProjectId, triggerMilestone } from "../storage/sync.js";
import { recordEvent, startTelemetryPrompt, isTelemetryEnabled } from "../analytics/telemetry.js";
import { computeShippingDNA, type ShippingDNA } from "../analytics/dna.js";
import { detectChurnRisk, renderChurnWarning } from "../analytics/churn.js";
import { checkMissedSunday, saveAutoLoopDraft } from "../analytics/autoLoop.js";
import { predictSuccess, renderPrediction } from "../analytics/predictor.js";
import { detectPatterns } from "../analytics/patterns.js";
import { getPriorityMoment, recordMomentShown } from "../analytics/coach.js";
import { computeLoopKitScore, renderLoopKitScore, readLoopKitScoreFromLog } from "../analytics/score.js";
import { buildProofCard, buildTweetLine, copyToClipboard, buildTwitterIntentUrl, openUrl } from "../ui/proof-card.js";
import { colors, header, box, pass, warn, info, nextStep, scoreBar, shortcutsHint, emptyState, patternCard, coachingCard, ceremonyIntro, ceremonyOutro, clog, note, tasks, confirm, isCancel, select, text, spinner } from "../ui/theme.js";
import {
  computeLoopProof,
  formatScoreDelta,
  detectHighOverrideRate,
  type LoopProof,
} from "./loop/helpers.js";
import { saveLoopLogWithFrontmatter } from "./loop/saveLoopLog.js";
import { handleRevenueFlag } from "./loop/revenue-flag.js";
import {
  checkOverrideRate,
  maybePromptRevenue,
  maybePromptReferral,
  detectAndTriggerMilestones,
  maybeShowUpgradeIntent,
} from "./loop/post-actions.js";
import { shouldShowSyncBanner } from "./sync.js";

export type { LoopProof } from "./loop/helpers.js";

export async function loopCommand(options?: { revenue?: string; async?: boolean }): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  // ─── --revenue flag: direct MRR save ─────────────────────────
  // Usage: loopkit loop --revenue 240
  if (options?.revenue !== undefined) {
    await handleRevenueFlag(options.revenue);
    return;
  }

  const weekNum = getWeekNumber();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const isSunday = dayOfWeek === 0;
  const isAsync = options?.async;

  ceremonyIntro(isAsync ? `Week ${weekNum} Review (Async Mode)` : `Week ${weekNum} Review`);

  // ─── Sync banner (if dashboard isn't getting data) ──────────────
  if (shouldShowSyncBanner()) {
    clog.warn("Your dashboard isn't syncing. Run `loopkit sync status`.");
  }

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
      clog.warn("\n  🤖 Auto-Loop: Looks like you missed Sunday's ritual.");
      clog.message("  I've drafted your week summary from local data.\n");

      const autoConfirm = await confirm({
        message: "Save this auto-generated loop draft?",
      });

      if (!isCancel(autoConfirm) && autoConfirm) {
        saveAutoLoopDraft(slug, autoDraft);
        clog.success(`Week ${autoDraft.weekNumber} auto-loop saved.`);
        clog.message("  Run `loopkit loop` again for full AI synthesis.");
        ceremonyOutro("Auto-loop complete. See you next Sunday.");
        return;
      } else {
        clog.info("Skipping auto-loop. Running full loop instead.");
      }
    }
  }

  // ─── Mid-week check ──────────────────────────────────────────
  if (!isSunday && !isAsync) {
    clog.message("  Mid-week check-in mode (full loop runs Sunday).\n");
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
  clog.step("Week in Numbers");
  clog.message(`${colors.success("Done:")} ${tasksCompleted.length}`);
  clog.message(`${colors.warning("Open:")} ${tasksOpen.length}`);
  clog.message(`${colors.white("Shipped:")} ${shipLog ? "Yes" : "Not yet"}`);
  clog.message(`${colors.white.bold("Score:")} ${scoreBar(shippingScore, 100)}`);

  const pastStreak = getConsecutiveWeeksStreak(weekNum);
  const currentStreak = pastStreak + 1;
  if (currentStreak >= 2) {
    clog.message(`${colors.primary.bold("Streak:")} 🔥 ${currentStreak} consecutive weeks`);
  } else if (pastStreak === 0 && proof.weeksActive >= 2) {
    clog.warn("Streak reset — you missed a week. Let's start a new one today.");
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

    const progress = await text({
      message: "What did you make progress on?",
      placeholder: "e.g. Set up the project, wrote the first draft",
    });

    const nextThing = await text({
      message: "What's next week's one thing?",
      placeholder: "e.g. Ship the MVP landing page",
    });

    if (!isCancel(progress) && !isCancel(nextThing)) {
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

      saveLoopLogWithFrontmatter({
        week: weekNum,
        date: formatDate(),
        project: slug,
        tasksCompleted: tasksCompleted.length,
        tasksTotal: tasksCompleted.length + tasksOpen.length,
        shippingScore,
        loopkitScore: null,
        streak: null,
        override: false,
        tension: null,
        body: logContent,
      });
      clog.info(`Loop log saved → .loopkit/logs/week-${weekNum}.md`);

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

    ceremonyOutro(`Week ${weekNum} baseline set. See you next Sunday.`);
    return;
  }

  // ─── Unstuck Mode: 0 tasks (only triggers after week 1) ──────
  if (totalTasks === 0 && tasksCompleted.length === 0 && proof.weeksActive >= 2) {
    clog.warn("\n  No tasks this week. Feeling stuck?\n");

    const wantUnstuck = await confirm({
      message: "Generate 3 micro-tasks to get unstuck? (30-90 min each)",
    });

    if (!isCancel(wantUnstuck) && wantUnstuck) {
      const us = spinner();
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

        clog.step("Your 3 Micro-Tasks");
        for (let i = 0; i < unstuck.microTasks.length; i++) {
          clog.message(`${colors.success(`${i + 1}.`)} ${unstuck.microTasks[i]}`);
        }
        clog.message(`\n${unstuck.encouragement}`);

        const wantAdd = await confirm({
          message: "Add these to your tasks.md?",
        });

        if (!isCancel(wantAdd) && wantAdd) {
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

          writeTasksFile(slug, updated);
          clog.success("Micro-tasks added to tasks.md");
        }
      } catch {
        us.stop("Failed.");
        clog.warn("AI unavailable. Try again when connected.");
      }
    }
  }

  // ─── Mid-week: no AI by default (unless async mode) ──────────────────────
  if (!isSunday && !isAsync) {
    const runFull = await confirm({
      message: "Run full AI synthesis anyway?",
    });

    if (isCancel(runFull) || !runFull) {
      ceremonyOutro("Check back Sunday for full loop.");
      return;
    }
  }

  // ─── Async mode: check 7-day window ────────────────────────────────
  if (isAsync) {
    const previousLogs = readLastNLoopLogs(1, slug);
    if (previousLogs.length > 0) {
      const lastLog = previousLogs[0];
      const lastLogContent = readLoopLog(lastLog.weekNumber);
      if (lastLogContent) {
        const dateMatch = lastLogContent.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const lastLogDate = new Date(dateMatch[1]);
          const daysSinceLastLoop = Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceLastLoop > 7) {
            clog.warn(`It's been ${daysSinceLastLoop} days since your last loop. Async mode allows up to 7 days. Your streak may be affected.`);
          }
        }
      }
    }
  }

  // ─── AI Synthesis via p.tasks() ───────────────────────────
  // Three clearly-labelled stages keep the user informed the whole time.
  // Each task captures its result into the outer scope so we can render below.
  let synthesis: any = null;
  let synthesisError: unknown = null;

  await tasks([
    {
      title: "Reading your week’s data",
      task: async (_message) => {
        // Data has already been read above — this stage shows the user we’re
        // loading context before sending to the AI.
        await new Promise((r) => setTimeout(r, 120));
        return `${tasksCompleted.length} completed, ${tasksOpen.length} open`;
      },
    },
    {
      title: "Synthesising with AI",
      task: async () => {
        try {
          synthesis = await generateStructured({
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
          return "done";
        } catch (err) {
          synthesisError = err;
          return "failed";
        }
      },
    },
    {
      title: "Saving loop log",
      task: async () => {
        if (!synthesis) return "skipped (synthesis failed)";
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
        ].join("\n");
        // Full log is saved later after synthesis is confirmed below
        void logContent;
        return `week-${weekNum}.md ready`;
      },
    },
  ]);

  if (synthesisError || !synthesis) {
    // Fallback path
    clog.error("AI unavailable. Saving week data without synthesis.");
    const logContent = [
      `# Week ${weekNum} — ${formatDate()} | project:${slug}`,
      "",
      `- Tasks completed: ${tasksCompleted.length}`,
      `- Tasks open: ${tasksOpen.length}`,
      `- Shipping score: ${shippingScore}%`,
      `- Feedback acted on: ${proof.feedbackActedOn ? "Yes" : "No"}`,
      "",
      "_AI synthesis unavailable._",
    ].join("\n");

    saveLoopLogWithFrontmatter({
      week: weekNum,
      date: formatDate(),
      project: slug,
      tasksCompleted: tasksCompleted.length,
      tasksTotal: tasksCompleted.length + tasksOpen.length,
      shippingScore,
      loopkitScore: null,
      streak: pastStreak + 1,
      override: false,
      tension: null,
      body: logContent,
    });
    clog.info(`Fallback log saved → .loopkit/logs/week-${weekNum}.md`);

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
  } else {
    // ─── Show week reward + proof ────────────────────────────────
    clog.step("What Moved Forward");
    note(
      [synthesis.weekWin, "", colors.dim(synthesis.founderNote)].join("\n"),
      `Week ${weekNum}`
    );
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
    const action = await select({
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

    if (!isCancel(action)) {
      if (action === "change") {
        const custom = await text({
          message: "What's your one thing instead?",
        });
        if (!isCancel(custom)) {
          finalOneThing = custom;
          overridden = true;

          const reason = await text({
            message: "Why different? (helps improve future suggestions)",
            placeholder: "Optional — press Enter to skip",
          });
          if (!isCancel(reason) && reason) {
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
        writeTasksFile(slug, updated);
        clog.success(`Set as next week's #1: "${finalOneThing}"`);
      }
    }

    // ─── BIP Post ───────────────────────────────────────────────
    clog.step("Build-in-Public Post");
    note(synthesis.bipPost, "Copy → paste → tweet");

    const charCount = synthesis.bipPost.length;
    clog.message(`${charCount}/280 characters${charCount > 280 ? " ⚠ over limit" : ""}`);

    const postAction = await select({
      message: "Share this post:",
      options: [
        { value: "twitter", label: "[t]weet on X  — open twitter.com/intent/tweet" },
        { value: "copy",    label: "[c]opy to clipboard" },
        { value: "skip",   label: "[s]kip" },
      ],
    });

    if (!isCancel(postAction)) {
      if (postAction === "twitter") {
        const bipCopied = await copyToClipboard(synthesis.bipPost);
        const twitterUrl = buildTwitterIntentUrl(synthesis.bipPost);
        await openUrl(twitterUrl);
        clog.success("Opened X/Twitter in browser.");
        if (bipCopied) clog.message("(Also copied to clipboard as fallback.)");
      } else if (postAction === "copy") {
        const bipCopied = await copyToClipboard(synthesis.bipPost);
        if (bipCopied) clog.success("BIP post copied to clipboard.");
      }
    }

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

    clog.step("Proof Card");
    console.log(box(proofCardText, `Week ${weekNum} Card`));

    const cardCopied = await copyToClipboard(tweetLine);
    if (cardCopied) {
      clog.success("Tweet line copied to clipboard.");
    }

    const cardShareAction = await select({
      message: "Share proof card:",
      options: [
        { value: "twitter", label: "[t]weet on X — open twitter.com/intent/tweet" },
        { value: "skip",   label: "[s]kip" },
      ],
    });

    if (!isCancel(cardShareAction) && cardShareAction === "twitter") {
      const twitterUrl = buildTwitterIntentUrl(tweetLine);
      await openUrl(twitterUrl);
      clog.success("Opened X/Twitter in browser!");
    }


    // ─── Save full loop log ────────────────────────────────────
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

    saveLoopLogWithFrontmatter({
      week: weekNum,
      date: formatDate(),
      project: slug,
      tasksCompleted: tasksCompleted.length,
      tasksTotal: tasksCompleted.length + tasksOpen.length,
      shippingScore,
      loopkitScore: currentLoopKitScore,
      streak: pastStreak + 1,
      override: overridden,
      tension: synthesis.tension || null,
      body: logContent,
    });
    clog.success(`Loop log saved → .loopkit/logs/week-${weekNum}.md`);

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

    // ─── Referral prompt (streak >= 4) ────────────────────────────
    await maybePromptReferral(currentStreak);

    // ─── Revenue prompt (GF-4) ──────────────────────────────────
    // Only prompt on Sunday (the full ritual) and when no --revenue flag was used
    if (isSunday && !options?.revenue) {
      await maybePromptRevenue(slug, weekNum);
    }

    // ─── Milestone Detection (GF-3) ──────────────────────────────
    await detectAndTriggerMilestones({
      slug,
      weekNum,
      proof,
      convexProjectId: convexProjectId2,
      currentStreak,
      pulseResponses: pulseResponses.length,
    });

    await maybeShowUpgradeIntent(proof);
  }

  console.log(nextStep("track"));
  ceremonyOutro(`Week ${weekNum} closed. You made the next move visible.`);
}

// ─── Render Helpers (UI side effects) ────────────────────────────

function renderProof(proof: LoopProof): void {
  const lines = [
    `${colors.white("Score:")} ${proof.previousScore}% -> ${proof.currentScore}% (${formatScoreDelta(proof.scoreDelta)})`,
    `${colors.white("Weeks active:")} ${proof.weeksActive}`,
    `${colors.white("Decisions made:")} ${proof.decisionsMade}`,
    `${colors.white("Feedback:")} ${proof.feedbackResponses} response${proof.feedbackResponses === 1 ? "" : "s"}${proof.feedbackActedOn ? " -> acted on" : ""}`,
  ];

  clog.step("Proof This Week");
  console.log(box(lines.join("\n")));
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

  clog.step(`${emoji} Your Shipping DNA`);

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

