"use client";

import type { SimulatorState } from "../terminal/state";

interface Props {
  state: SimulatorState;
}

export function ArchitectureTab({ state }: Props) {
  const hasProject = !!state.project;
  const hasTasks = state.tasks.length > 0;
  const hasShips = state.ships.length > 0;

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-sm font-semibold text-white mb-4">
        System Architecture
      </h3>

      <svg
        viewBox="0 0 400 320"
        className="w-full"
        style={{ maxHeight: "280px" }}
      >
        {/* CLI Box */}
        <g>
          <rect
            x="20"
            y="20"
            width="100"
            height="60"
            rx="8"
            fill="#27272a"
            stroke={hasProject ? "#8b5cf6" : "#3f3f46"}
            strokeWidth="2"
          />
          <text
            x="70"
            y="48"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="12"
            fontWeight="600"
          >
            CLI
          </text>
          <text x="70" y="65" textAnchor="middle" fill="#a1a1aa" fontSize="9">
            Node.js
          </text>
        </g>

        {/* Arrow to AI */}
        {hasProject && (
          <g className="data-flow-particle">
            <path
              d="M130 50 L170 50"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="4 2"
              markerEnd="url(#arrow-purple)"
            />
          </g>
        )}

        {/* AI Client Box */}
        <g>
          <rect
            x="180"
            y="20"
            width="100"
            height="60"
            rx="8"
            fill="#27272a"
            stroke={hasProject ? "#22d3ee" : "#3f3f46"}
            strokeWidth="2"
          />
          <text
            x="230"
            y="48"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="12"
            fontWeight="600"
          >
            AI Client
          </text>
          <text x="230" y="65" textAnchor="middle" fill="#a1a1aa" fontSize="9">
            Claude API
          </text>
        </g>

        {/* Arrow to Storage */}
        <g>
          <path
            d="M70 90 L70 130"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <polygon points="65,120 70,130 75,120" fill="#a1a1aa" />
        </g>

        {/* Local Storage Box */}
        <g>
          <rect
            x="20"
            y="140"
            width="100"
            height="50"
            rx="8"
            fill="#27272a"
            stroke={hasProject ? "#10b981" : "#3f3f46"}
            strokeWidth="2"
          />
          <text
            x="70"
            y="162"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="11"
            fontWeight="600"
          >
            .loopkit/
          </text>
          <text x="70" y="178" textAnchor="middle" fill="#a1a1aa" fontSize="9">
            Local Files
          </text>
        </g>

        {/* Arrow to Convex */}
        <g>
          <path
            d="M130 165 L180 165"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <polygon points="175,160 185,165 175,170" fill="#a1a1aa" />
        </g>

        {/* Sync Layer Box */}
        <g>
          <rect
            x="190"
            y="140"
            width="90"
            height="50"
            rx="8"
            fill="#27272a"
            stroke={hasShips ? "#fbbf24" : "#3f3f46"}
            strokeWidth="2"
          />
          <text
            x="235"
            y="162"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="11"
            fontWeight="600"
          >
            Sync Layer
          </text>
          <text x="235" y="178" textAnchor="middle" fill="#a1a1aa" fontSize="9">
            API Routes
          </text>
        </g>

        {/* Arrow to Convex Backend */}
        <g>
          <path
            d="M290 165 L330 165"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <polygon points="325,160 335,165 325,170" fill="#a1a1aa" />
        </g>

        {/* Convex Backend Box */}
        <g>
          <rect
            x="340"
            y="140"
            width="50"
            height="50"
            rx="8"
            fill="#27272a"
            stroke={hasShips ? "#06b6d4" : "#3f3f46"}
            strokeWidth="2"
          />
          <text
            x="365"
            y="162"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="10"
            fontWeight="600"
          >
            Convex
          </text>
          <text x="365" y="178" textAnchor="middle" fill="#a1a1aa" fontSize="8">
            Backend
          </text>
        </g>

        {/* Arrow to Web Dashboard */}
        <g>
          <path
            d="M365 200 L365 240"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <polygon points="360,235 365,245 370,235" fill="#a1a1aa" />
        </g>

        {/* Web Dashboard Box */}
        <g>
          <rect
            x="315"
            y="250"
            width="100"
            height="50"
            rx="8"
            fill="#27272a"
            stroke="#3f3f46"
            strokeWidth="2"
          />
          <text
            x="365"
            y="272"
            textAnchor="middle"
            fill="#fafafa"
            fontSize="11"
            fontWeight="600"
          >
            Dashboard
          </text>
          <text x="365" y="288" textAnchor="middle" fill="#a1a1aa" fontSize="9">
            Next.js
          </text>
        </g>

        {/* Arrow Markers */}
        <defs>
          <marker
            id="arrow-purple"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6" fill="#8b5cf6" />
          </marker>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-violet-600" />
          <span className="text-zinc-400">CLI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-500" />
          <span className="text-zinc-400">AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-zinc-400">Storage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-zinc-400">Sync</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-600" />
          <span className="text-zinc-400">Convex</span>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
        <p className="text-xs text-zinc-400">
          {hasProject ? (
            <>
              Project{" "}
              <span className="text-violet-400">{state.project?.name}</span> is
              active. Commands will read/write to local files.
            </>
          ) : (
            <>
              No project yet. Run{" "}
              <span className="text-violet-400">loopkit init</span> to start.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
