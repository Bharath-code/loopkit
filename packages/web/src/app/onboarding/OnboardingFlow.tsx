"use client";

/**
 * 5-step interactive onboarding flow.
 *
 * Pure client component. State is persisted to sessionStorage so a
 * refresh mid-flow doesn't reset progress. The final step emits a
 * copy-paste command with the answers pre-encoded so `loopkit init`
 * can resume from these answers on the CLI side.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Copy,
  Terminal,
  Sparkles,
  Target,
  Rocket,
} from "lucide-react";

type SuccessMetric = "revenue" | "users" | "shipped";

interface OnboardingState {
  product: string;
  problem: string;
  metric: SuccessMetric | null;
  // Step 4 derived
  installConfirmed: boolean;
  // Step 5 derived
  firstTask: string;
}

const DEFAULT_STATE: OnboardingState = {
  product: "",
  problem: "",
  metric: null,
  installConfirmed: false,
  firstTask: "",
};

export function OnboardingFlow({ sessionKey }: { sessionKey: string }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as OnboardingState;
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [sessionKey]);

  // Persist on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated, sessionKey]);

  const totalSteps = 5;
  const progressPct = (step / totalSteps) * 100;

  // Step 5 derives a starter task from the brief
  const generatedFirstTask = useMemo(() => {
    if (state.metric === "revenue") {
      return `Set up Stripe checkout for ${state.product || "your product"} and price the first tier`;
    }
    if (state.metric === "users") {
      return `Write the landing page for ${state.product || "your product"} and ship a waitlist form`;
    }
    if (state.metric === "shipped") {
      return `Ship a 60-second demo of ${state.product || "your product"} to 3 people you trust`;
    }
    return "";
  }, [state.product, state.metric]);

  // Step 4 command — encodes the answers as flags so the CLI can resume
  const installCommand = useMemo(() => {
    const slug = (state.product || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    if (!slug) return "npx loopkit init";

    // Base64-encode the answers so the CLI can pre-fill.
    const answers = {
      product: state.product,
      problem: state.problem,
      metric: state.metric,
    };
    const encoded = btoa(JSON.stringify(answers));

    return `npx loopkit init "${slug}" --from-web "${encoded}"`;
  }, [state.product, state.problem, state.metric]);

  const canAdvanceFromStep = (s: number): boolean => {
    if (s === 1) return state.product.trim().length >= 2;
    if (s === 2) return state.problem.trim().length >= 10;
    if (s === 3) return state.metric !== null;
    if (s === 4) return true; // install is optional to mark
    return true;
  };

  const next = () => {
    if (step < totalSteps && canAdvanceFromStep(step)) {
      setStep(step + 1);
    }
  };
  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center grid-bg"
      style={{
        background:
          "linear-gradient(180deg, #09090b 0%, #0c0c0f 100%)",
      }}
    >
      <div className="w-full max-w-2xl px-6 py-16">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-mono">STEP {step} OF {totalSteps}</span>
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Skip for now
            </Link>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step body */}
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 min-h-[400px] flex flex-col">
          {step === 1 && (
            <Step
              title="What are you building?"
              subtitle="One name, one product. It doesn't have to be final."
            >
              <input
                type="text"
                autoFocus
                value={state.product}
                onChange={(e) => setState({ ...state, product: e.target.value })}
                placeholder="e.g. ProposalAI"
                className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-lg text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") next();
                }}
              />
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Why does it matter?"
              subtitle="Not the solution. The pain your user feels before your product exists."
            >
              <textarea
                autoFocus
                value={state.problem}
                onChange={(e) => setState({ ...state, problem: e.target.value })}
                placeholder="e.g. Freelancers at $3K+ projects lose deals to cheaper competitors who look more professional on paper"
                rows={4}
                className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors resize-none"
              />
            </Step>
          )}

          {step === 3 && (
            <Step
              title="How will you know in 4 weeks?"
              subtitle="Pick the one signal that tells you if this is working."
            >
              <div className="space-y-3">
                <MetricOption
                  icon={<Target className="h-5 w-5" />}
                  label="First paying customer"
                  description="A real person paid you real money."
                  selected={state.metric === "revenue"}
                  onClick={() => setState({ ...state, metric: "revenue" })}
                />
                <MetricOption
                  icon={<Sparkles className="h-5 w-5" />}
                  label="10 active users"
                  description="People coming back without you asking."
                  selected={state.metric === "users"}
                  onClick={() => setState({ ...state, metric: "users" })}
                />
                <MetricOption
                  icon={<Rocket className="h-5 w-5" />}
                  label="4 weekly ships in a row"
                  description="You proved you can close the loop."
                  selected={state.metric === "shipped"}
                  onClick={() => setState({ ...state, metric: "shipped" })}
                />
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Install the CLI"
              subtitle="Copy and run. Your answers above are pre-filled."
            >
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm flex items-center gap-3">
                <Terminal className="h-4 w-4 text-zinc-500 shrink-0" />
                <code className="text-cyan-300 flex-1 break-all">
                  {installCommand}
                </code>
                <button
                  onClick={copyCommand}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Copy command"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                Requires Node 20+. If you already have LoopKit installed, just
                run it — your answers will be picked up automatically.
              </p>

              <label className="mt-6 flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.installConfirmed}
                  onChange={(e) =>
                    setState({ ...state, installConfirmed: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-zinc-400">
                  I&apos;ve run the command (or already have LoopKit installed)
                </span>
              </label>
            </Step>
          )}

          {step === 5 && (
            <Step
              title="Your first task"
              subtitle="Suggested from your success metric. Add it to tasks.md when you start."
            >
              <div className="p-5 rounded-xl border border-violet-500/30 bg-violet-500/5">
                <div className="text-xs text-violet-400 uppercase tracking-wider font-medium mb-2">
                  Week 1 · #W1-1
                </div>
                <p className="text-lg text-white">
                  {generatedFirstTask || "Open LoopKit and add your first task."}
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">
                  The Sunday ritual
                </h3>
                <p className="text-sm text-zinc-400">
                  Every Sunday, run{" "}
                  <code className="font-mono text-violet-400">loopkit loop</code>.
                  90 seconds. One decision. One post. Loop closed.
                </p>
              </div>
            </Step>
          )}

          {/* Navigation */}
          <div className="mt-auto pt-8 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 1}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              {step < totalSteps ? (
                <button
                  onClick={next}
                  disabled={!canAdvanceFromStep(step)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/wins"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  I&apos;m shipping
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-zinc-600">
          Your answers are saved in this browser only. They pre-fill the CLI
          via <code className="font-mono text-zinc-500">--from-web</code>.
        </p>
      </div>
    </main>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        {title}
      </h1>
      <p className="text-zinc-400 text-sm mb-6">{subtitle}</p>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function MetricOption({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
        selected
          ? "border-violet-500 bg-violet-500/10"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          selected
            ? "bg-violet-500/20 text-violet-300"
            : "bg-zinc-900 text-zinc-500"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium ${
            selected ? "text-white" : "text-zinc-300"
          }`}
        >
          {label}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
      </div>
      {selected && (
        <Check className="h-4 w-4 text-violet-400 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
