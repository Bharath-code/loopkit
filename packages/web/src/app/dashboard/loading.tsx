/**
 * Loading UI for the dashboard root.
 *
 * Next.js wraps the page below this in a <Suspense> boundary, so
 * the skeleton shows during the initial server-rendered fetch and
 * any time a nested segment suspends. Uses the shared Skeleton*
 * components so the loading state visually matches real content.
 */
import { SkeletonMetric, SkeletonCard } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl fade-up">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-zinc-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-zinc-800/60 animate-pulse" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard lines={5} titleWidth="w-48" />
        </div>
        <SkeletonCard lines={4} titleWidth="w-32" />
      </div>
    </div>
  );
}
