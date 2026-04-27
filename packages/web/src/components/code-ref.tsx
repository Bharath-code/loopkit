import { cn } from "@/lib/utils";

interface CodeRefProps {
  children: string;
  className?: string;
}

export function CodeRef({ children, className }: CodeRefProps) {
  return (
    <code
      className={cn(
        "font-mono text-sm text-primary bg-muted/50 px-1.5 py-0.5 rounded",
        className,
      )}
    >
      {children}
    </code>
  );
}
