/**
 * 404 — Not Found page.
 *
 * Branded with the LoopKit terminal aesthetic. Includes two CTAs
 * to recover the user (back to dashboard or run `loopkit init`).
 *
 * Next.js 16 automatically uses this for unmatched routes
 * (renders 404 status, no auth required).
 */
import Link from "next/link";
import { Terminal, Home, ArrowRight } from "lucide-react";

export const metadata = {
  title: "404 — LoopKit",
  description: "That page doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-8 fade-up">
        {/* Terminal-style error block */}
        <div className="terminal">
          <div className="terminal-header">
            <span className="terminal-dot bg-red-400" aria-hidden="true" />
            <span className="terminal-dot bg-amber-400" aria-hidden="true" />
            <span className="terminal-dot bg-emerald-400" aria-hidden="true" />
            <span className="text-xs text-zinc-500 ml-2 font-mono">~/loopkit</span>
          </div>
          <div className="terminal-body text-zinc-300">
            <p>
              <span className="text-red-400 font-semibold">error</span>{" "}
              <span className="text-zinc-500">ERR_NOT_FOUND</span>
            </p>
            <p className="mt-1 text-zinc-400">
              The page you requested could not be located.
            </p>
            <p className="mt-4 text-zinc-500">
              <span className="text-violet-400">$</span> loopkit{" "}
              <span className="text-zinc-300">track</span>{" "}
              <span className="text-zinc-500">--week</span>
            </p>
            <p className="mt-1 text-zinc-600 text-xs">
              hint: most pages live under <span className="text-zinc-400">/dashboard</span>
            </p>
          </div>
        </div>

        {/* Headline + body */}
        <div className="text-center space-y-3">
          <div className="text-metric gradient-text inline-block">404</div>
          <h1 className="text-title text-foreground">This loop didn't ship.</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Either the link is broken, or the page was renamed. Either way,
            you've landed somewhere we didn't intend.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors min-h-[44px]"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-sidebar-accent text-sm font-medium transition-colors min-h-[44px]"
          >
            <Terminal className="h-4 w-4" aria-hidden="true" />
            Back to home
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
