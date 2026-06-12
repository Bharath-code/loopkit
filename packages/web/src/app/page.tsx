import Link from "next/link";
import { CopyButton } from "./copy-button";
import { LandingTracker } from "@/components/LandingTracker";
import { VideoPlayer } from "@/components/VideoPlayer";
import {
  Terminal,
  Circle,
  Check,
  GitCommit,
  Calendar,
} from "lucide-react";

/**
 * LoopKit landing page.
 *
 * Design language:
 *   - Monospace everywhere (JetBrains Mono is the only typeface)
 *   - Flat surfaces, no gradients, no glows
 *   - The product IS the terminal — the page looks like one
 *   - Honest about stage: "we have 0 users, find 10"
 *   - Behavioral copy, not aspirational ("run init" not "transform your week")
 */
const PHASES = [
  {
    cmd: "init",
    color: "text-emerald-400",
    desc: "4 minutes, 5 questions. AI scores your bet on ICP, problem, and MVP. Writes a falsifiable brief.",
  },
  {
    cmd: "track",
    color: "text-cyan-400",
    desc: "Plain markdown tasks. Git commits close them. Zero overhead.",
  },
  {
    cmd: "ship",
    color: "text-amber-400",
    desc: "AI drafts your launch posts. You edit the tone, not the words.",
  },
  {
    cmd: "pulse",
    color: "text-violet-400",
    desc: "Async customer feedback. AI clusters it. No meetings.",
  },
  {
    cmd: "loop",
    color: "text-red-400",
    desc: "Sunday ritual. 10 minutes. Streak counter. Loop closed.",
  },
];

const TROUBLESHOOTING = [
  { q: "How long does init take?", a: "4 minutes. 5 questions. AI scores the answers." },
  { q: "Do I need an account?", a: "No. The CLI-only path is fully offline. AI features need an account or your own Anthropic key." },
  { q: "What if I miss a Sunday?", a: "Strictly: streak breaks. But `loopkit loop --async` lets you close the week any day inside a 7-day grace window." },
  { q: "Is my data really local?", a: "Yes. brief.md and tasks.md are plain files in your repo. The web dashboard is a sync target, not a source of truth." },
];

const CLI_SCREENSHOT = `~/my-saas $ loopkit init

  ◆ Define your product
  │ This takes 4 minutes. Be honest, not optimistic.
  │
  ◇ What's the product called?                    ProposalAI
  ◇ What problem does it solve?                   Freelancers lose deals because their proposals look generic.
  ◇ Who's the ICP?                                 Solo consultants billing $3K+ / month.
  ◇ Why hasn't anyone solved it?                   They have, but no one tells the freelancer WHY they lost.
  ◇ What's the MVP?                                A score on each proposal attempt + 3 sample rewrites.

  ◆ Analyzing your brief...

  ┌─ ProposalAI ─────────────────────────────────────────────┐
  │ THE BET                                                   │
  │ "Solo consultants at $3K+ lose deals to cheaper          │
  │  competitors who look more professional on paper."        │
  │                                                           │
  │ ICP      ████████░░  8/10                                 │
  │ PROBLEM  █████████░  9/10                                 │
  │ MVP      ███████░░░  7/10                                 │
  │                                                           │
  │ 🔴 RISKIEST ASSUMPTION                                    │
  │ "Clients actually read the proposals before deciding."    │
  │                                                           │
  │ Saved → .loopkit/projects/proposal-ai/brief.md           │
  └───────────────────────────────────────────────────────────┘

  ✓ Week 1. Tasks scaffolded. Run \`loopkit track\` next.`;

