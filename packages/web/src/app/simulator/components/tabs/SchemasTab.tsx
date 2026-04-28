"use client";

import type { SimulatorState } from "../terminal/state";

interface Props {
  state: SimulatorState;
}

const schemas = [
  {
    name: "Project",
    file: "project.json",
    colorClass: "text-violet-400",
    bgClass: "bg-violet-900/30",
    borderClass: "border-violet-500/30",
    schema: `{
  "name": "ProposalAI",
  "slug": "proposalai",
  "template": "saas",
  "answers": { ... },
  "scores": { icp: 7, problem: 8, mvp: 6, overall: 7 },
  "riskiestAssumption": "...",
  "validationAction": "...",
  "brief": "..."
}`,
  },
  {
    name: "Task",
    file: "tasks.json",
    colorClass: "text-cyan-400",
    bgClass: "bg-cyan-900/30",
    borderClass: "border-cyan-500/30",
    schema: `{
  "id": 1,
  "title": "Build landing page",
  "status": "open" | "done" | "snoozed",
  "createdAt": "2024-01-15",
  "closedAt": "2024-01-20"
}`,
  },
  {
    name: "Ship",
    file: "ships.json",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-900/30",
    borderClass: "border-emerald-500/30",
    schema: `{
  "date": "2024-01-15",
  "whatShipped": "Initial landing page"
}`,
  },
  {
    name: "Loop",
    file: "loops.json",
    colorClass: "text-red-400",
    bgClass: "bg-red-900/30",
    borderClass: "border-red-500/30",
    schema: `{
  "week": 1,
  "score": 1,
  "tasksCompleted": 3,
  "tasksTotal": 5,
  "oneThing": "Focus on pricing",
  "bipPost": "..."
}`,
  },
];

export function SchemasTab({ state }: Props) {
  const hasProject = !!state.project;

  const getPhaseColor = () => {
    switch (state.phase) {
      case "init":
        return "text-violet-400 border-violet-500/30";
      case "develop":
        return "text-cyan-400 border-cyan-500/30";
      case "deliver":
        return "text-emerald-400 border-emerald-500/30";
      case "learn":
        return "text-amber-400 border-amber-500/30";
      case "iterate":
        return "text-red-400 border-red-500/30";
      default:
        return "text-zinc-400 border-zinc-700";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-emerald-400";
    if (score >= 5) return "text-amber-400";
    return "text-red-400";
  };

  const phaseColor = getPhaseColor();

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-sm font-semibold text-white mb-4">Zod Schemas</h3>

      <div className="space-y-4">
        {schemas.map((s) => (
          <div
            key={s.name}
            className="rounded-lg bg-zinc-800/50 border border-zinc-700 overflow-hidden"
          >
            <div
              className={`px-3 py-2 ${s.bgClass} border-b border-zinc-700 flex items-center justify-between`}
            >
              <span className={`text-sm font-medium ${s.colorClass}`}>
                {s.name}
              </span>
              <span className="text-xs text-zinc-500">{s.file}</span>
            </div>
            <pre className="p-3 text-xs text-zinc-400 overflow-x-auto font-mono">
              {s.schema}
            </pre>
          </div>
        ))}
      </div>

      {/* Current state */}
      {hasProject && state.project && (
        <div
          className={`mt-4 p-3 rounded-lg bg-zinc-800/50 border ${phaseColor}`}
        >
          <h4 className="text-xs font-medium text-violet-400 mb-2">
            Current Project
          </h4>
          <div className="text-xs text-zinc-400 space-y-1">
            <div>
              <span className="text-zinc-500">name:</span> {state.project.name}
            </div>
            <div>
              <span className="text-zinc-500">slug:</span> {state.project.slug}
            </div>
            <div>
              <span className="text-zinc-500">template:</span>{" "}
              {state.templateUsed}
            </div>
            {state.project.scores && (
              <div className="mt-2 pt-2 border-t border-zinc-700">
                <span className="text-zinc-500">scores:</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    ICP:{" "}
                    <span className={getScoreColor(state.project.scores.icp)}>
                      {state.project.scores.icp}
                    </span>
                  </div>
                  <div>
                    Problem:{" "}
                    <span
                      className={getScoreColor(state.project.scores.problem)}
                    >
                      {state.project.scores.problem}
                    </span>
                  </div>
                  <div>
                    MVP:{" "}
                    <span className={getScoreColor(state.project.scores.mvp)}>
                      {state.project.scores.mvp}
                    </span>
                  </div>
                  <div>
                    Overall:{" "}
                    <span
                      className={getScoreColor(state.project.scores.overall)}
                    >
                      {state.project.scores.overall}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
