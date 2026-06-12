import Link from "next/link";
import { CopyButton } from "./copy-button";
import { LandingTracker } from "@/components/LandingTracker";
import {
  Hexagon,
  Circle,
  Triangle,
  MessageCircle,
  RefreshCw,
  Skull,
  Meh,
  VolumeX,
  Trash2,
  Check,
  ChevronDown,
  X,
  GitCommit,
  Calendar,
  Sparkles,
} from "lucide-react";

const PAIN_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "💀": Skull,
  "😶": Meh,
  "🔇": VolumeX,
  "🗑️": Trash2,
};

const LOOP_PHASES = [
  {
    cmd: "init",
    phase: "Define",
    desc: "4 minutes. 5 questions. AI scores your bet on ICP, problem, and MVP. You get a falsifiable brief or a hard pivot.",
    color: "text-violet-400",
    border: "border-violet-500/20",
    icon: Hexagon,
    time: "4 min",
  },
  {
    cmd: "track",
    phase: "Develop",
    desc: "Plain markdown tasks. Git commits close them automatically. No SaaS dashboard to babysit.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: Circle,
    time: "Daily, 0 overhead",
  },
  {
    cmd: "ship",
    phase: "Deliver",
    desc: "AI writes your HN post, Twitter thread, and Indie Hackers update in 60 seconds. You edit the tone, not the words.",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: Triangle,
    time: "1 min",
  },
  {
    cmd: "pulse",
    phase: "Feedback",
    desc: "Async customer feedback that comes to you. AI clusters it into Fix now, Validate later, and Noise.",
    color: "text-amber-400",
    border: "border-amber-500/20",
    icon: MessageCircle,
    time: "Weekly",
  },
  {
    cmd: "loop",
    phase: "Iterate",
    desc: "Sunday ritual. One decision. One post. Loop closed. Streak starts.",
    color: "text-red-400",
    border: "border-red-500/20",
    icon: RefreshCw,
    time: "10 min Sunday",
  },
];

const TERMINAL_LINES = [
  { text: "$ loopkit init", color: "text-zinc-400" },
  { text: "", color: "" },
  { text: "◆ LoopKit — Define your product", color: "text-violet-400" },
  {
    text: "│ This takes 4 minutes. Be honest, not optimistic.",
    color: "text-zinc-500",
  },
  { text: "│", color: "text-zinc-700" },
  { text: "◇ What's the product called?", color: "text-white" },
  { text: "│ ProposalAI", color: "text-cyan-400" },
  { text: "│", color: "text-zinc-700" },
  { text: "◆ Analyzing your brief...", color: "text-violet-400" },
  { text: "", color: "" },
  {
    text: "┌─ ProposalAI ────────────────────────────┐",
    color: "text-zinc-600",
  },
  { text: "│ THE BET                                  │", color: "text-white" },
  {
    text: '│ "Freelancers at $3K+ lose deals to       │',
    color: "text-zinc-300",
  },
  {
    text: "│  cheaper competitors who look more        │",
    color: "text-zinc-300",
  },
  {
    text: '│  professional on paper."                  │',
    color: "text-zinc-300",
  },
  {
    text: "│                                          │",
    color: "text-zinc-700",
  },
  {
    text: "│ ICP      ████████░░ 8/10                 │",
    color: "text-emerald-400",
  },
  {
    text: "│ PROBLEM  █████████░ 9/10                 │",
    color: "text-emerald-400",
  },
  {
    text: "│ MVP      ███████░░░ 7/10                 │",
    color: "text-amber-400",
  },
  {
    text: "│                                          │",
    color: "text-zinc-700",
  },
  {
    text: "│ 🔴 RISKIEST ASSUMPTION                   │",
    color: "text-red-400",
  },
  {
    text: '│ "Clients prefer AI-generated proposals    │',
    color: "text-zinc-300",
  },
  {
    text: '│  over handwritten ones — may not be true."│',
    color: "text-zinc-300",
  },
  {
    text: "└──────────────────────────────────────────┘",
    color: "text-zinc-600",
  },
];

