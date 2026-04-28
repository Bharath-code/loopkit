"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { HorizontalBarChart } from "@/components/charts";
import { TrendIcon } from "@/components/trend-icon";
import { EmptyState } from "@/components/empty-state";

interface TrendItem {
  category: string;
  count: number;
  count7d: number;
  count30d: number;
}

function TrendRow({
  item,
  rank,
  color,
}: {
  item: TrendItem;
  rank: number;
  color: string;
}) {
  return (
    <div className="py-2 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-5 text-center text-xs text-zinc-500 font-mono">
            {rank}
          </span>
          <span className="text-sm text-white font-medium capitalize">
            {item.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400">{item.count} total</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            {item.count30d}/mo
          </span>
          <TrendIcon
            trend={
              item.count7d >= 3 ? "up" : item.count7d >= 1 ? "flat" : "down"
            }
            className="text-xs"
          />
        </div>
      </div>
      <div className="ml-7">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((item.count / Math.max(item.count, 1)) * 100, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const trending = useQuery(api.analytics.getTrendingValidations, {});

  const maxIcpCount = trending?.icp?.[0]?.count ?? 0;
  const maxProblemCount = trending?.problem?.[0]?.count ?? 0;
  const maxMvpCount = trending?.mvp?.[0]?.count ?? 0;

  return (
    <div className="space-y-8 fade-up">
      <header>
        <h1 className="text-title text-white mb-2">Trending Validations</h1>
        <p className="text-zinc-400 text-sm">
          What ICPs and problems LoopKit founders are pursuing right now.
          Proprietary data no one else has.
        </p>
      </header>

      {!trending || trending.totalFounders === 0 ? (
        <EmptyState
          presetIcon="trending"
          title="Not enough data yet"
          description="Trending validations appear once founders opt into telemetry and complete loopkit init."
          action={
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 mt-2">
              <span>
                1. Run <code className="text-zinc-400">loopkit init</code>
              </span>
              <span>·</span>
              <span>2. Opt into telemetry</span>
              <span>·</span>
              <span>3. See trends here</span>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="text-violet-400 text-sm font-medium">
                {trending.totalFounders} founders
              </span>
              <span className="text-zinc-500 text-xs ml-1">opted in</span>
            </div>
            <div className="text-zinc-600 text-xs">
              Updated {new Date(trending.lastUpdated).toLocaleDateString()}
            </div>
            {trending.hasMore && (
              <div className="text-zinc-600 text-xs">More data available</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ICP Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                Top ICPs
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Who founders are building for
              </p>

              {trending.icp.length > 0 ? (
                <HorizontalBarChart
                  data={trending.icp.slice(0, 8).map((item) => ({
                    name:
                      item.category.length > 14
                        ? item.category.slice(0, 12) + "…"
                        : item.category,
                    value: item.count,
                    color: "#8b5cf6",
                  }))}
                  height={24}
                />
              ) : (
                <p className="text-xs text-zinc-600 py-4 text-center">
                  No data yet
                </p>
              )}

              <div className="space-y-0.5 mt-3">
                {trending.icp.slice(0, 5).map((item, i) => (
                  <TrendRow
                    key={item.category}
                    item={item}
                    rank={i + 1}
                    color="#8b5cf6"
                  />
                ))}
              </div>
            </div>

            {/* Problem Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Top Problems
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                What pain points are being validated
              </p>

              {trending.problem.length > 0 ? (
                <HorizontalBarChart
                  data={trending.problem.slice(0, 8).map((item) => ({
                    name:
                      item.category.length > 14
                        ? item.category.slice(0, 12) + "…"
                        : item.category,
                    value: item.count,
                    color: "#06b6d4",
                  }))}
                  height={24}
                />
              ) : (
                <p className="text-xs text-zinc-600 py-4 text-center">
                  No data yet
                </p>
              )}

              <div className="space-y-0.5 mt-3">
                {trending.problem.slice(0, 5).map((item, i) => (
                  <TrendRow
                    key={item.category}
                    item={item}
                    rank={i + 1}
                    color="#06b6d4"
                  />
                ))}
              </div>
            </div>

            {/* MVP Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Top MVP Types
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                What kinds of products are being built
              </p>

              {trending.mvp.length > 0 ? (
                <HorizontalBarChart
                  data={trending.mvp.slice(0, 8).map((item) => ({
                    name:
                      item.category.length > 14
                        ? item.category.slice(0, 12) + "…"
                        : item.category,
                    value: item.count,
                    color: "#10b981",
                  }))}
                  height={24}
                />
              ) : (
                <p className="text-xs text-zinc-600 py-4 text-center">
                  No data yet
                </p>
              )}

              <div className="space-y-0.5 mt-3">
                {trending.mvp.slice(0, 5).map((item, i) => (
                  <TrendRow
                    key={item.category}
                    item={item}
                    rank={i + 1}
                    color="#10b981"
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
