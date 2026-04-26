import * as p from "@clack/prompts";
import { slugify, BriefSchema, type InitAnswers } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { INIT_SYSTEM_PROMPT, buildInitPrompt } from "../ai/prompts/init.js";
import {
  ensureLoopkitDir,
  projectExists,
  readDraft,
  saveDraft,
  deleteDraft,
  saveBrief,
  readConfig,
} from "../storage/local.js";
import { colors, scoreBar, box, header, nextStep, info, shortcutsHint } from "../ui/theme.js";

export async function initCommand(
  resumeName?: string,
  options?: { analyze?: string }
): Promise<void> {
  // Handle --analyze flag
  if (options?.analyze) {
    await analyzeExisting(options.analyze);
    return;
  }

  ensureLoopkitDir();

  p.intro(colors.primary.bold("LoopKit — Define your product"));
  console.log(shortcutsHint());
  console.log(colors.muted("This takes 4 minutes. Be honest, not optimistic.\n"));

  // ─── Check for resume ────────────────────────────────────────
  let answers: Partial<InitAnswers> = {};
  let startQuestion = 0;
  let slug = resumeName ? slugify(resumeName) : "";

  if (resumeName) {
    slug = slugify(resumeName);
    const draft = readDraft(slug);

    if (draft) {
      const resume = await p.confirm({
        message: `Found a saved session for "${resumeName}". Resume where you left off?`,
      });

      if (p.isCancel(resume)) {
        p.cancel("Session cancelled.");
        process.exit(0);
      }

      if (resume) {
        answers = draft.partialAnswers;
        startQuestion = draft.lastQuestion;
        console.log(
          colors.muted(`  Resuming from question ${startQuestion + 1}/5\n`)
        );
      }
    } else if (projectExists(slug)) {
      const action = await p.select({
        message: `"${resumeName}" already exists.`,
        options: [
          { value: "overwrite", label: "Overwrite — start fresh" },
          { value: "new", label: "New version — keep the old one" },
        ],
      });

      if (p.isCancel(action)) {
        p.cancel("Session cancelled.");
        process.exit(0);
      }

      if (action === "new") {
        slug = `${slug}-v2`;
      }
    }
  }

  // ─── Question Flow ───────────────────────────────────────────

  const questions = [
    {
      key: "name" as const,
      message: "What's the product called? (doesn't have to be final)",
      placeholder: "e.g. ProposalAI",
    },
    {
      key: "problem" as const,
      message:
        "Describe the problem in one sentence — not your solution, the actual pain.",
      placeholder: "e.g. Freelancers lose deals because proposals look amateur",
      validate: (value: string) => {
        if (value.length < 5) return undefined; // Allow short, will soft-warn
        const solutionPatterns = /^(i want to build|a tool that|an app that|a platform)/i;
        if (solutionPatterns.test(value.trim())) {
          return "That sounds like a solution. What's the pain the user feels before your product exists?";
        }
        return undefined;
      },
    },
    {
      key: "icp" as const,
      message:
        "Who has this problem the worst? Be specific — role, context, how often they hit this pain.",
      placeholder:
        "e.g. Senior freelancers, $3K+ projects, 2-5 proposals/month",
    },
    {
      key: "whyUnsolved" as const,
      message:
        "Why hasn't this person solved it already? What's actually stopping them?",
      placeholder: "Sit with this one — it's the most important question.",
    },
    {
      key: "mvp" as const,
      message:
        'What does "done" look like for the MVP? Describe what a user does and what they get.',
      placeholder: "e.g. Fill a form, get a PDF in 60 seconds",
    },
  ];

  for (let i = startQuestion; i < questions.length; i++) {
    const q = questions[i];

    // Skip if already answered (from resume)
    if (answers[q.key]) continue;

    const value = await p.text({
      message: q.message,
      placeholder: q.placeholder,
      validate: q.validate,
    });

    if (p.isCancel(value)) {
      // Save draft on Ctrl+C
      if (answers.name || slug) {
        const currentSlug = slug || slugify((answers.name as string) || "untitled");
        saveDraft(currentSlug, answers, i);
        console.log(
          `\n${colors.muted(`Session paused. Run`)} ${colors.primary(`loopkit init ${currentSlug}`)} ${colors.muted("to resume.")}`
        );
      }
      process.exit(0);
    }

    answers[q.key] = value as string;

    // Soft warning for short answers on substantive questions
    if (i > 0 && (value as string).split(/\s+/).length < 5) {
      const addMore = await p.confirm({
        message: "That's pretty short. Add more?",
      });
      if (!p.isCancel(addMore) && addMore) {
        const more = await p.text({
          message: `${q.message} (expanded)`,
        });
        if (!p.isCancel(more)) {
          answers[q.key] = `${value} ${more}`;
        }
      }
    }

    // Set slug from first answer
    if (i === 0 && !slug) {
      slug = slugify(value as string);
    }
  }

  const finalAnswers = answers as InitAnswers;

  // ─── AI Analysis ─────────────────────────────────────────────

  const s = p.spinner();
  s.start("Analyzing your brief...");

  try {
    const brief = await generateStructured({
      command: "init",
      system: INIT_SYSTEM_PROMPT,
      prompt: buildInitPrompt(finalAnswers),
      schema: BriefSchema,
      tier: "fast",
      temperature: 0.3,
    });

    s.stop("Analysis complete.");

    // Save
    saveBrief(slug, finalAnswers, brief);
    deleteDraft(slug);

    // Update active project
    const config = readConfig();
    config.activeProject = slug;
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);

    // Render
    renderBrief(finalAnswers, brief, slug);
  } catch (error) {
    s.stop("AI analysis unavailable.");

    // Save without scores
    saveBrief(slug, finalAnswers);
    deleteDraft(slug);

    console.log(
      colors.warning(
        `\n  Saved answers without scoring. Run ${colors.primary(`loopkit init --analyze ${slug}`)} when online.\n`
      )
    );

    const config = readConfig();
    config.activeProject = slug;
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);
  }

  console.log(nextStep("track"));
  p.outro(colors.muted("Brief saved. Now build against it."));
}

