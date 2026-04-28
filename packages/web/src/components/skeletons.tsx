function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-800 ${className ?? ""}`}
      {...props}
    />
  );
}

export function SkeletonMetric() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonCard({
  lines = 3,
  titleWidth = "w-40",
}: {
  lines?: number;
  titleWidth?: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <Skeleton className={`h-5 ${titleWidth} mb-4`} />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 rounded ${
              i === 0 ? "w-full" : i === 1 ? "w-3/4" : "w-1/2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonActivity() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonLoopSynthesis() {
  return (
    <div className="p-5 rounded-2xl border border-violet-500/20 bg-sidebar relative overflow-hidden glow-violet">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-cyan-500" />
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="w-16 h-5 rounded" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 rounded" />
      </div>
    </div>
  );
}

export function SkeletonArchetype() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonMarketTiming() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-24 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
