"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardOverviewPage() {
  const user = useQuery(api.users.me);
  const projects = useQuery(api.projects.list);
  const isFreeTier = user?.tier === "free";

  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const latestLoop = useQuery(
    api.loopLogs.latestByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const pulseCount = useQuery(
    api.pulse.countResponses,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const streak = useQuery(
    api.loopLogs.streakCount,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const archetype = useQuery(
    api.analytics.getArchetype,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
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
          <p className="text-zinc-400 text-sm mb-4">No projects yet. Run <code className="text-violet-400">loopkit init</code> in your CLI to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">✓</span>
            <span className="text-sm text-zinc-400 font-medium">Tasks Completed</span>
          </div>
          {tasksCompleted !== undefined ? (
            <>
              <div className="text-3xl font-bold text-white">{tasksCompleted}</div>
              <div className="mt-2 text-xs text-zinc-500">
                {tasksTotal > 0 ? `${Math.round((tasksCompleted / tasksTotal) * 100)}% of weekly plan` : "No tasks tracked yet"}
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-16 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-32"></div>
            </div>
          )}
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">▲</span>
            <span className="text-sm text-zinc-400 font-medium">Shipping Score</span>
          </div>
          {shippingScore !== undefined ? (
            <>
              <div className="text-3xl font-bold text-white">{shippingScore}<span className="text-sm text-zinc-500">/100</span></div>
              <div className="mt-2 text-xs text-zinc-500">
                Based on completed vs planned tasks
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-24 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-28"></div>
            </div>
          )}
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm">●</span>
            <span className="text-sm text-zinc-400 font-medium">Pulse Responses</span>
          </div>
          {pulseCount !== undefined ? (
            <>
              <div className="text-3xl font-bold text-white">{pulseCount ?? 0}</div>
              <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                <span>{pulseCount && pulseCount > 0 ? "Collecting feedback" : "No responses yet"}</span>
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-800 rounded w-12 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-24"></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <h2 className="text-base font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {latestLoop !== undefined ? (
              latestLoop ? (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    ↻
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">
                      Completed loop for Week {latestLoop.weekNumber}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{latestLoop.date}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No recent activity. Run <code className="text-violet-400">loopkit loop</code> to start tracking.</p>
              )
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
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
                  <p className="text-xs text-zinc-500 mt-1">Keep shipping every Sunday</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Founder Archetype */}
        {archetype && (
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <h2 className="text-base font-semibold text-white mb-4">Founder Archetype</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{archetype.emoji}</span>
              <div>
                <p className="text-lg font-bold text-white">{archetype.archetype}</p>
                <p className="text-xs text-zinc-500">{archetype.weeksAnalyzed} weeks analyzed</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4">{archetype.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Avg Score</p>
                <p className="text-lg font-bold text-white">{archetype.avgScore}/100</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Avg Tasks</p>
                <p className="text-lg font-bold text-white">{archetype.avgTasks}/wk</p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Loop Synthesis Highlight */}
        <div className="p-6 rounded-2xl border border-violet-500/20 bg-[#0c0c0f] relative overflow-hidden glow-violet">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-cyan-500"></div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Last Sunday&apos;s Loop</h2>
            {latestLoop !== undefined ? (
              <span className="px-2 py-1 rounded text-xs bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20">
                {latestLoop ? `Week ${latestLoop.weekNumber}` : "No loops yet"}
              </span>
            ) : (
              <div className="animate-pulse w-16 h-5 bg-zinc-800 rounded"></div>
            )}
          </div>

          {latestLoop !== undefined ? (
            latestLoop?.synthesis ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">The One Thing</p>
                  <p className="text-sm text-white font-medium bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                    {latestLoop.synthesis.oneThing}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Build in Public Draft</p>
                  <p className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                    &quot;{latestLoop.synthesis.bipPost || latestLoop.bipPost || "No BIP post generated."}&quot;
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                {latestLoop
                  ? "Loop completed but no synthesis available."
                  : "No loops yet. Run loopkit loop on Sunday to generate your first synthesis."}
              </p>
            )
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-3 bg-zinc-800 rounded w-24"></div>
              <div className="h-12 bg-zinc-800 rounded"></div>
              <div className="h-3 bg-zinc-800 rounded w-32"></div>
              <div className="h-10 bg-zinc-800 rounded"></div>
            </div>
          )}
        </div>

        {/* Trending Validations (IE-8) */}
        {trending ? (
          trending.totalFounders > 0 ? (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Trending Validations</h2>
                <a href="/dashboard/trends" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  View all →
                </a>
              </div>
              <div className="space-y-3">
                {trending.icp.slice(0, 3).map((item, i) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs text-zinc-500 font-mono">{i + 1}</span>
                    <span className="flex-1 text-sm text-zinc-300 capitalize">{item.category}</span>
                    <span className="text-xs text-zinc-500">{item.count} founders</span>
                    {item.count7d >= 2 && (
                      <span className="text-xs text-emerald-400">↑</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-4">{trending.totalFounders} founders opted into telemetry</p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
              <h2 className="text-base font-semibold text-white mb-2">Trending Validations</h2>
              <p className="text-xs text-zinc-500">Not enough data yet. Run <code className="text-violet-400">loopkit init</code> and opt into telemetry to contribute.</p>
            </div>
          )
        ) : (
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 animate-pulse">
            <div className="h-5 w-40 bg-zinc-800 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-zinc-800 rounded w-full"></div>
              <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
          </div>
        )}

        {/* Market Timing Signal (IE-17) */}
        <MarketTimingWidget />
      </div>
    </div>
  );
}

function MarketTimingWidget() {
  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
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
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4"></div>
        <div className="h-8 bg-zinc-800 rounded w-24 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-full"></div>
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Market Timing</h2>
        <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          Run loopkit timing →
        </a>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`text-3xl font-bold ${scoreColor(signal.compositeScore)}`}>
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
