"use client";

import type { SimulatorState } from "../terminal/state";

interface Props {
  state: SimulatorState;
}

export function DataFlowTab({ state }: Props) {
  const hasProject = !!state.project;
  const hasTasks = state.tasks.length > 0;
  const hasShips = state.ships.length > 0;
  const hasLoops = state.loops.length > 0;

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-sm font-semibold text-white mb-4">Data Flow</h3>

      <div className="space-y-3 text-xs">
        {/* init flow */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${hasProject ? "bg-violet-500" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-300 font-medium">loopkit init</span>
          </div>
          <p className="text-zinc-500 ml-4">
            {hasProject
              ? `Creates project "${state.project?.name}" in .loopkit/project.json`
              : "Creates project structure in .loopkit/ directory"}
          </p>
        </div>

        {/* track flow */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${hasTasks ? "bg-cyan-500" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-300 font-medium">loopkit track</span>
          </div>
          <p className="text-zinc-500 ml-4">
            {hasTasks
              ? `${state.tasks.filter((t) => t.status === "open").length} open tasks tracked`
              : "Writes tasks to .loopkit/tasks.json"}
          </p>
        </div>

        {/* ship flow */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${hasShips ? "bg-emerald-500" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-300 font-medium">loopkit ship</span>
          </div>
          <p className="text-zinc-500 ml-4">
            {hasShips
              ? `${state.ships.length} ships recorded`
              : "Records shipping events locally"}
          </p>
        </div>

        {/* loop flow */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${hasLoops ? "bg-red-500" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-300 font-medium">loopkit loop</span>
          </div>
          <p className="text-zinc-500 ml-4">
            {hasLoops
              ? `Week ${state.loops.length} complete, ${state.streak} week streak`
              : "Runs weekly learning loop"}
          </p>
        </div>

        {/* sync flow */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${hasShips || hasLoops ? "bg-amber-500" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-300 font-medium">Auto-sync</span>
          </div>
          <p className="text-zinc-500 ml-4">
            {hasShips || hasLoops
              ? "Data synced to Convex backend for web dashboard"
              : "Syncs to cloud when needed"}
          </p>
        </div>
      </div>

      {/* Visualizer */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <h4 className="text-xs font-medium text-zinc-400 mb-3">
          Live Operations
        </h4>
        <div className="h-32 flex items-center justify-center">
          {hasProject ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-violet-500 animate-pulse" />
              <span className="text-zinc-500 text-sm">
                Waiting for commands...
              </span>
            </div>
          ) : (
            <span className="text-zinc-600 text-sm">No active project</span>
          )}
        </div>
      </div>
    </div>
  );
}