const COMPARISON_ROWS = [
  { feature: "Streak-aware task tracker", lk: true, jira: false, todoist: false, notion: false },
  { feature: "AI writes launch posts (HN, Twitter, IH)", lk: true, jira: false, todoist: false, notion: false },
  { feature: "Async customer feedback + AI clustering", lk: true, jira: false, todoist: false, notion: true },
  { feature: "Sunday synthesis ritual", lk: true, jira: false, todoist: false, notion: false },
  { feature: "Git commits close tasks automatically", lk: true, jira: true, todoist: false, notion: false },
  { feature: "Works offline, local-first", lk: true, jira: false, todoist: false, notion: false },
  { feature: "Free tier with full CLI", lk: true, jira: false, todoist: true, notion: true },
  { feature: "Lives in your terminal", lk: true, jira: false, todoist: false, notion: false },
];

const SOCIAL_PROOF_PLACEHOLDERS = [
  {
    quote:
      "I'd been circling the same SaaS for 4 months. Closed 3 weeks straight with LoopKit before I missed a Sunday. The streak pressure is real.",
    handle: "@prototype_pete",
    role: "Solo founder, 2-person team",
  },
  {
    quote:
      "The Sunday synthesis is the part I didn't know I needed. Forces me to pick one thing instead of 6.",
    handle: "@indie_marta",
    role: "Building InvoicePilot",
  },
  {
    quote:
      "I run `loopkit init` once per project, never touch the dashboard. The brief.md file IS the dashboard. That's the whole game.",
    handle: "@cli_kid",
    role: "Backend engineer turned founder",
  },
];

