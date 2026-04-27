import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  className?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  unit,
  description,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-2xl border border-border bg-card/30",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">
          {icon}
        </span>
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-foreground">
        {value}
        {unit && (
          <span className="text-sm text-muted-foreground font-normal ml-1">
            {unit}
          </span>
        )}
      </div>
      {description && (
        <div className="mt-2 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
