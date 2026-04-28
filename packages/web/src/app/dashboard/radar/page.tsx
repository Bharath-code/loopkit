"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { TrendIcon } from "@/components/trend-icon";
import {
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Calendar,
  Tag,
} from "lucide-react";

type SortKey = "relevance" | "date" | "name" | "platform";
type SortDir = "asc" | "desc";
type PlatformFilter = "all" | "producthunt" | "hackernews";

interface LaunchRow {
  name: string;
  url?: string;
  date: string;
  platform: string;
  relevance: number;
  description?: string;
  tagline?: string;
}

function relevanceColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-500";
}

function relevanceBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-zinc-800/50 border-zinc-700";
}

function platformBadge(platform: string): string {
  switch (platform) {
    case "producthunt":
      return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
    case "hackernews":
      return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border border-zinc-700";
  }
}

function platformLabel(platform: string): string {
  switch (platform) {
    case "producthunt":
      return "Product Hunt";
    case "hackernews":
      return "Hacker News";
    default:
      return platform;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

export default function RadarPage() {
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const category = activeProject?.name?.toLowerCase() || "general";

  const data = useQuery(
    api.competitorRadar.getCompetitorLaunches,
    activeProject ? { category } : "skip",
  );

  const historyStats = useQuery(
    api.competitorRadar.getCompetitorLaunchesHistory,
    activeProject ? { category } : "skip",
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.launches as LaunchRow[];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.tagline && r.tagline.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    if (platformFilter !== "all") {
      rows = rows.filter((r) => r.platform === platformFilter);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "relevance":
          cmp = a.relevance - b.relevance;
          break;
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "platform":
          cmp = a.platform.localeCompare(b.platform);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [data, searchQuery, platformFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return "\u2195";
    return sortDir === "asc" ? "\u2191" : "\u2193";
  };

  const thisWeekCount = useMemo(() => {
    if (!data) return 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return data.launches.filter((l) => new Date(l.date).getTime() >= weekAgo)
      .length;
  }, [data]);

  if (!data) {
    return (
      <div className="space-y-8 fade-up">
        <header>
          <h1 className="text-title text-white mb-2">Competitor Radar</h1>
          <p className="text-zinc-400 text-sm">
            Track competitor launches and market activity.
          </p>
        </header>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded-lg w-48" />
          <div className="h-64 bg-zinc-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data.launches || data.launches.length === 0) {
    return (
      <div className="space-y-8 fade-up">
        <header>
          <h1 className="text-title text-white mb-2">Competitor Radar</h1>
          <p className="text-zinc-400 text-sm">
            Track competitor launches and market activity.
          </p>
        </header>
        <EmptyState
          presetIcon="trending"
          title="No competitor data yet"
          description="Run loopkit radar in your CLI to scan for competitor launches."
          action={
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 mt-2">
              <code className="text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                loopkit radar
              </code>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      <header>
        <h1 className="text-title text-white mb-2">Competitor Radar</h1>
        <p className="text-zinc-400 text-sm">
          Track competitor launches and market activity in your space.
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs text-zinc-500">This Week</span>
          </div>
          <p className="text-2xl font-bold text-white">{thisWeekCount}</p>
          <p className="text-xs text-zinc-500">launches in past 7 days</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-violet-400" aria-hidden="true" />
            <span className="text-xs text-zinc-500">Total Found</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalFound}</p>
          <p className="text-xs text-zinc-500">relevant launches tracked</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <span className="text-xs text-zinc-500">Avg Relevance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {historyStats?.avgRelevance ?? "—"}
          </p>
          <p className="text-xs text-zinc-500">across all launches</p>
        </div>
      </div>

      {/* Platform Distribution */}
      {historyStats && historyStats.byPlatform && (
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(historyStats.byPlatform).map(([platform, count]) => (
            <div
              key={platform}
              className={`px-3 py-1.5 rounded-lg ${platformBadge(platform)}`}
            >
              <span className="text-sm font-medium">
                {platformLabel(platform)}
              </span>
              <span className="text-xs ml-1 opacity-70">({count})</span>
            </div>
          ))}
          {data.scannedAt && (
            <div className="text-zinc-600 text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Updated {new Date(data.scannedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search launches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 w-48"
        />
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
          className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          <option value="all">All Platforms</option>
          <option value="producthunt">Product Hunt</option>
          <option value="hackernews">Hacker News</option>
        </select>
      </div>

      {/* Launches Table */}
      {filtered.length === 0 ? (
        <EmptyState
          presetIcon="trending"
          title="No launches match your filters"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40">
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300"
                  onClick={() => handleSort("name")}
                >
                  Launch {sortArrow("name")}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-24"
                  onClick={() => handleSort("relevance")}
                >
                  Relevance {sortArrow("relevance")}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-28"
                  onClick={() => handleSort("platform")}
                >
                  Platform {sortArrow("platform")}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-32"
                  onClick={() => handleSort("date")}
                >
                  Date {sortArrow("date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((launch) => (
                <tr
                  key={`${launch.name}-${launch.date}`}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      {launch.url ? (
                        <a
                          href={launch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-violet-400 transition-colors inline-flex items-center gap-1"
                        >
                          {launch.name}
                          <ExternalLink
                            className="h-3 w-3 opacity-40"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <span className="text-white font-medium">
                          {launch.name}
                        </span>
                      )}
                      {launch.tagline && launch.tagline !== launch.name && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">
                          {launch.tagline}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${relevanceBg(launch.relevance)} ${relevanceColor(launch.relevance)}`}
                    >
                      {launch.relevance}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${platformBadge(launch.platform)}`}
                    >
                      {platformLabel(launch.platform)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400">
                      {daysAgo(launch.date)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* How it works */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h3 className="text-sm font-semibold text-white mb-3">
          How This Works
        </h3>
        <div className="space-y-2 text-xs text-zinc-500">
          <p>
            • Scans Product Hunt and Hacker News for launches in your category.
          </p>
          <p>
            • Relevance scores are calculated based on keyword matching with
            your ICP and problem area.
          </p>
          <p>
            • Data refreshes when you run{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1 rounded">
              loopkit radar
            </code>{" "}
            — cached for 24 hours.
          </p>
          <p>
            • Use this to stay aware of what competitors are shipping so you can
            build different.
          </p>
        </div>
      </div>
    </div>
  );
}
