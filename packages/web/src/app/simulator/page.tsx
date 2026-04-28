"use client";

import { useState, useCallback } from "react";
import { SimulatorTerminal } from "./components/SimulatorTerminal";
import { VisualizationPanel } from "./components/VisualizationPanel";
import { LoopDiagram } from "./components/LoopDiagram";
import { FutureRoadmap } from "./components/FutureRoadmap";
import type { SimulatorState, TerminalLine } from "./components/terminal/state";
import { initialState } from "./components/terminal/state";
import {
  Hexagon,
  Circle,
  Triangle,
  MessageCircle,
  RefreshCw,
  Radar,
  Search,
  Clock,
  Zap,
  PartyPopper,
} from "lucide-react";

const QUICK_COMMANDS = [
  {
    cmd: "loopkit init",
    label: "init",
    icon: Hexagon,
    color: "text-violet-400",
    border: "border-violet-500/30",
  },
  {
    cmd: "loopkit track",
    label: "track",
    icon: Circle,
    color: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  {
    cmd: "loopkit ship",
    label: "ship",
    icon: Triangle,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  {
    cmd: "loopkit pulse",
    label: "pulse",
    icon: MessageCircle,
    color: "text-amber-400",
    border: "border-amber-500/30",
  },
  {
    cmd: "loopkit loop",
    label: "loop",
    icon: RefreshCw,
    color: "text-red-400",
    border: "border-red-500/30",
  },
  {
    cmd: "loopkit radar",
    label: "radar",
    icon: Radar,
    color: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  {
    cmd: "loopkit keywords",
    label: "keywords",
    icon: Search,
    color: "text-amber-400",
    border: "border-amber-500/30",
  },
  {
    cmd: "loopkit timing",
    label: "timing",
    icon: Clock,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  {
    cmd: "loopkit coach",
    label: "coach",
    icon: Zap,
    color: "text-violet-400",
    border: "border-violet-500/30",
  },
  {
    cmd: "loopkit celebrate",
    label: "celebrate",
    icon: PartyPopper,
    color: "text-amber-400",
    border: "border-amber-500/30",
  },
];

export default function SimulatorPage() {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [activeTab, setActiveTab] = useState("architecture");
  const [injectedCommand, setInjectedCommand] = useState<string | null>(null);

  const handleStateChange = useCallback((newState: SimulatorState) => {
    setState(newState);
  }, []);

  const handleCommandExecuted = useCallback((cmd: string) => {
    if (cmd.includes("init")) setActiveTab("dataflow");
    else if (cmd.includes("track")) setActiveTab("files");
    else if (cmd.includes("ship")) setActiveTab("dashboard");
    else if (cmd.includes("pulse")) setActiveTab("dashboard");
    else if (cmd.includes("loop")) setActiveTab("dashboard");
    else if (
      cmd.includes("radar") ||
      cmd.includes("keywords") ||
      cmd.includes("timing")
    )
      setActiveTab("dataflow");
  }, []);

  const handleQuickCommand = useCallback((cmd: string) => {
    setInjectedCommand(cmd);
  }, []);

  return (
    <div className="relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-zinc-900/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-lg font-bold">
              <span className="gradient-text">LoopKit Simulator</span>
            </h1>
            {state.phase !== "idle" && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  state.phase === "init"
                    ? "border-violet-500/30 text-violet-400 bg-violet-500/10"
                    : state.phase === "develop"
                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                      : state.phase === "deliver"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : state.phase === "learn"
                          ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                          : "border-red-500/30 text-red-400 bg-red-500/10"
                }`}
              >
                {state.phase}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_COMMANDS.map(({ cmd, label, icon: Icon, color, border }) => (
              <button
                key={label}
                onClick={() => handleQuickCommand(cmd)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${border} bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer whitespace-nowrap ${color}`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6">
          {/* Left: Terminal */}
          <SimulatorTerminal
            state={state}
            onStateChange={handleStateChange}
            onCommandExecuted={handleCommandExecuted}
            injectedCommand={injectedCommand}
            onInjectedCommandConsumed={() => setInjectedCommand(null)}
          />

          {/* Right: Visualization Panel */}
          <VisualizationPanel
            state={state}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Loop Diagram */}
        <div className="mt-6">
          <LoopDiagram phase={state.phase} />
        </div>

        {/* Future Roadmap */}
        <div className="mt-6">
          <FutureRoadmap />
        </div>
      </div>
    </div>
  );
}
