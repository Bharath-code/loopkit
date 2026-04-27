"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface TrendItem {
  category: string;
  count: number;
  count7d: number;
  count30d: number;
}

function TrendArrow({ count7d }: { count7d: number }) {
  if (count7d >= 3) return <span className="text-emerald-400">↑</span>;
  if (count7d >= 1) return <span className="text-amber-400">→</span>;
  return <span className="text-zinc-600">—</span>;
}

function TrendRow({ item, rank }: { item: TrendItem; rank: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-zinc-800/30 transition-colors">
      <span className="w-6 text-center text-sm text-zinc-500 font-mono">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium capitalize truncate">{item.category}</p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-zinc-400">
          {item.count} total
        </span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {item.count30d} this month
        </span>
        <TrendArrow count7d={item.count7d} />
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const trending = useQuery(api.analytics.getTrendingValidations, {});

  return (
    <div className="space-y-8 fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Trending Validations</h1>
        <p className="text-zinc-400 text-sm">
          What ICPs and problems LoopKit founders are pursuing right now. Proprietary data no one else has.
        </p>
      </header>

      {!trending || trending.totalFounders === 0 ? (
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
          <p className="text-zinc-400 text-sm mb-2">Not enough data yet.</p>
          <p className="text-zinc-500 text-xs mb-4">
            Trending validations appear once founders opt into telemetry and complete <code className="text-violet-400">loopkit init</code>.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
            <span>1. Run <code className="text-zinc-500">loopkit init</code></span>
            <span>·</span>
            <span>2. Opt into telemetry</span>
            <span>·</span>
            <span>3. See trends here</span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="text-violet-400 text-sm font-medium">{trending.totalFounders} founders</span>
              <span className="text-zinc-500 text-xs ml-1">opted in</span>
            </div>
            <div className="text-zinc-600 text-xs">
              Updated {new Date(trending.lastUpdated).toLocaleDateString()}
            </div>
            {trending.hasMore && (
              <div className="text-zinc-600 text-xs">
                More data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ICP Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                Top ICPs
              </h2>
              <p className="text-xs text-zinc-500 mb-4">Who founders are building for</p>
              <div className="space-y-1">
                {trending.icp.length > 0 ? (
                  trending.icp.map((item, i) => (
                    <TrendRow key={item.category} item={item} rank={i + 1} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 py-4 text-center">No data yet</p>
                )}
              </div>
            </div>

            {/* Problem Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                Top Problems
              </h2>
              <p className="text-xs text-zinc-500 mb-4">What pain points are being validated</p>
              <div className="space-y-1">
                {trending.problem.length > 0 ? (
                  trending.problem.map((item, i) => (
                    <TrendRow key={item.category} item={item} rank={i + 1} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 py-4 text-center">No data yet</p>
                )}
              </div>
            </div>

            {/* MVP Trends */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Top MVP Types
              </h2>
              <p className="text-xs text-zinc-500 mb-4">What kinds of products are being built</p>
              <div className="space-y-1">
                {trending.mvp.length > 0 ? (
                  trending.mvp.map((item, i) => (
                    <TrendRow key={item.category} item={item} rank={i + 1} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 py-4 text-center">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
