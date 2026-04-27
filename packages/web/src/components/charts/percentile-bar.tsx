"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface PercentileBarProps {
  value: number;
  max?: number;
  colorFrom?: string;
  colorTo?: string;
  height?: number;
  label?: string;
  className?: string;
}

export function PercentileBar({
  value,
  max = 100,
  colorFrom = "#8b5cf6",
  colorTo = "#06b6d4",
  height = 8,
  label,
  className,
}: PercentileBarProps) {
  const percent = Math.min(Math.max(value / max, 0), 1);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium text-foreground">{value}</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `Progress ${value} of ${max}`}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percent * 100}%`,
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          }}
        />
      </div>
    </div>
  );
}

interface HorizontalBarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  className?: string;
}

export function HorizontalBarChart({
  data,
  height = 24,
  className,
}: HorizontalBarChartProps) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color || "#8b5cf6",
  }));

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer
        width="100%"
        height={chartData.length * (height + 8)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fafafa",
            }}
            cursor={false}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={height - 8}
            isAnimationActive
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
