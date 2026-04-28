"use client";

import { TrendingUp, CheckCircle2, Target, Flame } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { SimulatorState } from "../terminal/state";

interface Props {
  state: SimulatorState;
}

export function DashboardTab({ state }: Props) {
  const hasProject = !!state.project;
  const hasLoops = state.loops.length > 0;

  // Prepare chart data
  const loopData = state.loops.map((loop, i) => ({
    week: `W${loop.week}`,
    score: loop.score,
    tasks: loop.tasksCompleted,
  }));

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-sm font-semibold text-white mb-4">Dashboard</h3>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
          <Target className="h-8 w-8 mb-2 text-zinc-700" />
          <p className="text-sm">No project active</p>
          <p className="text-xs text-zinc-600">Run loopkit init to start</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-zinc-400">Streak</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {state.streak}
              </div>
              <div className="text-xs text-zinc-500">weeks</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-zinc-400">Tasks</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {state.tasks.filter((t) => t.status === "done").length}
              </div>
              <div className="text-xs text-zinc-500">
                / {state.tasks.length} total
              </div>
            </div>
          </div>

          {/* Score chart */}
          {hasLoops && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-400 mb-2">
                Weekly Scores
              </h4>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={loopData}>
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 9, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="url(#scoreGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent loops */}
          {hasLoops && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-2">
                Recent Activity
              </h4>
              <div className="space-y-1">
                {state.loops
                  .slice(-3)
                  .reverse()
                  .map((loop) => (
                    <div
                      key={loop.week}
                      className="flex items-center justify-between p-2 rounded bg-zinc-800/30 text-xs"
                    >
                      <span className="text-zinc-400">Week {loop.week}</span>
                      <span
                        className={`font-medium ${loop.score > 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {loop.score > 0 ? "+" : ""}
                        {loop.score}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No loops yet */}
          {!hasLoops && (
            <div className="p-3 rounded bg-zinc-800/30 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs text-zinc-500">
                Complete a loop to see progress
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
