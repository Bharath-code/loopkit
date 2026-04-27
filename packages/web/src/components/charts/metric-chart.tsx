"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface MetricChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  fillFrom?: string;
  fillTo?: string;
  label?: string;
  height?: number;
  className?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  yKey,
  labelPrefix,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  yKey: string;
  labelPrefix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      {labelPrefix && (
        <p className="text-zinc-400 mb-1">
          {labelPrefix} {label}
        </p>
      )}
      <p className="text-white font-medium">
        {payload[0].value}{" "}
        {yKey === "shippingScore"
          ? "/ 100"
          : yKey === "tasksCompleted"
            ? "tasks"
            : ""}
      </p>
    </div>
  );
}

export function MetricChart({
  data,
  xKey,
  yKey,
  color = "var(--chart-1)",
  fillFrom,
  fillTo,
  label,
  height = 200,
  className,
}: MetricChartProps) {
  const gradientId = `metric-${yKey}-${xKey}`.replace(/[^a-zA-Z0-9]/g, "");
  const strokeColor = color.startsWith("var(") ? "#8b5cf6" : color;
  const fromColor = fillFrom || strokeColor;
  const toColor = fillTo || "transparent";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="text-xs text-muted-foreground font-medium mb-3">
          {label}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fromColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={toColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 5", "dataMax + 10"]}
          />
          <Tooltip content={<ChartTooltip yKey={yKey} labelPrefix={label} />} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ fill: strokeColor, r: 3, strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: strokeColor,
              stroke: "#18181b",
              strokeWidth: 2,
            }}
            isAnimationActive={data.length > 3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
