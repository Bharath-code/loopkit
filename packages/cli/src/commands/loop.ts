import * as p from "@clack/prompts";
import { LoopSynthesisSchema, getWeekNumber, formatDate } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { LOOP_SYSTEM_PROMPT, buildLoopPrompt } from "../ai/prompts/loop.js";
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
import { colors, header, box, pass, warn, info, nextStep, scoreBar } from "../ui/theme.js";

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
      colors.muted("\n  No tracking data yet — that's fine for week 1.\n")
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
        `# Week ${weekNum} — ${formatDate()}`,
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
        // TODO: Add task to track
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
      `# Week ${weekNum} — ${formatDate()}`,
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

    // ─── Override rate warning ───────────────────────────────────
    checkOverrideRate(weekNum);
  } catch (error) {
    s.stop("Synthesis failed.");
    console.log(colors.danger("AI unavailable. Saving week data without synthesis."));

    const logContent = [
      `# Week ${weekNum} — ${formatDate()}`,
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

// ─── Override Rate Warning ──────────────────────────────────────

function checkOverrideRate(currentWeekNum: number): void {
  const WINDOW = 4; // weeks to look back
  const THRESHOLD = 2; // ≥2 overrides in 4 weeks = warning

  const logs = readLastNLoopLogs(WINDOW);
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
