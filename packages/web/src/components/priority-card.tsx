import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Priority = "critical" | "warning" | "info";

interface PriorityCardProps {
  priority: Priority;
  title: string;
  message: string;
  action?: string;
  command?: string;
  children?: ReactNode;
  className?: string;
}

const priorityStyles: Record<
  Priority,
  { border: string; bg: string; title: string; emoji: string }
> = {
  critical: {
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    title: "text-destructive",
    emoji: "🚨",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    title: "text-amber-400",
    emoji: "⚠️",
  },
  info: {
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    title: "text-cyan-400",
    emoji: "💡",
  },
};

export function PriorityCard({
  priority,
  title,
  message,
  action,
  command,
  children,
  className,
}: PriorityCardProps) {
  const style = priorityStyles[priority];

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border",
        style.border,
        style.bg,
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn("text-base font-semibold", style.title)}>
          {style.emoji} {title}
        </h2>
      </div>
      <p className="text-sm text-foreground font-medium mb-2">{message}</p>
      {children}
      {action && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">→ {action}</p>
          {command && (
            <code className="text-xs text-primary bg-muted/50 px-2 py-1 rounded">
              {command}
            </code>
          )}
        </div>
      )}
    </div>
  );
}
