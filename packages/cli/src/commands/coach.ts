import {
  readConfig,
  writeConfig,
  readLastNLoopLogs,
  readLoopLog,
  readBriefJson,
} from "../storage/local.js";
import { getCoachingPlan, recordMomentShown } from "../analytics/coach.js";
import { computeShippingDNA } from "../analytics/dna.js";
import { computeBenchmarks } from "../analytics/benchmarks.js";
import { generateStructured } from "../ai/client.js";
import { DNARecommendationSchema } from "@loopkit/shared";
import { DNA_SYSTEM_PROMPT, buildDNAPrompt } from "../ai/prompts/dna.js";
import {
  colors,
  clog,
  coachingPlanCard,
  nextStep,
  shortcutsHint,
  ceremonyIntro,
  ceremonyOutro,
  spinner,
  confirm,
  isCancel,
  box,
  gradient,
  token,
  progressBar,
  badge,
} from "../ui/theme.js";

function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function formatWrappedBullet(symbol: string, text: string, width: number): string[] {
  const wrapped = wrapText(text, width - 4);
  return wrapped.map((line, idx) => {
    if (idx === 0) {
      return `  ${symbol} ${line}`;
    }
    return `    ${line}`;
  });
}

export async function coachCommand(options?: {
  off?: boolean;
  on?: boolean;
  dna?: boolean;
}): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  // ─── Toggle coaching ──────────────────────────────────────────
  if (options?.off) {
    config.coaching = { ...config.coaching, enabled: false };
    writeConfig(config);
    clog.message("Coaching disabled. Run `loopkit coach --on` to re-enable.");
    return;
  }

  if (options?.on) {
    config.coaching = { ...config.coaching, enabled: true };
    writeConfig(config);
    clog.success("Coaching enabled.");
  }

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  // ─── Founder DNA Report ────────────────────────────────────────
  if (options?.dna) {
    const dna = computeShippingDNA();
    if (!dna) {
      ceremonyIntro("Founder DNA Report");
      clog.step("Not Enough Data Yet");
      clog.message("Founder DNA Report requires at least 4 weeks of loop data.");
      clog.message("Run `loopkit loop` for a few weeks to unlock your profile.");
      clog.step("Next Step");
      clog.info(`Run ${colors.primary.bold("loopkit loop")} to log your weekly progress.`);
      ceremonyOutro("Keep shipping. Consistency builds the DNA of a successful founder.");
      return;
    }

    // Calculate Best Week Ever
    const logsForBest = readLastNLoopLogs(100);
    let bestWeek = { weekNumber: 0, score: 0, tasksCompleted: 0 };
    for (const log of logsForBest) {
      const content = readLoopLog(log.weekNumber);
      if (content) {
        const tasksMatch = content.match(/- Tasks completed:\s*(\d+)/);
        const scoreMatch = content.match(/- Shipping score:\s*(\d+)%/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          const completed = tasksMatch ? parseInt(tasksMatch[1]) : 0;
          if (bestWeek.weekNumber === 0) {
            bestWeek = { weekNumber: log.weekNumber, score, tasksCompleted: completed };
          } else if (
            score > bestWeek.score ||
            (score === bestWeek.score && completed > bestWeek.tasksCompleted)
          ) {
            bestWeek = { weekNumber: log.weekNumber, score, tasksCompleted: completed };
          }
        }
      }
    }

    const benchmarks = computeBenchmarks();
    const overallPercentile = benchmarks?.overallPercentile ?? 50;
    const comparison = benchmarks?.comparison ?? "Solid progress.";

    const briefJson = readBriefJson(slug);
    const productName = briefJson?.answers?.name || slug;
    const bet = briefJson?.brief?.bet || "";
    const icp = briefJson?.answers?.icp || "";
    const riskiestAssumption = briefJson?.brief?.riskiestAssumption || "";

    const s = spinner();
    s.start("Synthesizing your monthly DNA recommendation...");

    let recommendation = "";
    try {
      const result = await generateStructured({
        command: "loop",
        system: DNA_SYSTEM_PROMPT,
        prompt: buildDNAPrompt({
          productName,
          bet,
          icp,
          riskiestAssumption,
          pattern: dna.pattern,
          patternDescription: dna.patternDescription,
          avgTasksCompleted: dna.avgTasksCompleted,
          avgScore: dna.avgScore,
          completionStyle: dna.completionStyle,
          velocityTrend: dna.velocityTrend,
          streak: dna.streak,
          totalWeeks: dna.totalWeeks,
          strengths: dna.strengths,
          riskWarnings: dna.riskWarnings,
          bestWeek,
          overallPercentile,
          comparison,
        }),
        schema: DNARecommendationSchema,
      });
      recommendation = result.recommendation;
      s.stop("Synthesis complete.");
    } catch (err) {
      s.stop("Synthesis failed.");
      recommendation = "Focus on keeping a tight scope. Break larger milestones down into 3-4 daily tasks to maintain a high completion rate.";
    }

    ceremonyIntro("Founder DNA Report");

    const patternBadgeColors = {
      "All-Star": "brand",
      "Marathoner": "success",
      "Sprinter": "warning",
      "Perfectionist": "info",
      "Reactor": "error",
    } as const;

    const badgeVariant = patternBadgeColors[dna.pattern] || "brand";

    const cardLines: string[] = [
      "",
      `  ${gradient("FOUNDER DNA WRAPPED")}`,
      `  ${token.dim("──────────────────────────────────────────────────")}`,
      `  ${token.label("Founder Profile:")} ${colors.bold(productName)}`,
      `  ${token.label("Weeks Tracked:")}   ${token.body(String(dna.totalWeeks))} weeks tracked`,
      `  ${token.label("Current Streak:")}  ${colors.orange(`${dna.streak} weeks`)}`,
      "",
      `  ${token.label("DOMINANT SHIPPING PATTERN:")}`,
      `  ${badge(dna.pattern.toUpperCase(), badgeVariant)}`,
    ];

    const wrappedDesc = wrapText(dna.patternDescription, 50);
    for (const line of wrappedDesc) {
      cardLines.push(`  ${token.dim(line)}`);
    }

    const getOrdinalSuffix = (n: number): string => {
      const j = n % 10;
      const k = n % 100;
      if (j === 1 && k !== 11) return "st";
      if (j === 2 && k !== 12) return "nd";
      if (j === 3 && k !== 13) return "rd";
      return "th";
    };

    cardLines.push(
      "",
      `  ${token.label("FOUNDER METRICS & SIGNATURE:")}`,
      `  Completion Style: ${token.body(dna.completionStyle.toUpperCase())}`,
      `  Velocity Trend:   ${token.body(dna.velocityTrend.toUpperCase())}`,
      `  Tasks completed:  ${progressBar(dna.avgTasksCompleted, 10, 15)} ${token.muted(`(${dna.avgTasksCompleted}/wk)`)}`,
      `  Shipping Score:   ${progressBar(dna.avgScore, 100, 15)} ${token.muted(`(${dna.avgScore}%)`)}`,
      "",
      `  ${token.label("BEST WEEK EVER:")}`,
      `  Week ${bestWeek.weekNumber} · Shipping Score: ${token.successBold(`${bestWeek.score}%`)} (${bestWeek.tasksCompleted} tasks completed)`,
      "",
      `  ${token.label("VS PEER BENCHMARKS:")}`,
      `  ${token.accentBold(`${overallPercentile}${getOrdinalSuffix(overallPercentile)} percentile`)} — ${token.body(comparison)}`,
      ""
    );

    if (dna.strengths.length > 0) {
      cardLines.push(`  ${token.label("KEY STRENGTHS:")}`);
      for (const st of dna.strengths) {
        cardLines.push(...formatWrappedBullet(token.success("✓"), token.body(st), 55));
      }
      cardLines.push("");
    }

    if (dna.riskWarnings.length > 0) {
      cardLines.push(`  ${token.label("AREAS FOR GROWTH:")}`);
      for (const rw of dna.riskWarnings) {
        cardLines.push(...formatWrappedBullet(token.warning("⚠"), token.body(rw), 55));
      }
      cardLines.push("");
    }

    cardLines.push(`  ${token.label("PERSONALIZED STRATEGY (NEXT 30 DAYS):")}`);
    const wrappedRec = wrapText(recommendation, 50);
    for (const line of wrappedRec) {
      cardLines.push(`  ${token.body(line)}`);
    }
    cardLines.push("");

    const cardContent = cardLines.join("\n");
    console.log(box(cardContent, "🧬 LoopKit DNA", "info"));

    ceremonyOutro("Keep shipping!");
    return;
  }

  if (config.coaching?.enabled === false) {
    clog.message("Coaching is disabled. Run `loopkit coach --on` to enable.");
    return;
  }

  ceremonyIntro("AI Coach");
  console.log(shortcutsHint());

  // ─── Generate coaching plan ───────────────────────────────────
  const s = spinner();
  s.start("Analyzing your shipping data...");

  const plan = getCoachingPlan(slug);

  s.stop("Analysis complete.");

  if (!plan || plan.moments.length === 0) {
    clog.step("Not Enough Data Yet");
    clog.message("Coaching needs at least 2 weeks of loop data.");
    clog.message(
      "Run `loopkit loop` for a few weeks to unlock personalized coaching.",
    );
    clog.step("Next Step");
    clog.info(`Run ${colors.primary.bold("loopkit loop")} for a few weeks to unlock coaching.`);
    ceremonyOutro("Keep shipping. Coaching will get smarter every week.");
    return;
  }

  // ─── Show full plan ───────────────────────────────────────────
  console.log(coachingPlanCard(plan));

  // ─── Interactive: acknowledge each moment ─────────────────────
  for (const moment of plan.moments) {
    const ack = await confirm({
      message: `Acknowledge: ${moment.title}?`,
    });

    if (isCancel(ack)) {
      ceremonyOutro("Coaching cancelled.");
      return;
    }

    if (ack) {
      recordMomentShown(moment.id);
      clog.success("Marked as seen");
    }
  }

  clog.step("Next Step");
  clog.info(`Run ${colors.primary.bold("loopkit loop")} to check in.`);
  ceremonyOutro("Coaching complete. See you next week.");
}
