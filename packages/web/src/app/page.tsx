import Link from "next/link";

const LOOP_PHASES = [
  {
    cmd: "init",
    phase: "Define",
    desc: "Turn a fuzzy idea into a scored, falsifiable brief in 4 minutes.",
    color: "text-violet-400",
    border: "border-violet-500/20",
    icon: "◆",
  },
  {
    cmd: "track",
    phase: "Develop",
    desc: "Tasks in markdown. Commits close them. Zero overhead.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: "○",
  },
  {
    cmd: "ship",
    phase: "Deliver",
    desc: "AI writes your HN post, Twitter thread, and IH update in 60 seconds.",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "▲",
  },
  {
    cmd: "pulse",
    phase: "Feedback",
    desc: "Async feedback that comes to you. AI-clustered. No meetings.",
    color: "text-amber-400",
    border: "border-amber-500/20",
    icon: "●",
  },
  {
    cmd: "loop",
    phase: "Iterate",
    desc: "Sunday ritual. One decision. One post. Loop closed.",
    color: "text-red-400",
    border: "border-red-500/20",
    icon: "↻",
  },
];

const TERMINAL_LINES = [
  { text: "$ loopkit init", color: "text-zinc-400" },
  { text: "", color: "" },
  { text: "◆ LoopKit — Define your product", color: "text-violet-400" },
  { text: '│ This takes 4 minutes. Be honest, not optimistic.', color: "text-zinc-500" },
  { text: "│", color: "text-zinc-700" },
  { text: "◇ What's the product called?", color: "text-white" },
  { text: "│ ProposalAI", color: "text-cyan-400" },
  { text: "│", color: "text-zinc-700" },
  { text: "◆ Analyzing your brief...", color: "text-violet-400" },
  { text: "", color: "" },
  { text: "┌─ ProposalAI ────────────────────────────┐", color: "text-zinc-600" },
  { text: "│ THE BET                                  │", color: "text-white" },
  { text: '│ "Freelancers at $3K+ lose deals to       │', color: "text-zinc-300" },
  { text: '│  cheaper competitors who look more        │', color: "text-zinc-300" },
  { text: '│  professional on paper."                  │', color: "text-zinc-300" },
  { text: "│                                          │", color: "text-zinc-700" },
  { text: "│ ICP      ████████░░ 8/10                 │", color: "text-emerald-400" },
  { text: "│ PROBLEM  █████████░ 9/10                 │", color: "text-emerald-400" },
  { text: "│ MVP      ███████░░░ 7/10                 │", color: "text-amber-400" },
  { text: "│                                          │", color: "text-zinc-700" },
  { text: "│ 🔴 RISKIEST ASSUMPTION                   │", color: "text-red-400" },
  { text: '│ "Clients prefer AI-generated proposals    │', color: "text-zinc-300" },
  { text: '│  over handwritten ones — may not be true."│', color: "text-zinc-300" },
  { text: "└──────────────────────────────────────────┘", color: "text-zinc-600" },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center grid-bg">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Now in public beta
          </div>

          {/* Headline */}
          <h1 className="fade-up delay-1 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.08]">
            Stop building.
            <br />
            <span className="gradient-text">Start shipping.</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up delay-2 mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            LoopKit is the CLI that closes the entire shipping loop for solo
            founders — from raw idea to paid customer, without social energy
            or tool switching.
          </p>

          {/* CTA */}
          <div className="fade-up delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm">
              <span className="text-zinc-500">$</span>
              <span className="text-white">npx loopkit init</span>
              <button
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Copy command"
              >
                ⎘
              </button>
            </div>

            <Link
              href="#how-it-works"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors text-sm"
            >
              See how it works →
            </Link>
          </div>

          {/* Trust line */}
          <p className="fade-up delay-4 mt-8 text-sm text-zinc-600">
            Free tier forever · No credit card · Your data stays local
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce">
          ↓
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
            Define → Develop → Deliver → Feedback → Iterate. Five phases.
            Five different energy profiles. Every existing tool handles one.
            None connects them.
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
              pain: "\"I'll get feedback later\" (later never comes)",
              emoji: "🔇",
            },
            {
              pain: "Notion boards you set up and never opened again",
              emoji: "🗑️",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
            >
              <span className="text-xl mt-0.5">{item.emoji}</span>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {item.pain}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────── */}
      <div className="glow-line mx-auto max-w-xl" />

      {/* ─── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Five commands.{" "}
              <span className="gradient-text">One loop.</span>
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
                {/* Phase icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg ${phase.color}`}
                >
                  {phase.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className={`text-sm font-medium ${phase.color}`}>
                      {phase.phase}
                    </span>
                    <code className="text-xs text-zinc-500 font-mono">
                      loopkit {phase.cmd}
                    </code>
                  </div>
                  <p className="mt-2 text-zinc-300 leading-relaxed text-sm">
                    {phase.desc}
                  </p>
                </div>

                {/* Step number */}
                <span className="absolute top-4 right-5 text-zinc-800 text-sm font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Loop visual */}
          <div className="mt-12 text-center">
            <p className="text-zinc-600 text-sm font-mono tracking-widest">
              init → track → ship → pulse → loop → init → ...
            </p>
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────── */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Start free.{" "}
              <span className="text-zinc-500">Pay when it clicks.</span>
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
                  <span className="text-emerald-500">✓</span> 1 project
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Full CLI
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Git task sync
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
              <button className="mt-8 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors">
                Get started
              </button>
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
                  <span className="text-emerald-500">✓</span> 5 projects
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Full CLI + AI
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Ship drafts (HN,
                  Twitter, IH)
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Pulse clustering
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Sunday loop
                  synthesis
                </li>
              </ul>
              <button className="mt-8 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                Start shipping →
              </button>
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
                  <span className="text-emerald-500">✓</span> Unlimited
                  projects
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Everything in
                  Solo
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Web dashboard
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Client export
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">✓</span> Bring your own API key
                </li>
              </ul>
              <button className="mt-8 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors">
                Go Pro
              </button>
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
          </div>

          <p className="mt-6 text-zinc-600 text-sm">
            Open source · Local first · Works offline
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">LoopKit</span>
            <span>· Built by a solo founder, for solo founders.</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/loopkit" className="hover:text-zinc-300 transition-colors">
              GitHub
            </a>
            <a href="https://twitter.com/loopkit" className="hover:text-zinc-300 transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
