"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox, BarChart3, Hash, TrendingUp, History } from "lucide-react";

type EmptyIcon = "inbox" | "chart" | "keywords" | "trending" | "loop" | "none";

interface EmptyStateProps {
  icon?: ReactNode;
  presetIcon?: EmptyIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const presetIcons: Record<Exclude<EmptyIcon, "none">, ReactNode> = {
  inbox: <Inbox className="h-8 w-8" />,
  chart: <BarChart3 className="h-8 w-8" />,
  keywords: <Hash className="h-8 w-8" />,
  trending: <TrendingUp className="h-8 w-8" />,
  loop: <History className="h-8 w-8" />,
};

export function EmptyState({
  icon,
  presetIcon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const displayIcon =
    icon ??
    (presetIcon && presetIcon !== "none" ? presetIcons[presetIcon] : null);

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center",
        className,
      )}
    >
      {displayIcon && (
        <div className="flex justify-center mb-3 text-zinc-600">
          {displayIcon}
        </div>
      )}
      <p className="text-sm text-zinc-400">{title}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
