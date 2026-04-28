"use client";

import { FolderClosed, FileJson, FileText, FolderOpen } from "lucide-react";
import type { SimulatorState } from "../terminal/state";

interface Props {
  state: SimulatorState;
}

export function FilesTab({ state }: Props) {
  const hasProject = !!state.project;
  const hasTasks = state.tasks.length > 0;
  const hasShips = state.ships.length > 0;
  const hasLoops = state.loops.length > 0;

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-sm font-semibold text-white mb-4">.loopkit/ Files</h3>

      {/* File tree */}
      <div className="font-mono text-xs space-y-1">
        {/* Root */}
        <div className="flex items-center gap-2 text-zinc-300">
          <FolderOpen className="h-4 w-4 text-violet-500" />
          <span>.loopkit/</span>
        </div>

        {/* project.json */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileJson
            className={`h-4 w-4 ${hasProject ? "text-violet-500" : "text-zinc-600"}`}
          />
          <span className={hasProject ? "text-violet-300" : "text-zinc-600"}>
            project.json
          </span>
        </div>

        {/* tasks.json */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileJson
            className={`h-4 w-4 ${hasTasks ? "text-cyan-500" : "text-zinc-600"}`}
          />
          <span className={hasTasks ? "text-cyan-300" : "text-zinc-600"}>
            tasks.json
          </span>
        </div>

        {/* ships.json */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileJson
            className={`h-4 w-4 ${hasShips ? "text-emerald-500" : "text-zinc-600"}`}
          />
          <span className={hasShips ? "text-emerald-300" : "text-zinc-600"}>
            ships.json
          </span>
        </div>

        {/* loops.json */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileJson
            className={`h-4 w-4 ${hasLoops ? "text-red-500" : "text-zinc-600"}`}
          />
          <span className={hasLoops ? "text-red-300" : "text-zinc-600"}>
            loops.json
          </span>
        </div>

        {/* config.json */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileJson className="h-4 w-4 text-zinc-600" />
          <span className="text-zinc-600">config.json</span>
        </div>

        {/* .gitkeep */}
        <div className="flex items-center gap-2 ml-4 text-zinc-400">
          <FileText className="h-4 w-4 text-zinc-700" />
          <span className="text-zinc-700">.gitkeep</span>
        </div>
      </div>

      {/* Details */}
      {hasProject && state.project && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">
            project.json
          </h4>
          <pre className="text-xs text-zinc-500 overflow-x-auto">
            {JSON.stringify(
              {
                name: state.project.name,
                slug: state.project.slug,
                template: state.templateUsed,
                scores: state.project.scores,
                created: new Date().toISOString(),
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-zinc-800/30">
          <div className="text-lg font-bold text-violet-400">
            {state.tasks.length}
          </div>
          <div className="text-xs text-zinc-500">Tasks</div>
        </div>
        <div className="p-2 rounded bg-zinc-800/30">
          <div className="text-lg font-bold text-emerald-400">
            {state.ships.length}
          </div>
          <div className="text-xs text-zinc-500">Ships</div>
        </div>
        <div className="p-2 rounded bg-zinc-800/30">
          <div className="text-lg font-bold text-red-400">
            {state.loops.length}
          </div>
          <div className="text-xs text-zinc-500">Loops</div>
        </div>
      </div>
    </div>
  );
}
