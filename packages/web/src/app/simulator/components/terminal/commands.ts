import type { SimulatorState, TerminalLine, Action } from "./state";
import {
  line,
  blank,
  sleep,
  typeLines,
  showSpinner,
  animateScore,
  nextLineId,
} from "./animations";
import {
  SAMPLE_PROJECT,
  SAMPLE_TEMPLATE_TASKS,
  SAMPLE_SHIP_DRAFTS,
  SAMPLE_PULSE_RESPONSES,
  SAMPLE_PULSE_CLUSTERS,
  SAMPLE_RADAR_LAUNCHES,
  SAMPLE_KEYWORDS,
  SAMPLE_TIMING,
  SAMPLE_COACHING_MOMENTS,
} from "./mockData";

type AddLine = (l: TerminalLine) => void;
type Dispatch = (a: Action) => void;

export interface CommandContext {
  state: SimulatorState;
  dispatch: Dispatch;
  addLine: AddLine;
  promptUser: (question: string) => Promise<string>;
}

type CommandHandler = (args: string[], ctx: CommandContext) => Promise<void>;

const handlers: Record<string, CommandHandler> = {
  "loopkit init": handleInit,
  "loopkit track": handleTrack,
  "loopkit ship": handleShip,
  "loopkit pulse": handlePulse,
  "loopkit loop": handleLoop,
  "loopkit radar": handleRadar,
  "loopkit keywords": handleKeywords,
  "loopkit timing": handleTiming,
  "loopkit coach": handleCoach,
  "loopkit celebrate": handleCelebrate,
  "loopkit auth": handleAuth,
  "loopkit telemetry": handleTelemetry,
  help: handleHelp,
  clear: handleClear,
  reset: handleReset,
};

export function parseCommand(
  input: string,
): { name: string; args: string[] } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const name of Object.keys(handlers)) {
    if (trimmed === name || trimmed.startsWith(name + " ")) {
      const rest = trimmed.slice(name.length).trim();
      const args = rest ? rest.split(/\s+/) : [];
      return { name, args };
    }
  }

  return { name: trimmed, args: [] };
}

export function getHandler(name: string): CommandHandler | undefined {
  return handlers[name];
}

