"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function SparkLine({
  data,
  color = "var(--chart-1)",
  height = 30,
  className,
}: SparkLineProps) {
  if (data.length < 2) return null;

  const chartData = data.map((value, index) => ({ v: value, i: index }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <div className={cn("w-20 inline-block align-middle", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
        >
          <defs>
            <linearGradient
              id={`spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
            dot={false}
            isAnimationActive={data.length > 7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
