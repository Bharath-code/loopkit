import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIconProps {
  trend: "up" | "down" | "flat";
  className?: string;
}

const trendConfig = {
  up: { Icon: TrendingUp, className: "text-emerald-400" },
  down: { Icon: TrendingDown, className: "text-red-400" },
  flat: { Icon: Minus, className: "text-zinc-500" },
};

export function TrendIcon({ trend, className }: TrendIconProps) {
  const { Icon, className: colorClass } = trendConfig[trend];
  return <Icon className={cn("h-4 w-4", colorClass, className)} />;
}
