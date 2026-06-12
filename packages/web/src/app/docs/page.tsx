/**
 * /docs — Public documentation page.
 *
 * Sections (in order):
 *   - Quickstart (5 min to first brief)
 *   - The weekly loop (the 5 commands + what they do)
 *   - Command reference (every flag)
 *   - Workflow (what the first 4 weeks look like)
 *   - Troubleshooting (the 6 most common issues)
 *
 * No auth required. Server-rendered for fast first paint and SEO.
 * Linked from the landing page footer and the dashboard sidebar.
 */
import Link from "next/link";
import { Terminal, ArrowRight, AlertTriangle, Check, Clock, GitCommit, Heart, Mail, Sparkles, BookOpen, X } from "lucide-react";
import { CopyButton } from "../copy-button";

export const metadata = {
  title: "Docs — LoopKit",
  description:
    "4-minute install, 5 commands, one weekly loop. The full LoopKit manual.",
};

const COMMANDS = [
  {
    name: "init",
    purpose: "Define your product",
    description:
      "4 minutes, 5 questions. AI scores your bet on ICP, problem, and MVP. Writes brief.md and tasks.md. Run once per project.",
    color: "text-violet-400",
    flags: [
      { flag: "-t, --template <id>", desc: "Project template (saas, api, mobile, cli, newsletter, agency, open-source, marketplace, ai-wrapper)" },
      { flag: "--cron", desc: "Install a Friday reminder cron job" },
      { flag: "--validate", desc: "Trigger the Devil's Advocate validator" },
      { flag: "--analyze <name>", desc: "Run AI analysis on a saved session" },
    ],
    example: "npx loopkit init --template saas",
  },
  {
    name: "track",
    purpose: "Develop — manage tasks",
    description:
      "View your weekly checklist. Add, edit, snooze, or cut tasks. Git commits close tasks automatically. The day-to-day command.",
    color: "text-cyan-400",
    flags: [
      { flag: "-s, --stand", desc: "60-second standup check-in" },
      { flag: "-w, --week", desc: "Show the current week's summary card" },
      { flag: "-a, --add [title]", desc: "Add a new task (opens $EDITOR if no title given)" },
      { flag: "-r, --repair", desc: "Re-sequence task IDs" },
      { flag: "-p, --project <slug>", desc: "Switch active project" },
    ],
    example: "loopkit track -a 'Ship landing page'",
  },
  {
    name: "ship",
    purpose: "Deliver — draft launch posts",
    description:
      "AI generates launch copy for Hacker News, Twitter, and Indie Hackers in 60 seconds. You edit the tone, not the words.",
    color: "text-emerald-400",
    flags: [
      { flag: "--changelog", desc: "Generate a changelog-style post instead" },
      { flag: "--no-ai", desc: "Skip the AI and use a blank template" },
    ],
    example: "loopkit ship --changelog",
  },
  {
    name: "pulse",
    purpose: "Feedback — collect customer signals",
    description:
      "Async customer feedback that comes to you. AI clusters responses into Fix now, Validate later, and Noise. No meetings.",
    color: "text-amber-400",
    flags: [
      { flag: "--add <text>", desc: "Log a feedback entry inline" },
      { flag: "--raw", desc: "Plain list without AI clustering" },
      { flag: "--setup", desc: "Show setup instructions for the public form" },
      { flag: "--share", desc: "Generate a feedback submission URL + QR code" },
    ],
    example: "loopkit pulse --add 'User said pricing page is confusing'",
  },
  {
    name: "loop",
    purpose: "Iterate — close the week",
    description:
      "The Sunday ritual. 10 minutes. AI synthesis, one hard question, BIP post, streak counter. The whole game.",
    color: "text-red-400",
    flags: [
      { flag: "--revenue <amount>", desc: "Log MRR inline during the loop" },
      { flag: "--async", desc: "Complete the loop on any day within a 7-day grace window" },
    ],
    example: "loopkit loop --async",
  },
];

