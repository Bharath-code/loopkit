"use client";

import { useState, useCallback } from "react";
import type { SimulatorState } from "./terminal/state";
import { ArchitectureTab } from "./tabs/ArchitectureTab";
import { DataFlowTab } from "./tabs/DataFlowTab";
import { FilesTab } from "./tabs/FilesTab";
import { DashboardTab } from "./tabs/DashboardTab";
import { SchemasTab } from "./tabs/SchemasTab";
import {
  Layers,
  GitBranch,
  FileCode,
  LayoutDashboard,
  Database,
} from "lucide-react";

interface Props {
  state: SimulatorState;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "architecture", label: "Architecture", icon: Layers },
  { id: "dataflow", label: "Data Flow", icon: GitBranch },
  { id: "files", label: "Files", icon: FileCode },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schemas", label: "Schemas", icon: Database },
];

export function VisualizationPanel({ state, activeTab, onTabChange }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
        {activeTab === "architecture" && <ArchitectureTab state={state} />}
        {activeTab === "dataflow" && <DataFlowTab state={state} />}
        {activeTab === "files" && <FilesTab state={state} />}
        {activeTab === "dashboard" && <DashboardTab state={state} />}
        {activeTab === "schemas" && <SchemasTab state={state} />}
      </div>
    </div>
  );
}
