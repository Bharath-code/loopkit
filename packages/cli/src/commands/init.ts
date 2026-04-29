import * as p from "@clack/prompts";
import {
  slugify,
  BriefSchema,
  ScaffoldSchema,
  ValidationQuestionsSchema,
  type InitAnswers,
  formatDate,
} from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import {
  INIT_SYSTEM_PROMPT,
  buildInitPrompt,
  SCAFFOLD_SYSTEM_PROMPT,
  buildScaffoldPrompt,
} from "../ai/prompts/init.js";
import {
  VALIDATION_SYSTEM_PROMPT,
  buildValidationPrompt,
} from "../ai/prompts/validation.js";
import {
  ensureLoopkitDir,
  projectExists,
  readDraft,
  saveDraft,
  deleteDraft,
  saveBrief,
  readConfig,
} from "../storage/local.js";
import {
  colors,
  scoreBar,
  box,
  header,
  nextStep,
  info,
  shortcutsHint,
} from "../ui/theme.js";
import {
  recordBriefCategories,
  getLocalTrendingData,
  isTelemetryEnabled,
} from "../analytics/telemetry.js";
import {
  categorizeICP,
  categorizeProblem,
  categorizeMVP,
} from "../analytics/competitorRadar.js";
import { getTemplate, getTemplateList } from "../templates/index.js";
import { installFridayReminder } from "../cron/installer.js";
import { installAliases } from "../aliases/installer.js";

