"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  SkeletonMetric,
  SkeletonCard,
  SkeletonActivity,
  SkeletonLoopSynthesis,
  SkeletonArchetype,
  SkeletonMarketTiming,
} from "@/components/skeletons";

export default function DashboardOverviewPage() {
  const user = useQuery(api.users.me);
  const projects = useQuery(api.projects.list);
  const isFreeTier = user?.tier === "free";

  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const latestLoop = useQuery(
    api.loopLogs.latestByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const pulseCount = useQuery(
    api.pulse.countResponses,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const streak = useQuery(
    api.loopLogs.streakCount,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const archetype = useQuery(
    api.analytics.getArchetype,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const trending = useQuery(api.analytics.getTrendingValidations, {});

  const tasksCompleted = latestLoop?.tasksCompleted ?? 0;
  const tasksTotal = latestLoop?.tasksTotal ?? 0;
  const shippingScore = latestLoop?.shippingScore ?? 0;

  return (
    <div className="space-y-8 fade-up">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            Project Overview
            {isFreeTier && (
              <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 font-medium border border-zinc-700">
                Read-Only Mode
              </span>
            )}
          </h1>
          <p className="text-zinc-400 text-sm">
            {activeProject
              ? `Active project: ${activeProject.name}`
              : "Welcome back. Here&apos;s what&apos;s happening across your projects."}
          </p>
        </div>

        {isFreeTier && (
          <button className="hidden sm:block px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
            Upgrade for full access
          </button>
        )}
      </header>

      {!activeProject && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-400 text-sm mb-4">
            No projects yet. Run{" "}
            <code className="text-violet-400">loopkit init</code> in your CLI to
            get started.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        {tasksCompleted !== undefined ? (
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">
                ✓
              </span>
              <span className="text-sm text-zinc-400 font-medium">
                Tasks Completed
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {tasksCompleted}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {tasksTotal > 0
                ? `${Math.round((tasksCompleted / tasksTotal) * 100)}% of weekly plan`
                : "No tasks tracked yet"}
            </div>
          </div>
        ) : (
          <SkeletonMetric />
        )}

        {/* Metric 2 */}
        {shippingScore !== undefined ? (
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">
                ▲
              </span>
              <span className="text-sm text-zinc-400 font-medium">
                Shipping Score
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {shippingScore}
              <span className="text-sm text-zinc-500">/100</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Based on completed vs planned tasks
            </div>
          </div>
        ) : (
          <SkeletonMetric />
        )}

        {/* Metric 3 */}
        {pulseCount !== undefined ? (
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm">
                ●
              </span>
              <span className="text-sm text-zinc-400 font-medium">
                Pulse Responses
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {pulseCount ?? 0}
            </div>
            <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
              <span>
                {pulseCount && pulseCount > 0
                  ? "Collecting feedback"
                  : "No responses yet"}
              </span>
            </div>
          </div>
        ) : (
          <SkeletonMetric />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        {latestLoop !== undefined ? (
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <h2 className="text-base font-semibold text-white mb-6">
              Recent Activity
            </h2>
            <div className="space-y-6">
              {latestLoop ? (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    ↻
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">
                      Completed loop for Week {latestLoop.weekNumber}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {latestLoop.date}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  No recent activity. Run{" "}
                  <code className="text-violet-400">loopkit loop</code> to start
                  tracking.
                </p>
              )}
              {streak !== undefined && streak > 0 && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs text-amber-400 shrink-0">
                    🔥
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">
                      {streak}-week streak active
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Keep shipping every Sunday
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <SkeletonActivity />
        )}

        {/* Founder Archetype */}
        {archetype !== undefined ? (
          archetype ? (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
              <h2 className="text-base font-semibold text-white mb-4">
                Founder Archetype
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{archetype.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-white">
                    {archetype.archetype}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {archetype.weeksAnalyzed} weeks analyzed
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                {archetype.description}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-xs text-zinc-500">Avg Score</p>
                  <p className="text-lg font-bold text-white">
                    {archetype.avgScore}/100
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-xs text-zinc-500">Avg Tasks</p>
                  <p className="text-lg font-bold text-white">
                    {archetype.avgTasks}/wk
                  </p>
                </div>
              </div>
            </div>
          ) : null
        ) : (
          <SkeletonArchetype />
        )}

        {/* Weekly Loop Synthesis Highlight */}
        {latestLoop !== undefined ? (
          <div className="p-6 rounded-2xl border border-violet-500/20 bg-sidebar relative overflow-hidden glow-violet">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-cyan-500"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">
                Last Sunday&apos;s Loop
              </h2>
              <span className="px-2 py-1 rounded text-xs bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20">
                {latestLoop ? `Week ${latestLoop.weekNumber}` : "No loops yet"}
              </span>
            </div>

            {latestLoop?.synthesis ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    The One Thing
                  </p>
                  <p className="text-sm text-white font-medium bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                    {latestLoop.synthesis.oneThing}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Build in Public Draft
                  </p>
                  <p className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                    &quot;
                    {latestLoop.synthesis.bipPost ||
                      latestLoop.bipPost ||
                      "No BIP post generated."}
                    &quot;
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                {latestLoop
                  ? "Loop completed but no synthesis available."
                  : "No loops yet. Run loopkit loop on Sunday to generate your first synthesis."}
              </p>
            )}
          </div>
        ) : (
          <SkeletonLoopSynthesis />
        )}

        {/* Trending Validations (IE-8) */}
        {trending !== undefined ? (
          trending?.totalFounders > 0 ? (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">
                  Trending Validations
                </h2>
                <a
                  href="/dashboard/trends"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  View all →
                </a>
              </div>
              <div className="space-y-3">
                {trending.icp.slice(0, 3).map((item, i) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs text-zinc-500 font-mono">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-zinc-300 capitalize">
                      {item.category}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {item.count} founders
                    </span>
                    {item.count7d >= 2 && (
                      <span className="text-xs text-emerald-400">↑</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-4">
                {trending.totalFounders} founders opted into telemetry
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
              <h2 className="text-base font-semibold text-white mb-2">
                Trending Validations
              </h2>
              <p className="text-xs text-zinc-500">
                Not enough data yet. Run{" "}
                <code className="text-violet-400">loopkit init</code> and opt
                into telemetry to contribute.
              </p>
            </div>
          )
        ) : (
          <SkeletonCard lines={3} titleWidth="w-40" />
        )}

        {/* Market Timing Signal (IE-17) */}
        <ErrorBoundary>
          <MarketTimingWidget activeProject={activeProject} />
        </ErrorBoundary>

        {/* Pattern Interrupt (IE-9) */}
        <ErrorBoundary>
          <PatternInterruptWidget activeProject={activeProject} />
        </ErrorBoundary>

        {/* Peer Inspiration (IE-7) */}
        <ErrorBoundary>
          <PeerInspirationWidget activeProject={activeProject} />
        </ErrorBoundary>

        {/* AI Coach v1 (IE-10) */}
        <ErrorBoundary>
          <CoachingWidget activeProject={activeProject} loopLogs={latestLoop} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function PatternInterruptWidget({
  activeProject,
}: {
  activeProject: { _id: string; name: string } | undefined;
}) {
  const projectId = activeProject?._id;
  const patterns = useQuery(
    api.patterns.getActivePatterns,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  // Stable loading state — don't return null to avoid layout shift
  if (patterns === undefined) {
    return <SkeletonCard lines={2} titleWidth="w-40" />;
  }

  if (patterns.length === 0) return null;

  const emojiMap: Record<string, string> = {
    overplanner: "📋",
    snooze_loop: "⏸",
    ship_avoider: "🚢",
    icp_drift: "🎯",
    scope_creep: "📈",
  };

  return (
    <div className="p-6 rounded-2xl border border-amber-500/20 bg-zinc-900/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          ⚡ Pattern Interrupt
        </h2>
        <span className="text-xs text-amber-400 font-medium">
          {patterns.length} detected
        </span>
      </div>
      <div className="space-y-4">
        {patterns.slice(0, 3).map((p) => (
          <div key={p._id} className="flex gap-3">
            <span className="text-lg shrink-0">{emojiMap[p.type] || "⚡"}</span>
            <div>
              <p
                className={`text-sm font-medium ${p.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
              >
                {p.type.replace(/_/g, " ").toUpperCase()}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{p.message}</p>
              {p.suggestions.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1">
                  → {p.suggestions[0]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeerInspirationWidget({
  activeProject,
}: {
  activeProject: { name: string } | undefined;
}) {
  const category = activeProject?.name.toLowerCase() || "general";
  const peers = useQuery(api.peers.getPeerShips, { category, limit: 3 });

  // Loading state — don't show empty-state copy while data loads
  if (peers === undefined) {
    return <SkeletonCard lines={2} titleWidth="w-40" />;
  }

  if (peers.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h2 className="text-base font-semibold text-white mb-2">
          🚀 Peer Inspiration
        </h2>
        <p className="text-xs text-zinc-500">
          Be the first in <span className="text-violet-400">{category}</span> to
          ship this week. Run{" "}
          <code className="text-violet-400">loopkit ship</code> to share
          anonymized progress.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          🚀 Peer Inspiration
        </h2>
        <span className="text-xs text-zinc-500">This week in {category}</span>
      </div>
      <div className="space-y-3">
        {peers.map((p) => (
          <div key={p._id} className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-xs text-violet-400 shrink-0">
              🚀
            </span>
            <div>
              <p className="text-sm text-zinc-300">{p.whatShipped}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Week {p.weekNumber}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachingWidget({
  activeProject,
  loopLogs,
}: {
  activeProject: { _id: string; name: string } | undefined;
  loopLogs:
    | {
        weekNumber: number;
        shippingScore: number;
        tasksCompleted: number;
        tasksTotal: number;
      }
    | null
    | undefined;
}) {
  const projectId = activeProject?._id;
  const allLoops = useQuery(
    api.loopLogs.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  if (allLoops === undefined) {
    return <SkeletonCard lines={2} titleWidth="w-40" />;
  }

  const totalWeeks = allLoops?.length ?? 0;

  // Not enough data for coaching
  if (totalWeeks < 2) return null;

  // Derive coaching moments from loop log data
  const moments: Array<{
    id: string;
    priority: "critical" | "warning" | "info";
    title: string;
    message: string;
    action: string;
    command?: string;
  }> = [];

  // Check for declining score
  if (allLoops && allLoops.length >= 3) {
    const recent = allLoops.slice(-3);
    const scores = recent.map((l) => l.shippingScore);
    if (scores[0] < scores[1] && scores[1] < scores[2]) {
      moments.push({
        id: "dashboard_declining_score",
        priority: "warning",
        title: "Score Declining",
        message: `Your shipping score dropped for 3 consecutive weeks (${scores[2]}% → ${scores[0]}%).`,
        action: "Reduce scope to 1-2 tasks this week and ship something.",
        command: "loopkit loop",
      });
    }
  }

  // Check for low shipping score
  if (loopLogs && loopLogs.shippingScore < 30 && loopLogs.tasksTotal > 0) {
    moments.push({
      id: "dashboard_low_score",
      priority: "warning",
      title: "Low Completion Rate",
      message: `This week you completed ${loopLogs.tasksCompleted}/${loopLogs.tasksTotal} tasks (${loopLogs.shippingScore}%).`,
      action: "Pick one task and finish it. Momentum beats volume.",
      command: "loopkit track",
    });
  }

  // Milestone tips
  if (totalWeeks === 3) {
    moments.push({
      id: "dashboard_week_3",
      priority: "info",
      title: "Week 3 Milestone",
      message:
        "73% of founders who ship by week 4 reach revenue within 6 months.",
      action: "Make this the week you ship something public.",
      command: "loopkit ship",
    });
  } else if (totalWeeks === 8) {
    moments.push({
      id: "dashboard_week_8",
      priority: "info",
      title: "Week 8 Check-In",
      message:
        "You've been at this for 8 weeks. Time to review what's working.",
      action: "Run the success predictor to see your trajectory.",
      command: "loopkit loop",
    });
  } else if (totalWeeks === 16) {
    moments.push({
      id: "dashboard_week_16",
      priority: "info",
      title: "Week 16 — Archetype Check",
      message:
        "You're building real momentum. Does your brief still match user feedback?",
      action: "Revisit your brief and verify your riskiest assumption.",
      command: "loopkit init --analyze",
    });
  }

  // Nothing to show
  if (moments.length === 0) return null;

  // Sort by priority
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...moments].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
  const top = sorted[0];

  const priorityColor = {
    critical: "border-red-500/20 bg-red-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    info: "border-cyan-500/20 bg-cyan-500/5",
  };

  const titleColor = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-cyan-400",
  };

  return (
    <div className={`p-6 rounded-2xl border ${priorityColor[top.priority]}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-base font-semibold ${titleColor[top.priority]}`}>
          {top.priority === "critical"
            ? "🚨"
            : top.priority === "warning"
              ? "⚠️"
              : "💡"}{" "}
          Coach
        </h2>
        <span className="text-xs text-zinc-500">
          {totalWeeks} weeks tracked
        </span>
      </div>
      <p className="text-sm text-white font-medium mb-2">{top.title}</p>
      <p className="text-sm text-zinc-400 mb-4">{top.message}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-300">→ {top.action}</p>
        {top.command && (
          <code className="text-xs text-violet-400 bg-zinc-800/50 px-2 py-1 rounded">
            {top.command}
          </code>
        )}
      </div>
      {sorted.length > 1 && (
        <p className="text-xs text-zinc-600 mt-3">
          +{sorted.length - 1} more coaching moments
        </p>
      )}
    </div>
  );
}

function MarketTimingWidget({
  activeProject,
}: {
  activeProject: { name: string } | undefined;
}) {
  const category = activeProject?.name.toLowerCase() || "general";
  const signal = useQuery(api.marketTiming.getMarketSignal, { category });

  const trendArrow = (trend: string) => {
    switch (trend) {
      case "up":
        return <span className="text-emerald-400">↑</span>;
      case "down":
        return <span className="text-red-400">↓</span>;
      default:
        return <span className="text-zinc-500">→</span>;
    }
  };

  const signalColor = (signal: string) => {
    switch (signal) {
      case "heating":
        return "text-amber-400";
      case "cooling":
        return "text-cyan-400";
      default:
        return "text-zinc-400";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 65) return "text-amber-400";
    if (score <= 35) return "text-cyan-400";
    return "text-zinc-400";
  };

  if (!signal) {
    return <SkeletonMarketTiming />;
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Market Timing</h2>
        <a
          href="#"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Run loopkit timing →
        </a>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div
          className={`text-3xl font-bold ${scoreColor(signal.compositeScore)}`}
        >
          {signal.compositeScore}
          <span className="text-sm text-zinc-500 font-normal">/100</span>
        </div>
        <div className={`text-sm font-medium ${signalColor(signal.signal)}`}>
          {signal.signal === "heating" && "🔥"}
          {signal.signal === "cooling" && "❄️"}
          {signal.signal === "stable" && "⚖️"}{" "}
          {signal.signal.charAt(0).toUpperCase() + signal.signal.slice(1)}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Funding</span>
          <span className="flex items-center gap-2 text-zinc-300">
            {trendArrow(signal.fundingTrend)} {signal.fundingCount} rounds
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Dev Activity</span>
          <span className="flex items-center gap-2 text-zinc-300">
            {trendArrow(signal.devTrend)} {signal.devGrowth} avg stars
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Hiring</span>
          <span className="flex items-center gap-2 text-zinc-300">
            {trendArrow(signal.hiringTrend)} {signal.hiringCount} postings
          </span>
        </div>
      </div>

      {signal.lastUpdated && (
        <p className="text-xs text-zinc-600 mt-4">
          Updated {new Date(signal.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
