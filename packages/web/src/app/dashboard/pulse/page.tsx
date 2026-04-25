"use client";

import { useState } from "react";

export default function PulseInboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "fix" | "validate" | "noise">("all");

  const tabs = [
    { id: "all", label: "All Responses" },
    { id: "fix", label: "Fix Now", count: 2, color: "text-red-400", bg: "bg-red-500/10" },
    { id: "validate", label: "Validate Later", count: 4, color: "text-amber-400", bg: "bg-amber-500/10" },
    { id: "noise", label: "Noise", count: 2, color: "text-zinc-400", bg: "bg-zinc-500/10" },
  ];

  return (
    <div className="space-y-8 fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Pulse Inbox</h1>
        <p className="text-zinc-400 text-sm">
          Async feedback collected and clustered automatically.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "all" | "fix" | "validate" | "noise")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab.bg} ${tab.color}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Placeholder for real Convex data */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 font-medium border border-red-500/20">Fix Now</span>
            <span className="text-xs text-zinc-500">2 hours ago</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">
            &quot;I couldn&apos;t figure out how to export my data to CSV. The button seems to be missing on mobile.&quot;
          </p>
          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs px-3 py-1.5 rounded-md bg-zinc-800 text-white hover:bg-zinc-700 transition-colors cursor-pointer">
              Create Task
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2 py-1 rounded text-xs bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">Validate Later</span>
            <span className="text-xs text-zinc-500">Yesterday</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">
            &quot;It would be great if this integrated directly with Notion so I don&apos;t have to copy paste.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