export async function initCommand(
  resumeName?: string,
  options?: { analyze?: string; template?: string; cron?: boolean; validate?: boolean },
): Promise<void> {
  // Handle --analyze flag
  if (options?.analyze) {
    await analyzeExisting(options.analyze);
    return;
  }

  ensureLoopkitDir();

  p.intro(colors.primary.bold("LoopKit — Define your weekly shipping bet"));
  console.log(shortcutsHint());
  console.log(colors.muted("This takes under 5 minutes. Be honest, not optimistic.\n"));

  // ─── Template selection ───────────────────────────────────────
  let selectedTemplate = options?.template
    ? getTemplate(options.template)
    : undefined;

  if (options?.template && !selectedTemplate) {
    console.log(
      colors.warning(
        `Template "${options.template}" not found. Available templates:`,
      ),
    );
    for (const t of getTemplateList()) {
      console.log(colors.dim(`  • ${t.id}: ${t.name} — ${t.description}`));
    }
    console.log(colors.muted("  Continuing without a template...\n"));
  }

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
          colors.muted(`  Resuming from question ${startQuestion + 1}/5\n`),
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
      placeholder: selectedTemplate
        ? `e.g. ${selectedTemplate.icpHint.split(" who ")[0]} struggle with...`
        : "e.g. Freelancers lose deals because proposals look amateur",
      validate: (value: string) => {
        if (value.length < 5) return undefined; // Allow short, will soft-warn
        const solutionPatterns =
          /^(i want to build|a tool that|an app that|a platform)/i;
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
        selectedTemplate?.icpHint ||
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
      placeholder: selectedTemplate
        ? `e.g. A ${selectedTemplate.category} tool that lets users...`
        : "e.g. Fill a form, get a PDF in 60 seconds",
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
        const currentSlug =
          slug || slugify((answers.name as string) || "untitled");
        saveDraft(currentSlug, answers, i);
        console.log(
          `\n${colors.muted(`Session paused. Run`)} ${colors.primary(`loopkit init ${currentSlug}`)} ${colors.muted("to resume.")}`,
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

    // Record brief categories for trending (IE-8)
    if (isTelemetryEnabled()) {
      recordBriefCategories({
        icpCategory: categorizeICP(finalAnswers.icp),
        problemCategory: categorizeProblem(finalAnswers.problem),
        mvpCategory: categorizeMVP(finalAnswers.mvp),
      });
    }

    // Update active project
    const config = readConfig();
    config.activeProject = slug;
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);

    // Render
    renderBrief(finalAnswers, brief, slug);

    if (!selectedTemplate && options?.template === undefined) {
      const useTemplate = await p.confirm({
        message: "Add starter tasks from a project template?",
      });

      if (!p.isCancel(useTemplate) && useTemplate) {
        const templateOptions = getTemplateList().map((t) => ({
          value: t.id,
          label: `${t.name} — ${t.description}`,
        }));

        const choice = await p.select({
          message: "Choose a template:",
          options: templateOptions,
        });

        if (!p.isCancel(choice)) {
          selectedTemplate = getTemplate(choice);
        }
      }
    }

    // Create tasks.md scaffold from template (F5 / F5-AI)
    if (selectedTemplate) {
      const { createTasksScaffold, writeTasksFile, readTasksFile } =
        await import("../storage/local.js");
      createTasksScaffold(slug, finalAnswers.name);
      const existing = readTasksFile(slug) || "";

      // F5-AI: Personalize scaffold via AI, fallback to hardcoded
      let taskList = selectedTemplate.taskScaffold;
      try {
        const scaffold = await generateStructured({
          command: "init",
          system: SCAFFOLD_SYSTEM_PROMPT,
          prompt: buildScaffoldPrompt(
            finalAnswers,
            selectedTemplate.name,
            selectedTemplate.taskScaffold,
          ),
          schema: ScaffoldSchema,
          tier: "fast",
          temperature: 0.3,
        });

        // Deduplicate by normalized string
        const seen = new Set<string>();
        const deduped = scaffold.tasks.filter((t) => {
          const norm = t
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 40);
          if (seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });

        if (deduped.length >= 5) {
          taskList = deduped;
        }
      } catch {
        // AI failed — use hardcoded scaffold (silent fallback)
      }

      const scaffoldTasks = taskList
        .map((t) => `- [ ] ${t} — created:${formatDate(new Date())}`)
        .join("\n");
      const updated = existing.replace(
        "## Backlog\n",
        `## Backlog\n${scaffoldTasks}\n`,
      );
      writeTasksFile(slug, updated);
      console.log(
        info(
          `Template "${selectedTemplate.name}" applied — ${taskList.length} tasks added to backlog.`,
        ),
      );
    }

    // Show trend hint (IE-8.4)
    renderTrendHint(finalAnswers);

    // ─── Validation mode (if --validate flag is set) ─────────────────
    if (options?.validate) {
      const vSpinner = p.spinner();
      vSpinner.start("Running devil's advocate validation...");

      try {
        const validation = await generateStructured({
          command: "init",
          system: VALIDATION_SYSTEM_PROMPT,
          prompt: buildValidationPrompt({
            productName: finalAnswers.name,
            problem: finalAnswers.problem,
            icp: finalAnswers.icp,
            bet: brief.bet,
            riskiestAssumption: brief.riskiestAssumption,
            mvpPlainEnglish: brief.mvpPlainEnglish,
          }),
          schema: ValidationQuestionsSchema,
          tier: "fast",
          temperature: 0.4,
        });

        vSpinner.stop("Validation complete.");

        console.log(header("🎯 Devil's Advocate Questions"));
        console.log(box(validation.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")));
        console.log(colors.dim(validation.encouragement));

        const wantIterate = await p.confirm({
          message: "Want to iterate on your brief based on these questions?",
        });

        if (!p.isCancel(wantIterate) && wantIterate) {
          console.log(info("Run `loopkit init --analyze <name>` to update your brief."));
        }
      } catch {
        vSpinner.stop("Validation failed.");
        console.log(colors.warning("AI unavailable — skipping validation."));
      }
    }
  } catch (error) {
    s.stop("AI analysis unavailable.");

    // Save without scores
    saveBrief(slug, finalAnswers);
    deleteDraft(slug);

    console.log(
      colors.warning(
        `\n  Saved answers without scoring. Run ${colors.primary(`loopkit init --analyze ${slug}`)} when online.\n`,
      ),
    );

    const config = readConfig();
    config.activeProject = slug;
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);
  }

  console.log(nextStep("track"));
  console.log(
    colors.dim(
      "\n  💡 Set a Sunday reminder to close your week:\n" +
      "     macOS: Add a weekly calendar event for Sunday 6pm\n" +
      `     Or cron: 0 18 * * 0 cd ${process.cwd()} && loopkit loop\n`
    )
  );
  p.outro(colors.muted("Brief saved. Now build against it."));

  // ─── Install cron job if --cron flag is set ───────────────────────
  if (options?.cron) {
    const installed = await installFridayReminder();
    if (installed) {
      console.log(info("Friday reminder cron job installed. You'll get a reminder at 4 PM every Friday."));
    } else {
      console.log(colors.warning("Cron job already installed or failed to install."));
    }
  }

  // ─── Prompt to install shell aliases (first-time users) ─────────────
  const config = readConfig();
  if (!config.aliasesInstalled) {
    const wantAliases = await p.confirm({
      message: "Install shell aliases for faster commands? (Recommended)",
    });

    if (!p.isCancel(wantAliases) && wantAliases) {
      const installed = await installAliases();
      if (installed) {
        console.log(info("Shell aliases installed: lk, lks, lkl, lkt"));
        console.log(colors.muted("Restart your shell to apply changes."));
        config.aliasesInstalled = true;
        const { writeConfig } = await import("../storage/local.js");
        writeConfig(config);
      }
    }
  }
}

// ─── Render Brief ───────────────────────────────────────────────

function renderBrief(
  answers: InitAnswers,
  brief: {
    bet: string;
    uncomfortableTruth: string;
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
  slug: string,
): void {
  console.log(
    box(
      [
        `${colors.danger.bold("THE UNCOMFORTABLE TRUTH")}`,
        brief.uncomfortableTruth,
        "",
        `${colors.white.bold("THE BET")}`,
        `${colors.dim('"')}${brief.bet}${colors.dim('"')}`,
        "",
        `${colors.secondary.bold("VALIDATE TONIGHT")}`,
        brief.validateAction,
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
        `${colors.white.bold("MVP IN PLAIN ENGLISH")}`,
        brief.mvpPlainEnglish,
      ].join("\n"),
      answers.name,
    ),
  );

  console.log(`\n${info(`Saved → .loopkit/projects/${slug}/brief.md`)}`);
}

// ─── Analyze Existing ───────────────────────────────────────────

async function analyzeExisting(name: string): Promise<void> {
  const slug = slugify(name);
  const { readBriefJson } = await import("../storage/local.js");
  const data = readBriefJson(slug);

  if (!data) {
    console.log(
      colors.danger(`No brief found for "${name}". Run loopkit init first.`),
    );
    process.exit(1);
  }

  if (data.brief) {
    console.log(
      colors.warning(
        `"${name}" already has AI analysis. Run loopkit init to overwrite.`,
      ),
    );
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

// ─── IE-8.4: Trend Hint Renderer ────────────────────────────────

function renderTrendHint(answers: InitAnswers): void {
  const trending = getLocalTrendingData();
  if (trending.totalFounders < 2) return;

  const icpCat = categorizeICP(answers.icp);
  const similarCount = (trending.icp[icpCat] || 0) - 1;

  if (similarCount >= 1) {
    console.log("");
    console.log(colors.primary.bold("  Trending Validation"));
    console.log(
      colors.dim(
        `  ${similarCount} other founder${similarCount > 1 ? "s" : ""} ${similarCount > 1 ? "are" : "is"} exploring similar ICP spaces this month.`,
      ),
    );
    console.log(
      colors.dim(
        "  Run `loopkit radar` to see recent launches in your category.",
      ),
    );
  }
}