const TROUBLESHOOTING = [
  {
    problem: "My git commits aren't closing tasks",
    cause:
      "The post-commit hook isn't installed. The hook looks for `Closes #N` in your commit message, where N is the task ID.",
    fix: "Run `loopkit track` to reinstall the hook, or add it manually: see the .git/hooks/commit-msg docs.",
  },
  {
    problem: "AI features say 'rate limit exceeded'",
    cause:
      "You're on the free tier with 10 AI calls/day. Or the absolute 1000/day ceiling tripped.",
    fix: "Upgrade to Solo ($19/mo) for 100 calls/day, or bring your own Anthropic key with `loopkit auth --key sk-ant-...`.",
  },
  {
    problem: "I missed a Sunday — is my streak gone?",
    cause:
      "Strictly: yes. A Sunday loop is the whole point. But `--async` mode lets you complete any week's loop within a 7-day window.",
    fix: "Run `loopkit loop --async` this week. Your streak counter will pick up at the next loop day.",
  },
  {
    problem: "The dashboard shows different data than my CLI",
    cause:
      "The CLI and Convex use last-write-wins per task. Whichever wrote last wins. If you edit on the web, the CLI pulls on next sync.",
    fix: "Run `loopkit sync` to force a pull, or use one surface consistently during a session.",
  },
  {
    problem: "I want to delete a project and start over",
    cause:
      "Init is idempotent. Re-running it on the same slug overwrites the brief. To start fresh with a new project name, just run `loopkit init` with a different name.",
    fix: "Edit .loopkit/config.json to remove the activeProject, or pass a new name to `loopkit init`.",
  },
  {
    problem: "Convex is showing 'unauthorized' on every sync",
    cause:
      "Your auth token expired. The CLI caches an encrypted token in config.json; Convex rotates them after 30 days of inactivity.",
    fix: "Run `loopkit auth` again. The browser OAuth flow will refresh the token.",
  },
];

const FIRST_FOUR_WEEKS = [
  {
    week: 1,
    title: "The setup week",
    description:
      "Run `npx loopkit init`. Get a brief. Add 3-5 tasks. Ship one. Run `loopkit loop --async` on Sunday.",
    out: "Streak = 1. You have a brief.md that explains why this project exists.",
  },
  {
    week: 2,
    title: "The rhythm week",
    description:
      "Use `loopkit track` daily. Add tasks the night before, not the morning of. Run `loopkit ship` after your first closed task.",
    out: "Streak = 2. You have 1 public ship on /wins.",
  },
  {
    week: 3,
    title: "The pushback week",
    description:
      "This is the danger zone — energy drops. Use `loopkit next` whenever you feel lost. Cut 3 backlog tasks you don't need.",
    out: "Streak = 3 if you didn't miss. Most people quit here.",
  },
  {
    week: 4,
    title: "The identity week",
    description:
      "By now, Sunday loop is a habit. AI tells you your Shipping DNA (all-star / marathoner / sprinter / perfectionist / reactor).",
    out: "Streak = 4. You're now in the top 5% of solo founders by consistency.",
  },
];

