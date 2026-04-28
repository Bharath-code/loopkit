"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { TrendIcon } from "@/components/trend-icon";
import { SparkLine } from "@/components/charts";
import {
  Thermometer,
  Flame,
  Snowflake,
  Scale,
  TrendingUp,
  Code,
  Briefcase,
  DollarSign,
  Activity,
  Clock,
} from "lucide-react";

function trendSparkline(trend: string): number[] {
  if (trend === "up") return [20, 25, 22, 30, 28, 35, 42];
  if (trend === "down") return [42, 38, 35, 30, 28, 22, 18];
  return [28, 26, 30, 28, 27, 29, 28];
}

function signalIcon(signal: string) {
  switch (signal) {
    case "heating":
      return <Flame className="h-5 w-5 text-amber-400" aria-hidden="true" />;
    case "cooling":
      return <Snowflake className="h-5 w-5 text-cyan-400" aria-hidden="true" />;
    default:
      return <Scale className="h-5 w-5 text-zinc-400" aria-hidden="true" />;
  }
}

function signalColor(signal: string): string {
  switch (signal) {
    case "heating":
      return "text-amber-400";
    case "cooling":
      return "text-cyan-400";
    default:
      return "text-zinc-400";
  }
}

function signalBg(signal: string): string {
  switch (signal) {
    case "heating":
      return "border-amber-500/20 bg-amber-500/10";
    case "cooling":
      return "border-cyan-500/20 bg-cyan-500/10";
    default:
      return "border-zinc-700 bg-zinc-800/50";
  }
}

function scoreColor(score: number): string {
  if (score >= 65) return "text-amber-400";
  if (score <= 35) return "text-cyan-400";
  return "text-zinc-300";
}

function progressColor(signal: string): string {
  switch (signal) {
    case "heating":
      return "#f59e0b";
    case "cooling":
      return "#06b6d4";
    default:
      return "#71717a";
  }
}

interface SignalData {
  category: string;
  fundingTrend: string;
  fundingCount: number;
  devTrend: string;
  devGrowth: number;
  hiringTrend: string;
  hiringCount: number;
  compositeScore: number;
  signal: string;
  lastUpdated: string;
}

function SignalCard({
  label,
  trend,
  value,
  valueLabel,
  icon: Icon,
  sparkColor,
}: {
  label: string;
  trend: string;
  value: number;
  valueLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  sparkColor: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors metric-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm text-zinc-400 font-medium">{label}</span>
        </div>
        <TrendIcon trend={trend as "up" | "down" | "flat"} />
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-sm text-zinc-500 mb-0.5">{valueLabel}</span>
      </div>
      <div className="mt-2">
        <SparkLine
          data={trendSparkline(trend)}
          color={sparkColor}
          height={24}
        />
      </div>
    </div>
  );
}

