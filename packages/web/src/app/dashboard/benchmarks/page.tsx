"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { TrendIcon } from "@/components/trend-icon";
import { EmptyState } from "@/components/empty-state";
import { PercentileBar } from "@/components/charts";
import { SkeletonMetric, SkeletonCard } from "@/components/skeletons";
import {
  Trophy,
  Rocket,
  Sprout,
  Flame,
  Share2,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  X,
} from "lucide-react";

interface BenchmarkMetric {
  label: string;
  value: number;
  unit: string;
  percentile: number;
  trend: "up" | "down" | "flat";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
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
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
}

export default function BenchmarksPage() {
  const [showShareCard, setShowShareCard] = useState(false);

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const benchmarks = useQuery(
    api.analytics.getBenchmarks,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const shareCard = useQuery(
    api.analytics.getShareCard,
    projectId && showShareCard
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );

  if (!benchmarks || !benchmarks.user) {
    return (
      <div className="space-y-8 fade-up">
        <header>
          <h1 className="text-title text-white mb-2">Benchmarks</h1>
          <p className="text-zinc-400 text-sm">
            See how your shipping habits compare.
          </p>
        </header>
        <SkeletonMetric />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard lines={3} titleWidth="w-32" />
          <SkeletonCard lines={3} titleWidth="w-32" />
          <SkeletonCard lines={3} titleWidth="w-32" />
          <SkeletonCard lines={3} titleWidth="w-32" />
        </div>
      </div>
    );
  }

  const { user, percentiles, cohortSize } = benchmarks;

  const overallPercentile = Math.round(
    Object.values(percentiles).reduce((a, b) => a + b, 0) /
      Object.values(percentiles).length,
  );

  const metrics: BenchmarkMetric[] = [
    {
      label: "Tasks / Week",
      value: user.tasksCompletedWeekly,
      unit: "tasks",
      percentile: percentiles.tasksCompleted,
      trend: user.trend,
      description: "Average tasks completed per weekly loop",
      icon: CheckCircle2,
    },
    {
      label: "Shipping Score",
      value: user.shippingScore,
      unit: "/100",
      percentile: percentiles.shippingScore,
      trend: user.trend,
      description: "Average completion rate across all weeks",
      icon: TrendingUp,
    },
    {
      label: "Completion Rate",
      value: user.completionRate,
      unit: "%",
      percentile: percentiles.completionRate,
      trend: user.trend,
      description: "Latest week completion percentage",
      icon: BarChart3,
    },
    {
      label: "Weekly Streak",
      value: user.streak,
      unit: "wks",
      percentile: percentiles.streak,
      trend: user.streak >= 3 ? "up" : "flat",
      description: "Consecutive weeks with a loop completed",
      icon: Flame,
    },
  ];

  return (
    <div className="space-y-8 fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-title text-white mb-2">Benchmarks</h1>
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
            <Share2
              className="h-4 w-4 inline-block mr-1.5"
              aria-hidden="true"
            />
            Share Card
          </button>
        )}
      </header>

      {!activeProject && (
        <EmptyState
          presetIcon="loop"
          title="No project connected"
          description="Run loopkit init to get started."
        />
      )}

      {/* Overall Rank */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Overall Shipping Percentile</p>
            <p className="text-metric text-white mt-1">
              {overallPercentile}
              <span className="text-lg text-zinc-500">th</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-violet-500 flex items-center justify-center">
            {overallPercentile >= 75 ? (
              <Trophy className="h-7 w-7 text-amber-400" aria-hidden="true" />
            ) : overallPercentile >= 50 ? (
              <Rocket className="h-7 w-7 text-violet-400" aria-hidden="true" />
            ) : (
              <Sprout className="h-7 w-7 text-emerald-400" aria-hidden="true" />
            )}
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
            className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors metric-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-zinc-400 font-medium">
                  {metric.label}
                </span>
              </div>
              <PercentileBadge percentile={metric.percentile} />
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-metric text-white">{metric.value}</span>
              <span className="text-sm text-zinc-500 mb-1">{metric.unit}</span>
              <TrendIcon trend={metric.trend} />
            </div>

            <p className="text-xs text-zinc-500">{metric.description}</p>

            <PercentileBar
              value={metric.percentile}
              max={100}
              colorFrom="#8b5cf6"
              colorTo="#06b6d4"
              height={6}
              label={`${metric.percentile}th percentile`}
              className="mt-3"
            />
          </div>
        ))}
      </div>

      {/* Shareable Card Modal */}
      {showShareCard && shareCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Share your stats"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-sidebar p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Share Your Stats</h3>
              <button
                onClick={() => setShowShareCard(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Score</span>
                <span className="text-lg font-bold text-white">
                  {shareCard.avgScore}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Tasks / Week</span>
                <span className="text-lg font-bold text-white">
                  {shareCard.avgTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Streak</span>
                <span className="text-lg font-bold text-amber-400">
                  {shareCard.streak} weeks{" "}
                  <Flame className="h-4 w-4 inline-block" aria-hidden="true" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Rank</span>
                <PercentileBadge percentile={shareCard.scorePercentile} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Weeks Tracked</span>
                <span className="text-sm text-zinc-400">
                  {shareCard.totalWeeks}
                </span>
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
        <h3 className="text-sm font-semibold text-white mb-3">
          How This Works
        </h3>
        <div className="space-y-2 text-xs text-zinc-500">
          <p>
            • Benchmarks are computed from anonymized data across all LoopKit
            founders.
          </p>
          <p>• Percentiles show where you rank relative to other founders.</p>
          <p>
            • Data is aggregated and anonymized — nobody sees your individual
            numbers.
          </p>
          <p>• More weeks tracked = more accurate benchmarks.</p>
        </div>
      </div>
    </div>
  );
}
