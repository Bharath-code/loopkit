"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { MetricChart } from "@/components/charts";

export default function LoopHistoryPage() {
  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const loops = useQuery(
    api.loopLogs.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const streak = useQuery(
    api.loopLogs.streakCount,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  const chartData = loops
    ? loops
        .map((l) => ({
          week: `W${l.weekNumber}`,
          shippingScore: l.shippingScore,
          tasksCompleted: l.tasksCompleted,
        }))
        .slice(-12)
    : [];

  return (
    <div className="space-y-8 fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Loop History
          </h1>
          <p className="text-zinc-400 text-sm">
            Your weekly synthesis and shipping velocity.
          </p>
        </div>

        {streak !== undefined && streak > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 glow-amber cursor-help group relative">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-sm font-bold text-amber-400">
                {streak}-Week Streak
              </div>
              <div className="text-xs text-amber-500/70">
                Loop closed every Sunday
              </div>
            </div>
            <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              You&apos;ve successfully run `loopkit loop` and shipped your
              synthesis for {streak} consecutive weeks.
            </div>
          </div>
        )}
      </header>

      {!activeProject && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-400 text-sm">
            No project connected. Run{" "}
            <code className="text-violet-400">loopkit init</code> to get
            started.
          </p>
        </div>
      )}

      {chartData.length >= 2 && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <h2 className="text-base font-semibold text-white mb-4">
            Shipping Score Trend
          </h2>
          <MetricChart
            data={chartData}
            xKey="week"
            yKey="shippingScore"
            color="#8b5cf6"
            label="Score over time"
            height={220}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-4 sm:pl-0">
        <div className="absolute left-4 sm:left-[120px] top-2 bottom-0 w-px bg-zinc-800"></div>

        <div className="space-y-12">
          {!loops || loops.length === 0 ? (
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
              <p className="text-zinc-500 text-sm">
                No loop history yet. Run{" "}
                <code className="text-violet-400">loopkit loop</code> on Sunday
                to create your first weekly synthesis.
              </p>
            </div>
          ) : (
            loops.map((loop) => (
              <div
                key={loop._id}
                className="relative flex flex-col sm:flex-row gap-6 sm:gap-12 group"
              >
                <div className="sm:w-[120px] shrink-0 pt-1 flex sm:flex-col items-center sm:items-end sm:text-right gap-4 sm:gap-1 relative z-10">
                  <div className="absolute left-[-21px] sm:left-auto sm:-right-[5px] w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-[#09090b] group-hover:scale-125 transition-transform"></div>
                  <div className="text-sm font-bold text-white">
                    Week {loop.weekNumber}
                  </div>
                  <div className="text-xs text-zinc-500">{loop.date}</div>
                </div>

                <div className="flex-1 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        Shipping Score
                      </span>
                      <span
                        className={`text-sm font-bold ${loop.shippingScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {loop.shippingScore}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        Tasks Done
                      </span>
                      <span className="text-sm font-bold text-white">
                        {loop.tasksCompleted}
                      </span>
                    </div>
                    {loop.overridden && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">
                          Override
                        </span>
                        <span className="text-sm font-bold text-red-400">
                          Yes
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                      The One Thing
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50">
                      {loop.synthesis?.oneThing || "No synthesis recorded."}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