export default function TimingPage() {
  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const category = activeProject?.name?.toLowerCase() || "general";

  const signal = useQuery(
    api.marketTiming.getMarketSignal,
    activeProject ? { category } : "skip",
  );

  const history = useQuery(
    api.marketTiming.getMarketSignalHistory,
    activeProject ? { category } : "skip",
  );

  if (!signal) {
    return (
      <div className="space-y-8 fade-up">
        <header>
          <h1 className="text-title text-white mb-2">Market Timing</h1>
          <p className="text-zinc-400 text-sm">
            Is your market heating up or cooling down? Know before you build.
          </p>
        </header>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-zinc-800/50 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-40 bg-zinc-800/50 rounded-2xl" />
            <div className="h-40 bg-zinc-800/50 rounded-2xl" />
            <div className="h-40 bg-zinc-800/50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const typedSignal = signal as SignalData;

  const interpretation =
    typedSignal.signal === "heating"
      ? "Space is heating up. More founders are entering — move fast or narrow your ICP."
      : typedSignal.signal === "cooling"
        ? "Space is cooling down. May be saturated or past peak. Consider adjacent niches."
        : "Market is stable. Good time to enter if you have a differentiated angle.";

  const actionStep =
    typedSignal.signal === "heating"
      ? "Double down on your unique angle. Speed matters when a category is trending."
      : typedSignal.signal === "cooling"
        ? "Look for underserved sub-niches. Cooling markets often hide opportunity."
        : "Focus on building something defensible. Stability means room to grow.";

  return (
    <div className="space-y-6 fade-up">
      <header>
        <h1 className="text-title text-white mb-2">Market Timing</h1>
        <p className="text-zinc-400 text-sm">
          Is your market heating up or cooling down? Know before you build.
        </p>
      </header>

      {/* Signal Hero */}
      <div className={`p-6 rounded-2xl border ${signalBg(typedSignal.signal)}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {signalIcon(typedSignal.signal)}
              <h2 className="text-lg font-semibold text-white">
                {typedSignal.signal.charAt(0).toUpperCase() +
                  typedSignal.signal.slice(1)}{" "}
                Market
              </h2>
              <span
                className={`text-sm font-medium ${signalColor(typedSignal.signal)}`}
              >
                {typedSignal.category}
              </span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">{interpretation}</p>
            <div className="flex items-center gap-2">
              <Thermometer
                className="h-4 w-4 text-zinc-500"
                aria-hidden="true"
              />
              <span className="text-xs text-zinc-500">Recommended action:</span>
              <span className="text-xs text-zinc-300">{actionStep}</span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div
              className={`text-5xl font-bold ${scoreColor(typedSignal.compositeScore)}`}
            >
              {typedSignal.compositeScore}
            </div>
            <div className="text-sm text-zinc-500">/100 composite</div>
            {typedSignal.lastUpdated && (
              <div className="flex items-center gap-1 justify-center sm:justify-end mt-2 text-xs text-zinc-600">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {new Date(typedSignal.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Score Progress Bar */}
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${typedSignal.compositeScore}%`,
              background: `linear-gradient(90deg, ${progressColor(typedSignal.signal)}, ${progressColor(typedSignal.signal)}88)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-cyan-400">Cooling</span>
          <span className="text-xs text-zinc-500">Stable</span>
          <span className="text-xs text-amber-400">Heating</span>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SignalCard
          label="Funding Rounds"
          trend={typedSignal.fundingTrend}
          value={typedSignal.fundingCount}
          valueLabel="rounds detected"
          icon={DollarSign}
          sparkColor="#8b5cf6"
        />
        <SignalCard
          label="Dev Activity"
          trend={typedSignal.devTrend}
          value={typedSignal.devGrowth}
          valueLabel="avg stars/repos"
          icon={Code}
          sparkColor="#06b6d4"
        />
        <SignalCard
          label="Hiring"
          trend={typedSignal.hiringTrend}
          value={typedSignal.hiringCount}
          valueLabel="postings found"
          icon={Briefcase}
          sparkColor="#10b981"
        />
      </div>

      {/* History Chart */}
      {history && history.length > 1 && (
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-400" aria-hidden="true" />
            Score History
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Composite score over time for {typedSignal.category}
          </p>
          <div className="space-y-2">
            {history.map(
              (point: {
                date: string;
                compositeScore: number;
                signal: string;
              }) => (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-20 shrink-0">
                    {new Date(point.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${point.compositeScore}%`,
                        background: `linear-gradient(90deg, ${progressColor(point.signal)}, ${progressColor(point.signal)}88)`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-mono w-8 ${scoreColor(point.compositeScore)}`}
                  >
                    {point.compositeScore}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h3 className="text-sm font-semibold text-white mb-3">
          How to Read This
        </h3>
        <div className="space-y-3 text-xs text-zinc-500">
          <div className="flex items-start gap-3">
            <Flame
              className="h-4 w-4 text-amber-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <span className="text-amber-400 font-medium">Heating (65+)</span>{" "}
              — Category is trending up. More funding, developer activity, and
              hiring. Move fast to capture early ground.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Scale
              className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <span className="text-zinc-300 font-medium">Stable (36-64)</span>{" "}
              — Balanced activity. A good time to enter if you have a
              differentiated angle or unique positioning.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Snowflake
              className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <span className="text-cyan-400 font-medium">Cooling (0-35)</span>{" "}
              — Activity is declining. Might mean saturation, or the wave has
              passed. Consider adjacent niches.
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-4">
          Data refreshes when you run{" "}
          <code className="text-zinc-400 bg-zinc-800 px-1 rounded">
            loopkit timing
          </code>{" "}
          — cached for 7 days.
        </p>
      </div>
    </div>
  );
}
