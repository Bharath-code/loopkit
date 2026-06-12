/**
 * Public /wins feed — the homepage hero for distribution.
 *
 * No auth required. Lists recent publicWins from Convex in descending
 * order, with the founder's handle, week, score, and one-thing snippet.
 * Each card links to a per-handle profile.
 *
 * Uses ConvexHttpClient for SSR (faster than spinning up useQuery on
 * first paint) and falls back to a friendly empty state.
 */

import Link from "next/link";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import {
  Trophy,
  Flame,
  Sparkles,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
} from "lucide-react";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";

interface PublicWin {
  _id: string;
  productName: string;
  weekNum: number;
  shippingScore: number;
  streak: number;
  tasksCompleted: number;
  tasksTotal: number;
  feedbackCount: number;
  loopkitScore: number | null;
  mrr: number | null;
  oneThing: string;
  createdAt: number;
  handle: string;
  projectSlug: string | null;
}

async function fetchWins(): Promise<PublicWin[]> {
  if (!CONVEX_URL) return [];
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const wins = await client.query(api.milestones.listPublicWins, { limit: 30 });
    return wins as PublicWin[];
  } catch (err) {
    console.error("Failed to load public wins:", err);
    return [];
  }
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ─── Sample data (shown only when no real wins exist yet) ──────
// Helps launch with a populated feel; replaced by real data as soon
// as one user runs `loopkit celebrate --share`.
const SAMPLE_WINS: PublicWin[] = [
  {
    _id: "sample-1",
    productName: "ProposalAI",
    weekNum: 12,
    shippingScore: 88,
    streak: 12,
    tasksCompleted: 5,
    tasksTotal: 5,
    feedbackCount: 8,
    loopkitScore: 91,
    mrr: 240,
    oneThing:
      "Stop perfectionism. Ship the v0.1 with a known gap. The gap is the conversation that gets you the next customer.",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    handle: "demo-founder",
    projectSlug: "proposalai",
  },
  {
    _id: "sample-2",
    productName: "ShipLane",
    weekNum: 8,
    shippingScore: 75,
    streak: 6,
    tasksCompleted: 4,
    tasksTotal: 5,
    feedbackCount: 3,
    loopkitScore: 78,
    mrr: null,
    oneThing:
      "Distribution tasks keep getting pushed to next week. Block 90 min Tuesday and 90 min Friday. Non-negotiable.",
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    handle: "founder-jane",
    projectSlug: "shiplane",
  },
  {
    _id: "sample-3",
    productName: "PulseDeck",
    weekNum: 5,
    shippingScore: 100,
    streak: 5,
    tasksCompleted: 3,
    tasksTotal: 3,
    feedbackCount: 12,
    loopkitScore: 85,
    mrr: 60,
    oneThing:
      "Three paying customers this week. All from one tweet thread. Build-in-public works when the loop is honest.",
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    handle: "mike-builds",
    projectSlug: "pulsedeck",
  },
];

function WinCard({ win }: { win: PublicWin }) {
  return (
    <article className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-zinc-500">@{win.handle}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">
              Week {win.weekNum} · {relativeTime(win.createdAt)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white truncate">
            {win.productName}
          </h3>
        </div>
        {win.streak >= 4 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-orange-500/30 bg-orange-500/10 text-orange-400">
            <Flame className="h-3 w-3" aria-hidden="true" />
            {win.streak}
          </span>
        )}
      </header>

      <p className="text-sm text-zinc-300 italic mb-4 line-clamp-3">
        &ldquo;{win.oneThing}&rdquo;
      </p>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-mono text-white">{win.shippingScore}%</span>
          <span className="text-zinc-600">shipped</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Target className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
          <span className="font-mono text-white">
            {win.tasksCompleted}/{win.tasksTotal}
          </span>
          <span className="text-zinc-600">tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span className="font-mono text-white">{win.feedbackCount}</span>
          <span className="text-zinc-600">signals</span>
        </div>
      </dl>
    </article>
  );
}

export const metadata = {
  title: "LoopKit Wins — Solo founders shipping weekly",
  description:
    "Public feed of weekly shipping wins from solo technical founders using LoopKit. Real scores, real streaks, real one-things.",
  openGraph: {
    title: "LoopKit Wins",
    description: "Solo founders shipping weekly. See the feed.",
    type: "website",
  },
};

