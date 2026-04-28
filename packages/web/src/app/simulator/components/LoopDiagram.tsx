"use client";

import {
  Hexagon,
  Circle,
  Triangle,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import type { Phase } from "./terminal/state";

interface Props {
  phase: Phase;
}

type ActivePhase = Exclude<Phase, "idle">;

interface PhaseConfig {
  id: ActivePhase;
  label: string;
  color: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: "init",
    label: "init",
    color: "violet",
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/20",
    borderClass: "border-violet-500",
  },
  {
    id: "develop",
    label: "track",
    color: "cyan",
    colorClass: "text-cyan-400",
    bgClass: "bg-cyan-500/20",
    borderClass: "border-cyan-500",
  },
  {
    id: "deliver",
    label: "ship",
    color: "emerald",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500",
  },
  {
    id: "learn",
    label: "pulse",
    color: "amber",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/20",
    borderClass: "border-amber-500",
  },
  {
    id: "iterate",
    label: "loop",
    color: "red",
    colorClass: "text-red-400",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500",
  },
];

const ICONS: Record<Exclude<Phase, "idle">, typeof Hexagon> = {
  init: Hexagon,
  develop: Circle,
  deliver: Triangle,
  learn: MessageCircle,
  iterate: RefreshCw,
};

export function LoopDiagram({ phase }: Props) {
  const phaseIndex = PHASES.findIndex((p) => p.id === phase);
  const activePhase = PHASES.find((p) => p.id === phase);

  const isActive = (phaseId: Phase) => {
    if (phase === "idle") return false;
    const idx = PHASES.findIndex((p) => p.id === phaseId);
    return idx <= phaseIndex;
  };

  const isCurrent = (phaseId: Phase) => phase === phaseId;

  return (
    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <h3 className="text-sm font-semibold text-white mb-4">LoopKit Loop</h3>

      <div className="flex items-center justify-between gap-1">
        {PHASES.map((p, i) => {
          const Icon = ICONS[p.id];
          const active = isActive(p.id);
          const current = isCurrent(p.id);

          return (
            <div key={p.id} className="flex-1 flex flex-col items-center">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 w-full ${
                    active ? p.borderClass + " bg-current" : "bg-zinc-800"
                  }`}
                  style={active ? undefined : { background: undefined }}
                />
              )}

              {/* Node */}
              <div className="relative">
                {current && (
                  <div
                    className={`absolute inset-0 animate-ping ${p.bgClass} rounded-full`}
                  />
                )}
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    active
                      ? `${p.borderClass} ${p.bgClass}`
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? p.colorClass : "text-zinc-600"}`}
                  />
                </div>
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs font-medium ${active ? p.colorClass : "text-zinc-600"}`}
              >
                {p.label}
              </span>

              {/* Description */}
              <span className="text-xs text-zinc-600 mt-0.5 hidden sm:block">
                {p.id === "init" && "Initialize project"}
                {p.id === "develop" && "Track tasks"}
                {p.id === "deliver" && "Ship to users"}
                {p.id === "learn" && "Learn from users"}
                {p.id === "iterate" && "Iterate & repeat"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current phase indicator */}
      {phase !== "idle" && activePhase && (
        <div className="mt-4 p-2 rounded-lg bg-zinc-800/30 text-center">
          <span className="text-xs text-zinc-500">
            Currently in <span className={activePhase.colorClass}>{phase}</span>{" "}
            phase
          </span>
        </div>
      )}
    </div>
  );
}
