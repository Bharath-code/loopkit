/**
 * Per-handle public wins profile: /wins/[handle]
 * Aggregates all public wins by a single user, oldest to newest.
 * Shows: 52-week score timeline, total wins, longest streak.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Flame, TrendingUp, Calendar, Trophy } from "lucide-react";

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

async function fetchWinsForHandle(handle: string): Promise<PublicWin[]> {
  if (!CONVEX_URL) return [];
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const wins = await client.query(api.milestones.listPublicWins, { limit: 200 });
    return (wins as PublicWin[]).filter(
      (w) => w.handle.toLowerCase() === handle.toLowerCase(),
    );
  } catch (err) {
    console.error("Failed to load handle wins:", err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { handle: string } }) {
  return {
    title: `@${params.handle} — LoopKit Wins`,
    description: `Public shipping wins by @${params.handle} on LoopKit.`,
  };
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().split("T")[0];
}

export default async function HandleWinsPage({
  params,
}: {
  params: { handle: string };
}) {
  const wins = await fetchWinsForHandle(params.handle);

  if (wins.length === 0) {
    notFound();
  }

  // Sort oldest to newest
  const sorted = [...wins].sort((a, b) => a.createdAt - b.createdAt);
  const totalWins = sorted.length;
  const longestStreak = sorted.reduce((max, w) => Math.max(max, w.streak), 0);
  const avgScore = Math.round(
    sorted.reduce((s, w) => s + w.shippingScore, 0) / sorted.length,
  );
  const productName = sorted[sorted.length - 1].productName;
  const firstWin = formatDate(sorted[0].createdAt);

  return (
    <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/wins"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All wins
      </Link>

      <header className="mb-12">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-zinc-500 text-sm font-mono">@</span>
          <h1 className="text-3xl font-bold text-white">{params.handle}</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Shipping <span className="text-white font-medium">{productName}</span>{" "}
          since {firstWin}.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <dt className="text-xs text-zinc-500 uppercase tracking-wider">Wins</dt>
            <dd className="mt-1 text-2xl font-bold text-white">{totalWins}</dd>
          </div>
          <div className="p-4 rounded-xl border border-orange-500/20 bg-zinc-900/30">
            <dt className="text-xs text-orange-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="h-3 w-3" /> Longest
            </dt>
            <dd className="mt-1 text-2xl font-bold text-white">{longestStreak}</dd>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <dt className="text-xs text-zinc-500 uppercase tracking-wider">Avg</dt>
            <dd className="mt-1 text-2xl font-bold text-white">{avgScore}%</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/wins/${params.handle}/${new Date(sorted[sorted.length - 1].createdAt).getFullYear()}/card`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Trophy className="h-4 w-4" aria-hidden="true" />
            View {new Date(sorted[sorted.length - 1].createdAt).getFullYear()} annual card
          </Link>
          <span className="text-xs text-zinc-500">
            Sharable · screenshot-ready
          </span>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          Timeline
        </h2>

        <ol className="relative space-y-6 border-l border-zinc-800 pl-6 ml-2">
          {sorted.map((win) => (
            <li key={win._id} className="relative">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-violet-500 ring-4 ring-zinc-950" />
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-500 font-mono">
                    Week {win.weekNum} · {formatDate(win.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {win.streak >= 4 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400">
                        <Flame className="h-3 w-3" />
                        {win.streak}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      {win.shippingScore}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 italic">
                  &ldquo;{win.oneThing}&rdquo;
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