export default async function WinsPage() {
  const wins = await fetchWins();
  const totalWins = wins.length;
  const shippingFounders = new Set(wins.map((w) => `@${w.handle}`)).size;
  const longestStreak = wins.reduce((max, w) => Math.max(max, w.streak), 0);
  const avgScore =
    wins.length > 0
      ? Math.round(
          wins.reduce((s, w) => s + w.shippingScore, 0) / wins.length,
        )
      : 0;

  const showSamples = wins.length === 0;
  const displayedWins = showSamples ? SAMPLE_WINS : wins;
  const stats = showSamples
    ? { count: SAMPLE_WINS.length, founders: 3, avg: 88, streak: 12 }
    : {
        count: totalWins,
        founders: shippingFounders,
        avg: avgScore,
        streak: longestStreak,
      };

  return (
    <main id="main-content" className="relative overflow-hidden">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-center justify-center grid-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400">
            <span className={`w-2 h-2 rounded-full ${showSamples ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
            {showSamples
              ? "Sample wins — your data appears here when you ship"
              : `${stats.count} public win${stats.count === 1 ? "" : "s"}`}
          </div>

          <h1 className="fade-up delay-1 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.08]">
            Solo founders.
            <br />
            <span className="gradient-text">Shipping weekly.</span>
          </h1>

          <p className="fade-up delay-2 mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The public feed of weekly wins from{" "}
            <span className="text-white font-medium">LoopKit</span> users.
            Real scores. Real streaks. Real one-things.
          </p>

          {wins.length > 0 && (
            <dl className="fade-up delay-3 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <dt className="text-xs text-zinc-500 uppercase tracking-wider">Wins</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{stats.count}</dd>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <dt className="text-xs text-zinc-500 uppercase tracking-wider">Founders</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{stats.founders}</dd>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <dt className="text-xs text-zinc-500 uppercase tracking-wider">Avg Score</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{stats.avg}%</dd>
              </div>
              <div className="p-4 rounded-xl border border-orange-500/20 bg-zinc-900/30">
                <dt className="text-xs text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Longest
                </dt>
                <dd className="mt-1 text-2xl font-bold text-white">{stats.streak}</dd>
              </div>
            </dl>
          )}

          <div className="fade-up delay-4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors text-sm"
            >
              Get LoopKit
            </Link>
            <Link
              href="#feed"
              className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors text-sm"
            >
              See the feed ↓
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Feed ─────────────────────────────────────────── */}
      <section id="feed" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {showSamples ? "Sample wins (what you'll see)" : "This week's wins"}
            </h2>
            <p className="text-zinc-400">
              {showSamples
                ? "These are sample wins. Run `loopkit celebrate --share` after your next `loop` and yours will appear here."
                : `Showing the ${wins.length} most recent public wins.`}
            </p>
          </header>

          {wins.length === 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedWins.map((win) => (
                  <WinCard key={win._id} win={win} />
                ))}
              </div>
              <div className="mt-8 p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
                <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ready to land your win here?
                </h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                  Run <code className="font-mono text-violet-400">loopkit celebrate --share</code>{" "}
                  after your next <code className="font-mono text-violet-400">loop</code> and replace one of these samples with your own.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  Start shipping
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedWins.map((win) => (
                <WinCard key={win._id} win={win} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            How a win lands here
          </h2>
          <ol className="text-left space-y-4 max-w-xl mx-auto text-zinc-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-sm font-mono flex items-center justify-center">
                1
              </span>
              <span>
                Ship something on Friday with <code className="font-mono text-violet-400">loopkit ship</code>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-sm font-mono flex items-center justify-center">
                2
              </span>
              <span>
                Run <code className="font-mono text-violet-400">loopkit loop</code> on Sunday and pick the one thing.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-sm font-mono flex items-center justify-center">
                3
              </span>
              <span>
                Run <code className="font-mono text-violet-400">loopkit celebrate --share</code>.
                Your win goes public.
              </span>
            </li>
          </ol>

          <div className="mt-12 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs mb-2">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sunday ritual reminder</span>
            </div>
            <p className="text-zinc-300 text-sm">
              The Sunday loop takes 90 seconds. The win lands here in 2 more.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