export default function DocsPage() {
  return (
    <main id="main-content" className="relative max-w-4xl mx-auto px-6 py-16 sm:py-24">
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          The LoopKit manual.
        </h1>
        <p className="mt-4 text-zinc-400 text-lg max-w-2xl">
          4 minutes to install. 5 commands to learn. One weekly loop to maintain.
          This page covers everything you need to ship every Sunday.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="#quickstart" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 transition-colors">
            Quickstart
          </Link>
          <Link href="#commands" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 transition-colors">
            Commands
          </Link>
          <Link href="#workflow" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 transition-colors">
            Workflow
          </Link>
          <Link href="#troubleshooting" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 transition-colors">
            Troubleshooting
          </Link>
        </div>
      </header>

      {/* ─── Quickstart ─────────────────────────────────────── */}
      <section id="quickstart" className="mb-20 scroll-mt-20">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Quickstart</h2>
        <p className="text-zinc-400 mb-8">5 minutes from zero to first brief.</p>

        <div className="space-y-6">
          <Step n={1} title="Install">
            <p className="text-zinc-300 mb-3">No install required. Run from npm:</p>
            <CodeBlock code="npx loopkit init" />
          </Step>

          <Step n={2} title="Answer 5 questions">
            <p className="text-zinc-300 mb-3">
              The CLI asks for the product name, the problem, your ICP, why it's unsolved, and your MVP.
              Be honest, not optimistic. The AI scores the answers.
            </p>
            <p className="text-zinc-500 text-sm">
              Average time: <Clock className="h-3 w-3 inline" aria-hidden="true" /> 4 minutes.
            </p>
          </Step>

          <Step n={3} title="Get your brief">
            <p className="text-zinc-300">
              Two files get written to <code className="text-zinc-300 font-mono text-sm">.loopkit/projects/&lt;slug&gt;/</code>:
            </p>
            <ul className="mt-3 space-y-2 text-zinc-300 text-sm">
              <li><code className="text-zinc-300 font-mono">brief.md</code> — your falsifiable bet, scores, riskiest assumption</li>
              <li><code className="text-zinc-300 font-mono">tasks.md</code> — weekly checklist + backlog scaffold</li>
            </ul>
          </Step>

          <Step n={4} title="Plan your first week">
            <p className="text-zinc-300">
              Add 3-5 tasks to tasks.md. Pick the smallest thing you can ship in 48 hours.
              That's your <strong className="text-white">anchor task</strong> — the one you ship even if everything else falls apart.
            </p>
            <CodeBlock code="loopkit track -a 'Ship the landing page'" />
          </Step>

          <Step n={5} title="Ship & close the loop">
            <p className="text-zinc-300">
              Make a commit. Run <code className="text-zinc-300 font-mono">loopkit ship</code> to draft a launch post. On Sunday, run{" "}
              <code className="text-zinc-300 font-mono">loopkit loop</code> — 10 minutes. Streak starts.
            </p>
          </Step>
        </div>
      </section>

      {/* ─── Commands ─────────────────────────────────────────── */}
      <section id="commands" className="mb-20 scroll-mt-20">
        <h2 className="text-3xl font-bold tracking-tight mb-2">The 5 commands</h2>
        <p className="text-zinc-400 mb-8">
          Every command feeds the next. The loop closes itself.
        </p>

        <div className="space-y-4">
          {COMMANDS.map((cmd) => (
            <div
              key={cmd.name}
              className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30"
            >
              <div className="flex items-baseline gap-3 mb-3">
                <Terminal className={`h-5 w-5 ${cmd.color}`} aria-hidden="true" />
                <code className={`text-lg font-mono font-semibold ${cmd.color}`}>
                  loopkit {cmd.name}
                </code>
                <span className="text-zinc-500 text-sm">— {cmd.purpose}</span>
              </div>
              <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                {cmd.description}
              </p>
              <div className="space-y-1.5 mb-4">
                {cmd.flags.map((f) => (
                  <div key={f.flag} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
                    <code className="text-cyan-400 font-mono text-xs whitespace-nowrap shrink-0">
                      {f.flag}
                    </code>
                    <span className="text-zinc-400">{f.desc}</span>
                  </div>
                ))}
              </div>
              <CodeBlock code={cmd.example} small />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Workflow ─────────────────────────────────────────── */}
      <section id="workflow" className="mb-20 scroll-mt-20">
        <h2 className="text-3xl font-bold tracking-tight mb-2">The first 4 weeks</h2>
        <p className="text-zinc-400 mb-8">
          What the rhythm feels like once you're past the initial excitement.
        </p>

        <div className="space-y-4">
          {FIRST_FOUR_WEEKS.map((w) => (
            <div
              key={w.week}
              className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-zinc-500 text-sm font-mono">WEEK {w.week}</span>
                <h3 className="text-lg font-semibold text-white">{w.title}</h3>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                {w.description}
              </p>
              <p className="text-emerald-400 text-sm flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{w.out}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Troubleshooting ──────────────────────────────────── */}
      <section id="troubleshooting" className="mb-20 scroll-mt-20">
        <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-400" aria-hidden="true" />
          Troubleshooting
        </h2>
        <p className="text-zinc-400 mb-8">
          The 6 issues we get asked about most often.
        </p>

        <div className="space-y-4">
          {TROUBLESHOOTING.map((t) => (
            <div
              key={t.problem}
              className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20"
            >
              <h3 className="text-base font-semibold text-white mb-2 flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 mt-1 shrink-0" aria-hidden="true" />
                {t.problem}
              </h3>
              <p className="text-zinc-400 text-sm mb-2">
                <strong className="text-zinc-300">Why:</strong> {t.cause}
              </p>
              <p className="text-emerald-400 text-sm flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-emerald-300">Fix:</strong> {t.fix}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="text-center py-12 border-t border-zinc-900">
        <h2 className="text-2xl font-bold tracking-tight mb-3">
          Ready to start your streak?
        </h2>
        <p className="text-zinc-400 mb-6">
          4 minutes to your first brief. Free forever.
        </p>
        <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm w-fit mx-auto mb-4">
          <span className="text-zinc-500">$</span>
          <span className="text-white">npx loopkit init</span>
          <CopyButton text="npx loopkit init" />
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Back to home <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-mono font-semibold">
        {n}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, small = false }: { code: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm">
      <span className="text-zinc-500">$</span>
      <code className="text-white flex-1 truncate">{code}</code>
      <CopyButton text={code} small={small} />
    </div>
  );
}