// ─── Render Brief ───────────────────────────────────────────────

function renderBrief(
  answers: InitAnswers,
  brief: {
    bet: string;
    icpScore: number;
    icpNote: string;
    problemScore: number;
    problemNote: string;
    mvpScore: number;
    mvpNote: string;
    riskiestAssumption: string;
    validateAction: string;
    mvpPlainEnglish: string;
  },
  slug: string
): void {
  console.log(
    box(
      [
        `${colors.white.bold("THE BET")}`,
        `${colors.dim('"')}${brief.bet}${colors.dim('"')}`,
        "",
        `${colors.white("ICP")}      ${scoreBar(brief.icpScore)}`,
        `${colors.dim(brief.icpNote)}`,
        "",
        `${colors.white("PROBLEM")}  ${scoreBar(brief.problemScore)}`,
        `${colors.dim(brief.problemNote)}`,
        "",
        `${colors.white("MVP")}      ${scoreBar(brief.mvpScore)}`,
        `${colors.dim(brief.mvpNote)}`,
        "",
        `${colors.danger.bold("RISKIEST ASSUMPTION")}`,
        brief.riskiestAssumption,
        "",
        `${colors.secondary.bold("✦ VALIDATE TONIGHT")}`,
        brief.validateAction,
        "",
        `${colors.white.bold("MVP IN PLAIN ENGLISH")}`,
        brief.mvpPlainEnglish,
      ].join("\n"),
      answers.name
    )
  );

  console.log(
    `\n${info(`Saved → .loopkit/projects/${slug}/brief.md`)}`
  );
}

// ─── Analyze Existing ───────────────────────────────────────────

async function analyzeExisting(name: string): Promise<void> {
  const slug = slugify(name);
  const { readBriefJson } = await import("../storage/local.js");
  const data = readBriefJson(slug);

  if (!data) {
    console.log(colors.danger(`No brief found for "${name}". Run loopkit init first.`));
    process.exit(1);
  }

  if (data.brief) {
    console.log(colors.warning(`"${name}" already has AI analysis. Run loopkit init to overwrite.`));
    return;
  }

  const s = p.spinner();
  s.start("Running AI analysis on saved answers...");

  try {
    const brief = await generateStructured({
      command: "init",
      system: INIT_SYSTEM_PROMPT,
      prompt: buildInitPrompt(data.answers),
      schema: BriefSchema,
      tier: "fast",
      temperature: 0.3,
    });

    s.stop("Analysis complete.");
    saveBrief(slug, data.answers, brief);
    renderBrief(data.answers, brief, slug);
  } catch (error) {
    s.stop("Analysis failed.");
    console.log(colors.danger("Could not reach AI. Try again later."));
  }
}