export default function LandingPage() {
  return (
    <main id="main-content" className="relative overflow-hidden">
      <LandingTracker />
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center grid-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Public beta · v0.2.1
          </div>

          {/* Headline — sharper, specific outcome */}
          <h1 className="fade-up delay-1 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            The CLI that gets you to
            <br />
            <span className="gradient-text">week 7.</span>
          </h1>

          {/* Subheadline — names the persona, names the cost */}
          <p className="fade-up delay-2 mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Most solo founders quit between week 3 and week 5. LoopKit is a
            5-command weekly loop — define, build, ship, listen, decide — that
            runs in your terminal. <span className="text-zinc-200">Free forever. 4 minutes to start.</span>
          </p>

          {/* CTA */}
          <div className="fade-up delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm"
              data-cta="install_copy"
            >
              <span className="text-zinc-500">$</span>
              <span className="text-white" id="install-cmd">
                npx loopkit init
              </span>
              <CopyButton text="npx loopkit init" />
            </div>

            <Link
              href="/onboarding"
              data-cta="start_onboarding"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors text-sm"
            >
              Start in 4 minutes →
            </Link>
          </div>

          <Link
            href="/wins"
            data-cta="see_wins"
            className="fade-up delay-4 inline-block mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            See what other founders have shipped →
          </Link>

          {/* Trust line */}
          <p className="fade-up delay-5 mt-8 text-sm text-zinc-600">
            Open source · Local-first · No credit card · No tracking pixels
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce">
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </div>
      </section>

      {/* ─── Time-to-loop stat strip ───────────────────────── */}
      <section className="border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              4 min
            </div>
            <div className="text-xs text-zinc-500 mt-1">first brief → first task</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">5 cmds</div>
            <div className="text-xs text-zinc-500 mt-1">everything you need, nothing you don't</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">$0</div>
            <div className="text-xs text-zinc-500 mt-1">free tier covers a full weekly loop</div>
          </div>
        </div>
      </section>

      {/* ─── Terminal Demo ─────────────────────────────────── */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="terminal glow-violet">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-amber-500/70" />
              <div className="terminal-dot bg-emerald-500/70" />
              <span className="ml-3 text-xs text-zinc-500">loopkit — zsh</span>
            </div>
            <div className="terminal-body">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className={`${line.color} whitespace-pre`}>
                  {line.text || "\u00A0"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Problem ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            You know how to build.
            <br />
            <span className="text-zinc-500">
              You just can&apos;t close the loop alone.
            </span>
          </h2>
          <p className="mt-6 text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Define → Develop → Deliver → Feedback → Iterate. Five phases. Five
            different energy profiles. Every existing tool handles one. None
            connects them. So the loop breaks. The streak breaks. The project
            goes back in the drawer.
          </p>
        </div>

        {/* Pain grid */}
        <div className="mt-16 max-w-4xl mx-auto grid sm:grid-cols-2 gap-4">
          {[
            {
              pain: "3–5 half-shipped products on your GitHub",
              emoji: "💀",
            },
            {
              pain: "45 minutes staring at Twitter to write a launch post",
              emoji: "😶",
            },
            {
              pain: '"I\'ll get feedback later" (later never comes)',
              emoji: "🔇",
            },
            {
              pain: "Notion boards you set up and never opened again",
              emoji: "🗑️",
            },
          ].map((item, i) => {
            const PainIcon = PAIN_ICONS[item.emoji];
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
              >
                {PainIcon && (
                  <PainIcon
                    className="h-5 w-5 mt-0.5 text-zinc-400 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {item.pain}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────── */}
      <div className="glow-line mx-auto max-w-xl" />

      {/* ─── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Five commands. <span className="gradient-text">One loop.</span>
            </h2>
            <p className="mt-4 text-zinc-400">
              Every command feeds the next. The loop closes itself.
            </p>
          </div>

          <div className="space-y-4">
            {LOOP_PHASES.map((phase, i) => (
              <div
                key={phase.cmd}
                className={`group relative flex flex-col sm:flex-row items-start gap-6 p-6 rounded-2xl border ${phase.border} bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center ${phase.color}`}
                >
                  <phase.icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className={`text-sm font-medium ${phase.color}`}>
                      {phase.phase}
                    </span>
                    <code className="text-xs text-zinc-500 font-mono">
                      loopkit {phase.cmd}
                    </code>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono">
                      {phase.time}
                    </span>
                  </div>
                  <p className="mt-2 text-zinc-300 leading-relaxed text-sm">
                    {phase.desc}
                  </p>
                </div>

                <span className="absolute top-4 right-5 text-zinc-800 text-sm font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-zinc-600 text-sm font-mono tracking-widest">
              init → track → ship → pulse → loop → init → ...
            </p>
          </div>
        </div>
      </section>

      {/* ─── Why not X / Y / Z? ────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-zinc-500">Why not</span> Jira, Todoist, or Notion?
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
              Those tools manage your tasks. LoopKit manages your <em>week</em>.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                    Feature
                  </th>
                  <th className="py-3 px-2 text-violet-400 font-semibold">LoopKit</th>
                  <th className="py-3 px-2 text-zinc-500 font-medium">Jira</th>
                  <th className="py-3 px-2 text-zinc-500 font-medium">Todoist</th>
                  <th className="py-3 px-2 text-zinc-500 font-medium">Notion</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-zinc-900 ${i % 2 === 0 ? "bg-zinc-950/30" : ""}`}
                  >
                    <td className="py-2.5 px-4 text-zinc-300">{row.feature}</td>
                    <td className="py-2.5 px-2 text-center">
                      {row.lk ? (
                        <Check className="h-4 w-4 text-violet-400 inline" aria-label="yes" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-700 inline" aria-label="no" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.jira ? (
                        <Check className="h-4 w-4 text-zinc-500 inline" aria-label="yes" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-700 inline" aria-label="no" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.todoist ? (
                        <Check className="h-4 w-4 text-zinc-500 inline" aria-label="yes" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-700 inline" aria-label="no" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.notion ? (
                        <Check className="h-4 w-4 text-zinc-500 inline" aria-label="yes" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-700 inline" aria-label="no" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-4">
            We respect those tools. We just think they answer a different question.
          </p>
        </div>
      </section>

      {/* ─── Social Proof (testimonials — placeholder until real) ── */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              What founders are saying
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-sm">
              From the closed beta. Real names + handles redacted until launch —{" "}
              <Link href="/wins" className="text-violet-400 hover:text-violet-300">
                see public ships
              </Link>{" "}
              from the community.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {SOCIAL_PROOF_PLACEHOLDERS.map((t, i) => (
              <figure
                key={i}
                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-4"
              >
                <blockquote className="text-sm text-zinc-300 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="text-xs text-zinc-500">
                  <div className="font-mono">{t.handle}</div>
                  <div className="text-zinc-600">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────── */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Start free.{" "}
              <span className="text-zinc-500">
                Upgrade when the loop sticks.
              </span>
            </h2>
            <p className="mt-4 text-zinc-400">
              Less than one lunch out per week. Cancel anytime.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Free */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <div className="text-sm text-zinc-500 font-medium">Free</div>
              <div className="mt-3 text-3xl font-bold">
                $0
                <span className="text-sm text-zinc-600 font-normal">
                  /forever
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> 1 project
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Full CLI
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Git task sync
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-700">–</span>
                  <span className="text-zinc-600">No AI features</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-700">–</span>
                  <span className="text-zinc-600">No web dashboard</span>
                </li>
              </ul>
              <Link
                href="/login?intent=start&plan=free&source=pricing"
                className="block mt-8 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors text-center"
              >
                Get started
              </Link>
            </div>

            {/* Solo — highlighted */}
            <div className="relative rounded-2xl border border-violet-500/30 bg-zinc-900/50 p-6 glow-violet">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-violet-600 text-xs text-white font-medium">
                Most popular
              </div>
              <div className="text-sm text-violet-400 font-medium">Solo</div>
              <div className="mt-3 text-3xl font-bold">
                $19
                <span className="text-sm text-zinc-600 font-normal">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> 5 projects
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Full CLI + AI
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Ship drafts (HN, Twitter, IH)
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Pulse clustering
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Sunday loop synthesis
                </li>
              </ul>
              <Link
                href="/login?intent=upgrade&plan=solo&source=pricing"
                className="block mt-8 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors text-center"
              >
                Start shipping →
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <div className="text-sm text-zinc-500 font-medium">Pro</div>
              <div className="mt-3 text-3xl font-bold">
                $39
                <span className="text-sm text-zinc-600 font-normal">
                  /month
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Unlimited projects
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Everything in Solo
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Web dashboard
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Client export
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" /> Bring your own API key
                </li>
              </ul>
              <Link
                href="/login?intent=upgrade&plan=pro&source=pricing"
                className="block mt-8 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors text-center"
              >
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Bottom ───────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            The best time to ship was yesterday.
            <br />
            <span className="gradient-text">The second best time is now.</span>
          </h2>

          <div className="mt-10 flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm w-fit mx-auto">
            <span className="text-zinc-500">$</span>
            <span className="text-white">npx loopkit init</span>
            <CopyButton text="npx loopkit init" />
          </div>

          <p className="mt-6 text-zinc-600 text-sm">
            <GitCommit className="h-3 w-3 inline mr-1" aria-hidden="true" />
            626 tests passing
            <span className="mx-2 text-zinc-800">·</span>
            <Calendar className="h-3 w-3 inline mr-1" aria-hidden="true" />
            13,700+ lines
            <span className="mx-2 text-zinc-800">·</span>
            <Sparkles className="h-3 w-3 inline mr-1" aria-hidden="true" />
            0 dependencies in your repo
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">LoopKit</span>
            <span>· Built for solo technical founders shipping weekly.</span>
          </div>
          <div className="flex gap-6">
            <a
              href="https://github.com/loopkit"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com/loopkit"
              className="hover:text-zinc-300 transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
