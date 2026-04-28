"use client";

import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export function FutureRoadmap() {
  const features = [
    {
      phase: "v1",
      label: "v1.0",
      items: [
        "CLI with 12 commands",
        "Local file storage",
        "Basic AI integration",
        "Simulator web interface",
      ],
      done: true,
    },
    {
      phase: "v1.1",
      label: "v1.1",
      items: ["Convex sync", "Web dashboard", "Radar analytics"],
      done: false,
    },
    {
      phase: "v1.2",
      label: "v1.2",
      items: ["Keyword research", "Market timing", "Competitor radar"],
      done: false,
    },
    {
      phase: "v2",
      label: "v2.0",
      items: ["AI coach agent", "Team collaboration", "Plugin system"],
      done: false,
    },
  ];

  return (
    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <h3 className="text-sm font-semibold text-white mb-4">Future Roadmap</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {features.map((f, i) => (
          <div key={f.phase} className="relative">
            {/* Connector */}
            {i < features.length - 1 && (
              <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 z-10" />
            )}

            {/* Card */}
            <div
              className={`p-3 rounded-lg border ${
                f.done
                  ? "bg-emerald-900/20 border-emerald-500/30"
                  : "bg-zinc-800/30 border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-medium ${f.done ? "text-emerald-400" : "text-zinc-400"}`}
                >
                  {f.label}
                </span>
                {f.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-700" />
                )}
              </div>

              <ul className="space-y-1">
                {f.items.map((item) => (
                  <li
                    key={item}
                    className="text-xs text-zinc-500 flex items-center gap-1"
                  >
                    <span
                      className={f.done ? "text-emerald-600" : "text-zinc-700"}
                    >
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span className="text-zinc-500">Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-3 w-3 text-zinc-700" />
          <span className="text-zinc-500">Planned</span>
        </div>
      </div>
    </div>
  );
}
