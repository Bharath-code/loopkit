"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/empty-state";

export default function PulseInboxPage() {
  const [activeTab, setActiveTab] = useState<
    "all" | "fix" | "validate" | "noise"
  >("all");
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id;

  const responses = useQuery(
    api.pulse.getResponses,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip",
  );

  useEffect(() => {
    if (!responses) return;
    const currentIds = new Set(responses.map((r) => r._id));
    const incoming = new Set<string>();
    for (const id of currentIds) {
      if (!prevIds.has(id)) incoming.add(id);
    }
    if (incoming.size > 0) {
      setNewIds(incoming);
      setTimeout(() => setNewIds(new Set()), 5000);
    }
    setPrevIds(currentIds);
  }, [responses]);

  const tabs = [
    {
      id: "all" as const,
      label: "All Responses",
      count: responses?.length ?? 0,
    },
    {
      id: "fix" as const,
      label: "Fix Now",
      count: 0,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      id: "validate" as const,
      label: "Validate Later",
      count: 0,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      id: "noise" as const,
      label: "Noise",
      count: 0,
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
    },
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
        <h1 className="text-title text-white mb-2">Pulse Inbox</h1>
        <p className="text-zinc-400 text-sm">
          Async feedback collected and clustered automatically. Updates in
          real-time.
        </p>
      </header>

      {!activeProject && (
        <EmptyState
          presetIcon="inbox"
          title="No project connected"
          description="Use loopkit pulse --share to create a feedback form."
        />
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
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${tab.bg || "bg-zinc-800 text-zinc-400"} ${tab.color || ""}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {!responses || responses.length === 0 ? (
          <EmptyState
            presetIcon="inbox"
            title="No responses yet"
            description="Share your feedback form to start collecting responses."
          />
        ) : (
          responses.map((response) => {
            const isNew = newIds.has(response._id);
            return (
              <div
                key={response._id}
                className={`p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer group ${
                  isNew
                    ? "animate-slideIn border-violet-500/30 bg-violet-500/5"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border transition-all duration-300 ${
                      isNew
                        ? "bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {isNew ? "New" : "Read"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatRelativeTime(response.createdAt)}
                  </span>
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
            );
          })
        )}
      </div>
    </div>
  );
}
