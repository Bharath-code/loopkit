"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface BenchmarkMetric {
  label: string;
  value: number;
  unit: string;
  percentile: number;
  trend: "up" | "down" | "flat";
  description: string;
  emoji: string;
}

function PercentileBadge({ percentile }: { percentile: number }) {
  const label =
    percentile >= 90
      ? "Top 10%"
      : percentile >= 75
        ? "Top 25%"
        : percentile >= 50
          ? "Above Average"
          : percentile >= 25
            ? "Below Average"
            : "Getting Started";

  const color =
    percentile >= 90
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : percentile >= 75
        ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
        : percentile >= 50
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : percentile >= 25
            ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
            : "border-zinc-700 bg-zinc-800 text-zinc-500";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <span className="text-emerald-400">↑</span>;
  if (trend === "down") return <span className="text-red-400">↓</span>;
  return <span className="text-zinc-500">→</span>;
}

export default function BenchmarksPage() {
  const [showShareCard, setShowShareCard] = useState(false);

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const benchmarks = useQuery(
    api.analytics.getBenchmarks,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const shareCard = useQuery(
    api.analytics.getShareCard,
    projectId && showShareCard ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  if (!benchmarks || !benchmarks.user) {
    return (
      <div className="space-y-8 fade-up">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Benchmarks</h1>
          <p className="text-zinc-400 text-sm">See how your shipping habits compare.</p>
        </header>
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-500 text-sm">
            {benchmarks?.message || "Loading your benchmarks…"}
          </p>
        </div>
      </div>
    );
  }

  const { user, percentiles, cohortSize } = benchmarks;

  const overallPercentile = Math.round(
    Object.values(percentiles).reduce((a, b) => a + b, 0) / Object.values(percentiles).length
  );

  const metrics: BenchmarkMetric[] = [
    {
      label: "Tasks / Week",
      value: user.tasksCompletedWeekly,
      unit: "tasks",
      percentile: percentiles.tasksCompleted,
      trend: user.trend,
      description: "Average tasks completed per weekly loop",
      emoji: "✓",
    },
    {
      label: "Shipping Score",
      value: user.shippingScore,
      unit: "/100",
      percentile: percentiles.shippingScore,
      trend: user.trend,
      description: "Average completion rate across all weeks",
      emoji: "▲",
    },
    {
      label: "Completion Rate",
      value: user.completionRate,
      unit: "%",
      percentile: percentiles.completionRate,
      trend: user.trend,
      description: "Latest week completion percentage",
      emoji: "▣",
    },
    {
      label: "Weekly Streak",
      value: user.streak,
      unit: "wks",
      percentile: percentiles.streak,
      trend: user.streak >= 3 ? "up" : "flat",
      description: "Consecutive weeks with a loop completed",
      emoji: "🔥",
    },
  ];

  return (
    <div className="space-y-8 fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Benchmarks</h1>
          <p className="text-zinc-400 text-sm">
            {cohortSize >= 20
              ? `Compared against ${cohortSize} anonymized founder-weeks.`
              : "Baseline benchmarks from founder data."}
          </p>
        </div>
        {shareCard && (
          <button
            onClick={() => setShowShareCard(!showShareCard)}
            className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            📤 Share Card
          </button>
        )}
      </header>

      {!activeProject && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-400 text-sm">No project connected. Run <code className="text-violet-400">loopkit init</code> to get started.</p>
        </div>
      )}

      {/* Overall Rank */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Overall Shipping Percentile</p>
            <p className="text-3xl font-bold text-white mt-1">
              {overallPercentile}
              <span className="text-lg text-zinc-500">th</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-violet-500 flex items-center justify-center">
            <span className="text-2xl">
              {overallPercentile >= 75
                ? "🏆"
                : overallPercentile >= 50
                  ? "🚀"
                  : "🌱"}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          You ship more consistently than {overallPercentile}% of founders.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">
                  {metric.emoji}
                </span>
                <span className="text-sm text-zinc-400 font-medium">{metric.label}</span>
              </div>
              <PercentileBadge percentile={metric.percentile} />
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {metric.value}
              </span>
              <span className="text-sm text-zinc-500 mb-1">{metric.unit}</span>
              <TrendIcon trend={metric.trend} />
            </div>

            <p className="text-xs text-zinc-500">{metric.description}</p>

            {/* Percentile bar */}
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${metric.percentile}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              {metric.percentile}th percentile
            </p>
          </div>
        ))}
      </div>

      {/* Shareable Card Modal */}
      {showShareCard && shareCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#0c0c0f] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Share Your Stats</h3>
              <button
                onClick={() => setShowShareCard(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Score</span>
                <span className="text-lg font-bold text-white">{shareCard.avgScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Tasks / Week</span>
                <span className="text-lg font-bold text-white">{shareCard.avgTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Streak</span>
                <span className="text-lg font-bold text-amber-400">
                  {shareCard.streak} weeks 🔥
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Rank</span>
                <PercentileBadge percentile={shareCard.scorePercentile} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Weeks Tracked</span>
                <span className="text-sm text-zinc-400">{shareCard.totalWeeks}</span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900 p-3 mb-4">
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                {shareCard.shareText}
              </pre>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(shareCard.shareText);
              }}
              className="w-full py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h3 className="text-sm font-semibold text-white mb-3">How This Works</h3>
        <div className="space-y-2 text-xs text-zinc-500">
          <p>
            • Benchmarks are computed from anonymized data across all LoopKit founders.
          </p>
          <p>
            • Percentiles show where you rank relative to other founders.
          </p>
          <p>
            • Data is aggregated and anonymized — nobody sees your individual numbers.
          </p>
          <p>
            • More weeks tracked = more accurate benchmarks.
          </p>
        </div>
      </div>
    </div>
  );
}
