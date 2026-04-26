"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function PulseInboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "fix" | "validate" | "noise">("all");

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const responses = useQuery(
    api.pulse.getResponses,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const tabs = [
    { id: "all" as const, label: "All Responses", count: responses?.length ?? 0 },
    { id: "fix" as const, label: "Fix Now", count: 0, color: "text-red-400", bg: "bg-red-500/10" },
    { id: "validate" as const, label: "Validate Later", count: 0, color: "text-amber-400", bg: "bg-amber-500/10" },
    { id: "noise" as const, label: "Noise", count: 0, color: "text-zinc-400", bg: "bg-zinc-500/10" },
  ];

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-8 fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Pulse Inbox</h1>
        <p className="text-zinc-400 text-sm">
          Async feedback collected and clustered automatically.
        </p>
      </header>

      {!activeProject && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-400 text-sm">No project connected. Use <code className="text-violet-400">loopkit pulse --share</code> to create a feedback form.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab.bg || "bg-zinc-800 text-zinc-400"} ${tab.color || ""}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {!responses || responses.length === 0 ? (
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
            <p className="text-zinc-500 text-sm">No responses yet. Share your feedback form to start collecting.</p>
          </div>
        ) : (
          responses.map((response) => (
            <div
              key={response._id}
              className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-400 font-medium border border-zinc-700">
                  New
                </span>
                <span className="text-xs text-zinc-500">{formatRelativeTime(response.createdAt)}</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                &quot;{response.text}&quot;
              </p>
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs px-3 py-1.5 rounded-md bg-zinc-800 text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                  Create Task
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
