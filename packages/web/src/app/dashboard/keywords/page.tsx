"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/empty-state";

type SortKey = "score" | "keyword" | "volume" | "competition";
type SortDir = "asc" | "desc";
type VolumeFilter = "all" | "high" | "medium" | "low";
type CompetitionFilter = "all" | "low" | "medium" | "high";

interface KeywordRow {
  keyword: string;
  score: number;
  volume: string;
  competition: string;
  sources: string[];
  suggestions: string[];
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-500";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-zinc-800/50 border-zinc-700";
}

function volumeBadge(volume: string): string {
  switch (volume) {
    case "high":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border border-zinc-700";
  }
}

function competitionBadge(competition: string): string {
  switch (competition) {
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    default:
      return "bg-red-500/10 text-red-400 border border-red-500/20";
  }
}

function exportCSV(keywords: KeywordRow[], category: string) {
  const header = "Keyword,Score,Volume,Competition,Sources,Suggestions\n";
  const rows = keywords
    .map((k) =>
      [
        `"${k.keyword}"`,
        k.score,
        k.volume,
        k.competition,
        `"${k.sources.join("; ")}"`,
        `"${k.suggestions.join("; ")}"`,
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `loopkit-keywords-${category.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function KeywordsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>("all");
  const [competitionFilter, setCompetitionFilter] =
    useState<CompetitionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("general");

  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const data = useQuery(
    api.keywords.getKeywords,
    activeProject ? { category: activeProject.name.toLowerCase() } : "skip",
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.keywords as KeywordRow[];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.keyword.toLowerCase().includes(q) ||
          r.suggestions.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (volumeFilter !== "all") {
      rows = rows.filter((r) => r.volume === volumeFilter);
    }

    if (competitionFilter !== "all") {
      rows = rows.filter((r) => r.competition === competitionFilter);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "keyword":
          cmp = a.keyword.localeCompare(b.keyword);
          break;
        case "score":
          cmp = a.score - b.score;
          break;
        case "volume": {
          const order = { high: 3, medium: 2, low: 1 };
          cmp =
            (order[a.volume as keyof typeof order] || 0) -
            (order[b.volume as keyof typeof order] || 0);
          break;
        }
        case "competition": {
          const order = { low: 1, medium: 2, high: 3 };
          cmp =
            (order[a.competition as keyof typeof order] || 0) -
            (order[b.competition as keyof typeof order] || 0);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [data, searchQuery, volumeFilter, competitionFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "keyword" ? "asc" : "desc");
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (
    <div className="space-y-6 fade-up">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-title text-white mb-2">Keyword Opportunities</h1>
          <p className="text-zinc-400 text-sm">
            Content ideas for your niche. Scored by search interest vs
            competition.
          </p>
        </div>
        {data && data.keywords.length > 0 && (
          <button
            onClick={() => exportCSV(filtered as KeywordRow[], data.category)}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer border border-zinc-700"
          >
            Export CSV
          </button>
        )}
      </header>

      {!data ? (
        <EmptyState
          presetIcon="keywords"
          title="Loading keywords"
          description="Scanning for opportunities..."
          className="animate-pulse"
        />
      ) : data.keywords.length === 0 ? (
        <EmptyState
          presetIcon="keywords"
          title="No keyword data yet"
          description="Run loopkit keywords in your CLI to scan for opportunities."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          presetIcon="keywords"
          title="No keywords match your filters"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="text-violet-400 text-sm font-medium">
                {data.totalFound} keywords
              </span>
              <span className="text-zinc-500 text-xs ml-1">found</span>
            </div>
            {data.lastScanned && (
              <div className="text-zinc-600 text-xs">
                Scanned {new Date(data.lastScanned).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 w-48"
            />
            <select
              value={volumeFilter}
              onChange={(e) => setVolumeFilter(e.target.value as VolumeFilter)}
              className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Volume</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={competitionFilter}
              onChange={(e) =>
                setCompetitionFilter(e.target.value as CompetitionFilter)
              }
              className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Competition</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort("keyword")}
                  >
                    Keyword {sortArrow("keyword")}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-24"
                    onClick={() => handleSort("score")}
                  >
                    Score {sortArrow("score")}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-28"
                    onClick={() => handleSort("volume")}
                  >
                    Volume {sortArrow("volume")}
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 w-32"
                    onClick={() => handleSort("competition")}
                  >
                    Competition {sortArrow("competition")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Sources
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.keyword}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-zinc-500 font-mono">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">
                        {row.keyword}
                      </span>
                      {row.suggestions.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">
                          {row.suggestions.slice(0, 2).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${scoreBg(row.score)} ${scoreColor(row.score)}`}
                      >
                        {row.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${volumeBadge(row.volume)}`}
                      >
                        {row.volume}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${competitionBadge(row.competition)}`}
                      >
                        {row.competition}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {row.sources.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs"
                          >
                            {s.replace("-", " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