export default function LandingPage() {
  return (
    <main id="main-content" className="relative">
      <LandingTracker />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-24">
          <div className="text-xs text-zinc-600 mb-8">
            <span className="text-emerald-500">●</span> public beta · v0.2.1 · looking for 10 founders
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-[1.3] tracking-tight text-zinc-100">
            Run <code className="text-emerald-400">npx loopkit init</code>.
            <br />
            Then close <code className="text-red-400">loopkit loop</code> every Sunday for 6 weeks.
            <br />
            That&apos;s the product.
          </h1>

          <p className="mt-6 text-sm text-zinc-400 max-w-xl leading-relaxed">
            LoopKit is a CLI for solo technical founders who already use a terminal and a git repo. Five commands. One weekly loop. Free forever for the basics.{" "}
            <Link href="/docs" className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:decoration-zinc-500">
              Full manual →
            </Link>
          </p>

          <div className="mt-10">
            <Link
              href="#how-it-works"
              data-cta="how_it_works"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              ↓ how it works
            </Link>
          </div>
        </div>
      </section>

      {/* ─── The 5 commands ──────────────────────────────── */}
      <section id="how-it-works" className="border-b border-zinc-900 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">the loop</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-10">Five commands. Run in order, every week.</h2>

          <ol className="space-y-6">
            {PHASES.map((p, i) => (
              <li key={p.cmd} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <div className="text-zinc-600 text-sm pt-0.5 font-mono">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <code className={`text-sm font-semibold ${p.color}`}>
                    loopkit {p.cmd}
                  </code>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="text-xs text-zinc-600 font-mono mt-10">
            init → track → ship → pulse → loop → init → ...
          </p>
        </div>
      </section>

      {/* ─── Real product screenshot ─────────────────────── */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">the artifact</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">
            What <code className="text-emerald-400">loopkit init</code> actually does.
          </h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-xl">
            Real output. Real scoring. Real brief written to{" "}
            <code className="text-zinc-300 font-mono">.loopkit/projects/&lt;slug&gt;/brief.md</code>{" "}
            in your repo.
          </p>
          <pre className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 text-xs text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
{CLI_SCREENSHOT}
          </pre>
        </div>
      </section>

      {/* ─── The honest section (replaces fake testimonials) */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">the truth</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-6">
            We have 0 paying users. We&apos;re looking for 10.
          </h2>
          <div className="text-sm text-zinc-400 leading-relaxed space-y-4 max-w-2xl">
            <p>
              I built LoopKit because I&apos;ve quit 4 side projects at the same spot — between week 3 and week 5. The loop breaks. The streak breaks. The project goes back in the drawer.
            </p>
            <p>
              The hypothesis is that a forced weekly ritual — define, build, ship, listen, close — keeps the loop alive long enough for momentum to take over.
            </p>
            <p>
              I can&apos;t prove that yet. I need 10 founders to run{" "}
              <code className="text-zinc-300">loopkit loop</code> for 6 Sundays and tell me what broke.
            </p>
            <p>
              If you ship 6 weeks straight and it doesn&apos;t change how you work, I&apos;ll refund whatever you paid (Solo or Pro). If you stop using it after 2 weeks, I want to know why.
            </p>
          </div>
          <div className="mt-8">
            <a
              href="mailto:founders@loopkit.dev"
              data-cta="email_founders"
              className="text-sm text-zinc-200 hover:text-white underline decoration-zinc-700 underline-offset-4 hover:decoration-zinc-500"
            >
              founders@loopkit.dev →
            </a>
          </div>
        </div>
      </section>

      {/* ─── Video walkthrough ────────────────────────────── */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">the 4-minute tour</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-6">
            Or just watch it.
          </h2>
          <VideoPlayer
            loomId="LOOM_ID"
            title="LoopKit in 4 minutes"
            posterHint="init → track → ship → loop, end to end"
          />
        </div>
      </section>

      {/* ─── FAQ (replaces comparison table) ──────────────── */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">questions</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-10">
            The four we get asked.
          </h2>
          <dl className="space-y-6">
            {TROUBLESHOOTING.map((item) => (
              <div key={item.q} className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-2 sm:gap-6">
                <dt className="text-sm text-zinc-200 font-medium">{item.q}</dt>
                <dd className="text-sm text-zinc-400 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-zinc-500 mt-8">
            More in the{" "}
            <Link href="/docs" className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:decoration-zinc-500">
              full docs
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ─── Install (the only CTA that matters) ──────────── */}
      <section className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-wider text-zinc-600 mb-2">install</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-6">
            4 minutes. No signup required.
          </h2>
          <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-zinc-900 rounded-lg font-mono text-sm w-fit">
            <span className="text-zinc-600">$</span>
            <span className="text-emerald-400">npx loopkit init</span>
            <CopyButton text="npx loopkit init" />
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            Or read the{" "}
            <Link href="/docs" className="text-zinc-400 hover:text-zinc-200 underline decoration-zinc-800 underline-offset-4">
              docs
            </Link>{" "}
            first if you&apos;re skeptical. (You should be.)
          </p>
        </div>
      </section>

      {/* ─── Trust strip (real numbers, not badges) ────────── */}
      <section>
        <div className="max-w-3xl mx-auto px-6 py-12 text-xs text-zinc-600 font-mono">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span>
              <GitCommit className="h-3 w-3 inline mr-1" aria-hidden="true" />
              553 tests passing
            </span>
            <span>
              <Terminal className="h-3 w-3 inline mr-1" aria-hidden="true" />
              15 commands
            </span>
            <span>
              <Circle className="h-3 w-3 inline mr-1" aria-hidden="true" />
              0 users
            </span>
            <span>
              <Calendar className="h-3 w-3 inline mr-1" aria-hidden="true" />
              shipped weekly since March
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-600">
          <div>
            <span className="text-zinc-400 font-bold">LoopKit</span>
            <span className="ml-2">· CLI for solo founders shipping weekly.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-zinc-300">
              Docs
            </Link>
            <a href="https://github.com/loopkit" className="hover:text-zinc-300">
              GitHub
            </a>
            <a href="https://twitter.com/loopkit" className="hover:text-zinc-300">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