// ─── Init ──────────────────────────────────────────────────
async function handleInit(_args: string[], ctx: CommandContext): Promise<void> {
  const { dispatch, addLine, promptUser, state } = ctx;

  if (state.project) {
    addLine(
      line(
        `  Project '${state.project.name}' already exists.`,
        "text-amber-400",
      ),
    );
    addLine(line("  Run 'reset' to start fresh.", "text-zinc-500"));
    return;
  }

  dispatch({ type: "SET_PHASE", phase: "init" });
  addLine(blank());
  addLine(line("◆ LoopKit — Define your product", "text-violet-400"));
  addLine(
    line("│ This takes 4 minutes. Be honest, not optimistic.", "text-zinc-500"),
  );
  addLine(blank());

  const questions = [
    { key: "name", prompt: "◇ What's the product called?" },
    { key: "problem", prompt: "◇ What problem does it solve?" },
    { key: "icp", prompt: "◇ Who is your ideal customer?" },
    { key: "whyUnsolved", prompt: "◇ Why hasn't this been solved?" },
    { key: "mvp", prompt: "◇ What's your MVP? (smallest version)" },
  ];

  const answers: Record<string, string> = {};

  for (const q of questions) {
    addLine(line(q.prompt, "text-white"));
    const answer = await promptUser(
      SAMPLE_PROJECT.answers[q.key as keyof typeof SAMPLE_PROJECT.answers],
    );
    answers[q.key] = answer;
    addLine(line(`│ ${answer}`, "text-cyan-400"));
    addLine(blank());
  }

  await showSpinner("Analyzing your brief...", addLine, 1800);
  addLine(blank());

  const { scores, riskiestAssumption, validationAction } = SAMPLE_PROJECT;

  addLine(
    line(`┌─ ${answers.name} ────────────────────────────┐`, "text-zinc-600"),
  );
  addLine(line("│ THE BET                                    │", "text-white"));
  addLine(line(`│ "${answers.problem.slice(0, 42)}..."│`, "text-zinc-300"));
  addLine(
    line("│                                            │", "text-zinc-700"),
  );

  await animateScore("│ ICP", scores.icp, 10, addLine, "text-emerald-400");
  await animateScore(
    "│ PROBLEM",
    scores.problem,
    10,
    addLine,
    "text-emerald-400",
  );
  await animateScore("│ MVP", scores.mvp, 10, addLine, "text-amber-400");
  addLine(
    line("│                                            │", "text-zinc-700"),
  );
  addLine(
    line("│ OVERALL  ████████░░ 8/10                   │", "text-violet-400"),
  );
  addLine(
    line("│                                            │", "text-zinc-700"),
  );
  addLine(
    line("│ 🔴 RISKIEST ASSUMPTION                     │", "text-red-400"),
  );
  addLine(line(`│ ${riskiestAssumption}`, "text-zinc-300"));
  addLine(
    line("│                                            │", "text-zinc-700"),
  );
  addLine(
    line("│ ✅ VALIDATION ACTION                       │", "text-emerald-400"),
  );
  addLine(line(`│ ${validationAction}`, "text-zinc-300"));
  addLine(
    line("└────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(blank());

  // Template prompt
  addLine(line("◆ Project templates available:", "text-violet-400"));
  addLine(
    line(
      "  saas · api · mobile · cli · newsletter · agency · open-source · marketplace · ai-wrapper",
      "text-zinc-500",
    ),
  );
  addLine(line("  Using template: saas (default)", "text-zinc-500"));
  addLine(blank());

  await showSpinner("Personalizing task scaffold with AI...", addLine, 1200);
  addLine(blank());

  dispatch({
    type: "SET_PROJECT",
    project: {
      name: answers.name,
      slug: answers.name.toLowerCase().replace(/\s+/g, "-"),
      answers,
      scores,
      riskiestAssumption,
      validationAction,
      brief: `Building ${answers.name}: ${answers.problem}`,
    },
  });
  dispatch({ type: "SET_TEMPLATE", template: "saas" });
  dispatch({ type: "ADD_TASKS", tasks: SAMPLE_TEMPLATE_TASKS });

  addLine(
    line(
      "✓ Brief saved to .loopkit/projects/proposalai/brief.json",
      "text-emerald-400",
    ),
  );
  addLine(
    line(
      "✓ Tasks scaffolded to .loopkit/projects/proposalai/tasks.md",
      "text-emerald-400",
    ),
  );
  addLine(
    line("✓ Config updated: activeProject = 'proposalai'", "text-emerald-400"),
  );
  addLine(blank());
  addLine(line("  Next: loopkit track", "text-zinc-500"));
  addLine(blank());
}

// ─── Track ─────────────────────────────────────────────────
async function handleTrack(args: string[], ctx: CommandContext): Promise<void> {
  const { state, dispatch, addLine, promptUser } = ctx;

  if (!state.project) {
    addLine(
      line("  No active project. Run 'loopkit init' first.", "text-amber-400"),
    );
    return;
  }

  if (args[0] === "--add") {
    const title =
      args.slice(1).join(" ") || (await promptUser("Enter task title:"));
    if (!title) {
      addLine(line("  No task text provided.", "text-zinc-500"));
      return;
    }
    dispatch({
      type: "ADD_TASKS",
      tasks: [{ title, createdAt: new Date().toISOString().split("T")[0] }],
    });
    addLine(
      line(`✓ Task #${state.nextTaskId} added: ${title}`, "text-emerald-400"),
    );
    return;
  }

  dispatch({ type: "SET_PHASE", phase: "develop" });
  addLine(blank());
  addLine(line("◆ LoopKit — Task Board", "text-cyan-400"));
  addLine(line(`│ Project: ${state.project.name}`, "text-zinc-500"));
  addLine(blank());

  if (state.tasks.length === 0) {
    addLine(
      line(
        "  No tasks found. Run 'loopkit track --add \"Task\"' to create one.",
        "text-zinc-500",
      ),
    );
    return;
  }

  const done = state.tasks.filter((t) => t.status === "done");
  const open = state.tasks.filter((t) => t.status === "open");
  const score =
    state.tasks.length > 0
      ? Math.round((done.length / state.tasks.length) * 100)
      : 0;

  addLine(line("  This Week", "text-white"));
  for (const task of state.tasks) {
    const icon = task.status === "done" ? "✓" : "○";
    const color = task.status === "done" ? "text-emerald-400" : "text-zinc-400";
    const suffix = task.status === "done" ? ` (${task.closedAt})` : "";
    addLine(line(`  ${icon} #${task.id} ${task.title}${suffix}`, color));
  }

  addLine(blank());
  const scoreColor =
    score >= 70
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-red-400";
  addLine(
    line(
      `  Shipping Score: ${score}% (${done.length}/${state.tasks.length})`,
      scoreColor,
    ),
  );
  addLine(blank());

  // Stale task detection
  if (open.length > 0) {
    const staleTask = open[0];
    addLine(
      line(
        `  ⚠ Task #${staleTask.id} "${staleTask.title}" has been open for 3+ days.`,
        "text-amber-400",
      ),
    );
    addLine(line("    Keep / Snooze / Cut?", "text-zinc-500"));
    const action = await promptUser("keep");
    if (action === "cut") {
      dispatch({ type: "COMPLETE_TASK", id: staleTask.id });
      addLine(
        line(`  ✓ Task #${staleTask.id} archived to cut.md`, "text-zinc-500"),
      );
    } else if (action === "snooze") {
      addLine(
        line(`  ⏰ Task #${staleTask.id} snoozed for 3 days`, "text-zinc-500"),
      );
    } else {
      addLine(line(`  ✓ Task #${staleTask.id} kept`, "text-zinc-500"));
    }
  }

  // Auto-complete some tasks for demo
  if (done.length === 0 && open.length >= 3) {
    addLine(blank());
    addLine(
      line(
        "  💡 Tip: Reference task numbers in git commits to auto-close them:",
        "text-zinc-500",
      ),
    );
    addLine(
      line('    git commit -m "feat: set up auth [#1]"', "text-cyan-400"),
    );
  }

  addLine(blank());
}

// ─── Ship ──────────────────────────────────────────────────
async function handleShip(_args: string[], ctx: CommandContext): Promise<void> {
  const { state, dispatch, addLine, promptUser } = ctx;

  if (!state.project) {
    addLine(
      line("  No active project. Run 'loopkit init' first.", "text-amber-400"),
    );
    return;
  }

  dispatch({ type: "SET_PHASE", phase: "deliver" });
  addLine(blank());
  addLine(line("◆ LoopKit — Ship", "text-emerald-400"));
  addLine(line("│ What's the main thing you shipped?", "text-zinc-500"));
  addLine(blank());

  const whatShipped = await promptUser(
    "Launched the MVP with auth and core feature",
  );
  addLine(line(`│ ${whatShipped}`, "text-cyan-400"));
  addLine(blank());

  // Pre-launch checklist
  addLine(line("◆ Pre-launch Checklist", "text-emerald-400"));
  const checks = [
    "README updated",
    "Landing page live",
    "Analytics set up",
    "Feedback channel ready",
  ];
  for (const check of checks) {
    addLine(line(`  ✓ ${check}`, "text-emerald-400"));
    await sleep(150);
  }
  addLine(blank());

  await showSpinner("Generating launch drafts...", addLine, 2000);
  addLine(blank());

  const { hn, twitter, ih } = SAMPLE_SHIP_DRAFTS;

  // HN Draft
  addLine(
    line("┌─ Show HN ────────────────────────────────────┐", "text-zinc-600"),
  );
  addLine(line(`│ ${hn.title}`, "text-white"));
  addLine(line("│", "text-zinc-700"));
  for (const l of hn.body.split("\n").slice(0, 6)) {
    addLine(line(`│ ${l.slice(0, 46)}`, "text-zinc-400"));
  }
  addLine(line("│ ...", "text-zinc-500"));
  addLine(
    line("└───────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(line("  [u]se  [e]dit  [r]egenerate  [s]kip", "text-zinc-500"));
  addLine(line("  → Used", "text-emerald-400"));
  addLine(blank());

  // Twitter Draft
  addLine(
    line("┌─ Twitter Thread ─────────────────────────────┐", "text-zinc-600"),
  );
  for (let i = 0; i < twitter.tweets.length; i++) {
    addLine(
      line(
        `│ ${i + 1}/${twitter.tweets.length} ${twitter.tweets[i].slice(0, 42)}`,
        "text-white",
      ),
    );
    if (i < twitter.tweets.length - 1) addLine(line("│", "text-zinc-700"));
  }
  addLine(
    line("└───────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(line("  [u]se  [e]dit  [r]egenerate  [s]kip", "text-zinc-500"));
  addLine(line("  → Used", "text-emerald-400"));
  addLine(blank());

  // IH Draft
  addLine(
    line("┌─ Indie Hackers ──────────────────────────────┐", "text-zinc-600"),
  );
  for (const l of ih.body.split("\n").slice(0, 5)) {
    addLine(line(`│ ${l.slice(0, 46)}`, "text-zinc-400"));
  }
  addLine(line("│ ...", "text-zinc-500"));
  addLine(
    line("└───────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(line("  [u]se  [e]dit  [r]egenerate  [s]kip", "text-zinc-500"));
  addLine(line("  → Skipped", "text-zinc-500"));
  addLine(blank());

  dispatch({
    type: "ADD_SHIP",
    ship: { date: new Date().toISOString().split("T")[0], whatShipped },
  });

  addLine(
    line(
      "✓ Ship log saved to .loopkit/ships/2026-04-26.md",
      "text-emerald-400",
    ),
  );
  addLine(blank());
  addLine(
    line(
      "  🚀 You shipped! Run 'loopkit celebrate' for your reward.",
      "text-zinc-500",
    ),
  );
  addLine(blank());
}

// ─── Pulse ─────────────────────────────────────────────────
async function handlePulse(args: string[], ctx: CommandContext): Promise<void> {
  const { state, dispatch, addLine, promptUser } = ctx;

  if (args[0] === "--add") {
    const text =
      args.slice(1).join(" ") || (await promptUser("Enter feedback:"));
    dispatch({ type: "ADD_PULSE_RESPONSES", responses: [text] });
    const total = state.pulseResponses.length + 1;
    addLine(
      line(
        `✓ Response added (${total} total). ${total < 5 ? `Need ${5 - total} more for AI clustering.` : ""}`,
        "text-emerald-400",
      ),
    );
    return;
  }

  if (args[0] === "--share") {
    addLine(blank());
    addLine(line("◆ Pulse — Share Feedback Form", "text-amber-400"));
    addLine(
      line("  URL: https://loopkit.dev/pulse/proposalai", "text-cyan-400"),
    );
    addLine(line("  QR code displayed (scan to open)", "text-zinc-500"));
    addLine(
      line(
        '  Embed widget: <script src="loopkit.dev/widget.js"></script>',
        "text-zinc-500",
      ),
    );
    addLine(blank());
    return;
  }

  // Add sample responses if none exist
  if (state.pulseResponses.length === 0) {
    dispatch({
      type: "ADD_PULSE_RESPONSES",
      responses: SAMPLE_PULSE_RESPONSES,
    });
  }

  const responses =
    state.pulseResponses.length > 0
      ? state.pulseResponses
      : SAMPLE_PULSE_RESPONSES;

  addLine(blank());
  addLine(line("◆ LoopKit — Pulse Inbox", "text-amber-400"));
  addLine(line(`│ ${responses.length} responses collected`, "text-zinc-500"));
  addLine(blank());

  if (responses.length < 5) {
    addLine(
      line(
        `  Need ${5 - responses.length} more responses for AI clustering.`,
        "text-zinc-500",
      ),
    );
    addLine(line("  Raw responses:", "text-zinc-500"));
    for (const r of responses) {
      addLine(line(`  • ${r}`, "text-zinc-400"));
    }
    return;
  }

  await showSpinner("Clustering feedback...", addLine, 1500);
  addLine(blank());

  const clusters = SAMPLE_PULSE_CLUSTERS;
  dispatch({ type: "SET_PULSE_CLUSTERS", clusters });

  for (const cluster of clusters) {
    const icon =
      cluster.label === "Fix now"
        ? "🔴"
        : cluster.label === "Validate later"
          ? "🟡"
          : "⚪";
    const color =
      cluster.label === "Fix now"
        ? "text-red-400"
        : cluster.label === "Validate later"
          ? "text-amber-400"
          : "text-zinc-400";
    addLine(line(`${icon} ${cluster.label} (${cluster.count})`, color));
    addLine(line(`  ${cluster.pattern}`, "text-white"));
    for (const q of cluster.quotes.slice(0, 2)) {
      addLine(line(`  → ${q}`, "text-zinc-400"));
    }
    addLine(blank());
  }

  addLine(line("  Confidence: 85% clearly clustered", "text-zinc-500"));
  addLine(blank());
  addLine(
    line(
      "  Tag 'Template editor UX is confusing' to this week's sprint?",
      "text-zinc-500",
    ),
  );
  addLine(line("  → Task added to tasks.md", "text-emerald-400"));
  addLine(blank());
}

// ─── Loop ──────────────────────────────────────────────────
async function handleLoop(_args: string[], ctx: CommandContext): Promise<void> {
  const { state, dispatch, addLine, promptUser } = ctx;

  dispatch({ type: "SET_PHASE", phase: "iterate" });

  const done = state.tasks.filter((t) => t.status === "done");
  const total = state.tasks.length || 8;
  const completed = Math.max(done.length, 4);
  const score = Math.round((completed / total) * 100);

  addLine(blank());
  addLine(line("◆ LoopKit — Sunday Ritual", "text-red-400"));
  addLine(
    line(
      `│ Week ${state.week} · ${state.project?.name || "No project"}`,
      "text-zinc-500",
    ),
  );
  addLine(blank());

  await showSpinner("Aggregating your week...", addLine, 1000);
  addLine(blank());

  addLine(line("  Week Summary", "text-white"));
  addLine(line(`  Tasks completed: ${completed}/${total}`, "text-zinc-400"));
  addLine(
    line(
      `  Shipping Score: ${score}%`,
      score >= 70 ? "text-emerald-400" : "text-amber-400",
    ),
  );
  addLine(
    line(
      `  Shipped Friday: ${state.ships.length > 0 ? "Yes ✓" : "No"}`,
      state.ships.length > 0 ? "text-emerald-400" : "text-zinc-400",
    ),
  );
  addLine(
    line(
      `  Pulse Responses: ${state.pulseResponses.length || 8}`,
      "text-zinc-400",
    ),
  );
  addLine(
    line(
      `  Streak: 🔥 ${state.streak + 1} consecutive week${state.streak + 1 !== 1 ? "s" : ""}`,
      "text-amber-400",
    ),
  );
  addLine(blank());

  await showSpinner("Synthesizing your week...", addLine, 1500);
  addLine(blank());

  const oneThing =
    "Ship the template editor — it's 80% done and blocking everything else";
  const rationale =
    "3/8 pulse responses mention template confusion. Your shipping score is strong (80%). This is the highest-leverage fix before next ship.";
  const bipPost = `Week ${state.week} of building ${state.project?.name || "my project"}. Shipped: AI proposal generation. Learned: Template UX is the real bottleneck. Next: Fix it.`;

  addLine(
    line("┌─ The One Thing ──────────────────────────────┐", "text-zinc-600"),
  );
  addLine(line(`│ ${oneThing}`, "text-white"));
  addLine(
    line("│                                              │", "text-zinc-700"),
  );
  addLine(line(`│ ${rationale.slice(0, 46)}`, "text-zinc-400"));
  addLine(line(`│ ${rationale.slice(46, 92)}`, "text-zinc-400"));
  addLine(
    line("│                                              │", "text-zinc-700"),
  );
  addLine(
    line("│ ⚡ Tension: Your track plan focuses on       │", "text-amber-400"),
  );
  addLine(
    line("│ 'API docs' but pulse says 'onboarding'       │", "text-amber-400"),
  );
  addLine(
    line("│ is the blocker. Consider reprioritizing.     │", "text-amber-400"),
  );
  addLine(
    line("└──────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(blank());
  addLine(line("  Accept / Change / Skip", "text-zinc-500"));
  const choice = await promptUser("accept");
  if (choice === "accept" || choice === "") {
    addLine(line("  ✓ Accepted", "text-emerald-400"));
  }
  addLine(blank());

  addLine(
    line("┌─ BIP Post (280 chars) ───────────────────────┐", "text-zinc-600"),
  );
  addLine(line(`│ ${bipPost.slice(0, 46)}`, "text-white"));
  addLine(line(`│ ${bipPost.slice(46, 92)}`, "text-white"));
  addLine(line(`│ ${bipPost.slice(92)}`, "text-white"));
  addLine(
    line("└──────────────────────────────────────────────┘", "text-zinc-600"),
  );
  addLine(blank());

  dispatch({
    type: "ADD_LOOP",
    loop: {
      week: state.week,
      score,
      tasksCompleted: completed,
      tasksTotal: total,
      oneThing,
      bipPost,
    },
  });

  addLine(
    line(
      `✓ Loop log saved to .loopkit/logs/week-${state.week}.md`,
      "text-emerald-400",
    ),
  );
  addLine(blank());
  addLine(line("  Next: loopkit track", "text-zinc-500"));
  addLine(blank());
}

// ─── Radar ─────────────────────────────────────────────────
async function handleRadar(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { addLine } = ctx;

  addLine(blank());
  addLine(line("◆ LoopKit — Competitor Ship Radar", "text-cyan-400"));
  addLine(line("│ Scanning Product Hunt + Hacker News...", "text-zinc-500"));
  addLine(blank());

  await showSpinner("Fetching recent launches...", addLine, 1200);
  addLine(blank());

  addLine(line("  5 launches found in 'saas' category", "text-white"));
  addLine(blank());

  addLine(
    line("  Name              Platform   Relevance  Date", "text-zinc-500"),
  );
  addLine(
    line(
      "  ─────────────────────────────────────────────────",
      "text-zinc-800",
    ),
  );

  for (const launch of SAMPLE_RADAR_LAUNCHES) {
    const relColor =
      launch.relevance >= 70
        ? "text-red-400"
        : launch.relevance >= 50
          ? "text-amber-400"
          : "text-zinc-400";
    addLine(
      line(
        `  ${launch.name.padEnd(18)} ${launch.platform.padEnd(11)} ${String(launch.relevance).padStart(3)}%        ${launch.date}`,
        relColor,
      ),
    );
  }

  addLine(blank());
  addLine(line("  Avg relevance: 61%", "text-zinc-500"));
  addLine(line("  Results cached for 24 hours", "text-zinc-500"));
  addLine(blank());
}

// ─── Keywords ──────────────────────────────────────────────
async function handleKeywords(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { addLine } = ctx;

  addLine(blank());
  addLine(line("◆ LoopKit — Keyword Opportunities", "text-amber-400"));
  addLine(
    line(
      "│ Scanning Google Autocomplete + Reddit + GitHub...",
      "text-zinc-500",
    ),
  );
  addLine(blank());

  await showSpinner("Analyzing keywords...", addLine, 1200);
  addLine(blank());

  addLine(
    line(
      `  Found ${SAMPLE_KEYWORDS.length} keyword opportunities`,
      "text-white",
    ),
  );
  addLine(line("  3 low-hanging fruit", "text-emerald-400"));
  addLine(blank());

  addLine(
    line(
      "  Keyword                      Score  Volume      Competition",
      "text-zinc-500",
    ),
  );
  addLine(
    line(
      "  ─────────────────────────────────────────────────────────────────",
      "text-zinc-800",
    ),
  );

  for (const kw of SAMPLE_KEYWORDS) {
    const scoreColor =
      kw.score >= 70
        ? "text-emerald-400"
        : kw.score >= 55
          ? "text-amber-400"
          : "text-zinc-400";
    const volBar =
      kw.volume === "high"
        ? "███ high"
        : kw.volume === "medium"
          ? "██░ medium"
          : "█░░ low";
    addLine(
      line(
        `  ${kw.keyword.padEnd(28)} ${String(kw.score).padStart(3)}  ${volBar.padEnd(10)} ${kw.competition}`,
        scoreColor,
      ),
    );
  }

  addLine(blank());
  addLine(
    line("  Results cached for 7 days. No API keys required.", "text-zinc-500"),
  );
  addLine(blank());
}

// ─── Timing ────────────────────────────────────────────────
async function handleTiming(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { addLine } = ctx;

  addLine(blank());
  addLine(line("◆ LoopKit — Market Timing Signal", "text-emerald-400"));
  addLine(line("│ Category: saas", "text-zinc-500"));
  addLine(blank());

  await showSpinner("Analyzing market signals...", addLine, 1200);
  addLine(blank());

  const {
    compositeScore,
    signal,
    fundingTrend,
    fundingCount,
    devTrend,
    devGrowth,
    hiringTrend,
    hiringCount,
  } = SAMPLE_TIMING;

  const signalColor =
    signal === "Heating"
      ? "text-emerald-400"
      : signal === "Cooling"
        ? "text-red-400"
        : "text-zinc-400";
  addLine(line(`  Composite Score: ${compositeScore}/100`, signalColor));
  addLine(line(`  Signal: ${signal}`, signalColor));
  addLine(blank());

  addLine(
    line(
      `  ${fundingTrend} Funding velocity: ${fundingCount} rounds/30d`,
      "text-cyan-400",
    ),
  );
  addLine(
    line(
      `  ${devTrend} Developer activity: +${devGrowth}% repo growth`,
      "text-emerald-400",
    ),
  );
  addLine(
    line(
      `  ${hiringTrend} Hiring demand: ${hiringCount} postings/30d`,
      "text-amber-400",
    ),
  );
  addLine(blank());

  addLine(
    line("  The space is heating up. Good time to ship.", "text-emerald-400"),
  );
  addLine(line("  Results cached for 7 days.", "text-zinc-500"));
  addLine(blank());
}

// ─── Coach ─────────────────────────────────────────────────
async function handleCoach(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { addLine } = ctx;

  addLine(blank());
  addLine(line("◆ LoopKit — AI Coach", "text-violet-400"));
  addLine(line("│ Your shipping patterns, analyzed.", "text-zinc-500"));
  addLine(blank());

  for (const moment of SAMPLE_COACHING_MOMENTS) {
    const icon = moment.priority === "warning" ? "⚠️" : "ℹ️";
    const color =
      moment.priority === "warning" ? "text-amber-400" : "text-cyan-400";

    addLine(line(`${icon} ${moment.title}`, color));
    addLine(line(`  ${moment.message}`, "text-zinc-300"));
    addLine(line(`  → ${moment.action}`, "text-zinc-500"));
    if (moment.command) {
      addLine(line(`  Run: ${moment.command}`, "text-zinc-500"));
    }
    addLine(blank());
  }

  addLine(
    line(
      "  Coaching respects your attention: max 1 moment per command.",
      "text-zinc-500",
    ),
  );
  addLine(blank());
}

// ─── Celebrate ─────────────────────────────────────────────
async function handleCelebrate(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { state, addLine } = ctx;

  addLine(blank());

  const confetti = [
    "  ✦ ·  ✧  ·  ✦  ·  ✧  ·  ✦",
    " ·  ✧  ✦  ·  ✧  ·  ✦  ✧  · ",
    "  ✧  ·  ✦  ·  ✧  ✦  ·  ✧  ·",
  ];
  for (const c of confetti) {
    addLine(line(c, "text-amber-400"));
    await sleep(100);
  }

  addLine(blank());
  addLine(line("  🚀 YOU SHIPPED!", "text-white"));
  addLine(blank());

  const score = 80;
  const rank =
    state.streak >= 4
      ? "Shipping Machine"
      : state.streak >= 2
        ? "Momentum Builder"
        : "Week 1 Energy";
  addLine(line(`  Ship Score: ${score}%`, "text-emerald-400"));
  addLine(line(`  Rank: ${rank}`, "text-violet-400"));
  addLine(
    line(
      `  Streak: 🔥 ${state.streak + 1} week${state.streak + 1 !== 1 ? "s" : ""}`,
      "text-amber-400",
    ),
  );
  addLine(blank());
  addLine(
    line(
      "  Share: 'Just shipped Week 3 of my project. The loop works.'",
      "text-zinc-500",
    ),
  );
  addLine(blank());
}

// ─── Auth ──────────────────────────────────────────────────
async function handleAuth(_args: string[], ctx: CommandContext): Promise<void> {
  const { addLine } = ctx;
  addLine(blank());
  addLine(line("◆ LoopKit — Authentication", "text-violet-400"));
  addLine(line("  Generating session...", "text-zinc-500"));
  await sleep(800);
  addLine(line("  Code: A7B9C2", "text-white"));
  addLine(
    line("  Open: http://localhost:3000/cli-auth?code=A7B9C2", "text-cyan-400"),
  );
  addLine(line("  (In real CLI, this opens your browser)", "text-zinc-500"));
  addLine(blank());
}

// ─── Telemetry ─────────────────────────────────────────────
async function handleTelemetry(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { addLine } = ctx;
  addLine(blank());
  addLine(line("◆ LoopKit — Telemetry", "text-zinc-400"));
  addLine(line("  Status: Opted in", "text-emerald-400"));
  addLine(line("  Events this week: 12", "text-zinc-500"));
  addLine(
    line("  Data: Anonymized ICP/problem/MVP categories only", "text-zinc-500"),
  );
  addLine(
    line(
      "  Commands: loopkit telemetry on|off|export|delete|status",
      "text-zinc-500",
    ),
  );
  addLine(blank());
}

// ─── Help ──────────────────────────────────────────────────
async function handleHelp(_args: string[], ctx: CommandContext): Promise<void> {
  const { addLine } = ctx;
  addLine(blank());
  addLine(line("◆ LoopKit Simulator — Commands", "text-violet-400"));
  addLine(blank());
  const cmds = [
    ["loopkit init", "Define your product (5 questions + AI scoring)"],
    ["loopkit track", "View task board, manage tasks"],
    ["loopkit ship", "Generate launch drafts (HN/Twitter/IH)"],
    ["loopkit pulse", "Collect & cluster user feedback"],
    ["loopkit loop", "Sunday ritual — weekly synthesis"],
    ["loopkit radar", "Scan PH/HN for competitor launches"],
    ["loopkit keywords", "Find low-competition keywords"],
    ["loopkit timing", "Market timing signal (funding/dev/hiring)"],
    ["loopkit coach", "AI coaching moments"],
    ["loopkit celebrate", "ASCII confetti + ship card"],
    ["loopkit auth", "Authenticate with LoopKit"],
    ["loopkit telemetry", "View telemetry status"],
    ["help", "Show this help message"],
    ["clear", "Clear terminal output"],
    ["reset", "Reset all simulator state"],
  ];
  for (const [cmd, desc] of cmds) {
    addLine(line(`  ${cmd.padEnd(22)} ${desc}`, "text-zinc-400"));
  }
  addLine(blank());
  addLine(
    line(
      "  Click the quick command buttons above or type directly.",
      "text-zinc-500",
    ),
  );
  addLine(blank());
}

// ─── Clear ─────────────────────────────────────────────────
async function handleClear(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  // Handled by the terminal component (clears outputLines)
}

// ─── Reset ─────────────────────────────────────────────────
async function handleReset(
  _args: string[],
  ctx: CommandContext,
): Promise<void> {
  const { dispatch, addLine } = ctx;
  dispatch({ type: "RESET" });
  addLine(line("✓ Simulator reset. All state cleared.", "text-emerald-400"));
  addLine(blank());
}
