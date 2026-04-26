"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardOverviewPage() {
  const user = useQuery(api.users.me);
  const isFreeTier = user?.tier === "free";
  return (
    <div className="space-y-8 fade-up">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            Project Overview
            {isFreeTier && (
              <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 font-medium border border-zinc-700">
                Read-Only Mode
              </span>
            )}
          </h1>
          <p className="text-zinc-400 text-sm">
            Welcome back. Here&apos;s what&apos;s happening across your projects.
          </p>
        </div>
        
        {isFreeTier && (
          <button className="hidden sm:block px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
            Upgrade for full access
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">✓</span>
            <span className="text-sm text-zinc-400 font-medium">Tasks Completed</span>
          </div>
          <div className="text-3xl font-bold text-white">24</div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <span>↑</span> 12% this week
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm">▲</span>
            <span className="text-sm text-zinc-400 font-medium">Shipping Score</span>
          </div>
          <div className="text-3xl font-bold text-white">82<span className="text-sm text-zinc-500">/100</span></div>
          <div className="mt-2 text-xs text-zinc-500">
            Based on completed vs planned tasks
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm">●</span>
            <span className="text-sm text-zinc-400 font-medium">Pulse Responses</span>
          </div>
          <div className="text-3xl font-bold text-white">8</div>
          <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
            <span>3 new</span> requiring attention
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20">
          <h2 className="text-base font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                  {i === 1 ? '▲' : i === 2 ? '✓' : '●'}
                </div>
                <div>
                  <p className="text-sm text-zinc-300">
                    {i === 1 ? 'Shipped new landing page copy' : i === 2 ? 'Closed task #45 from CLI' : 'New pulse response received'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{i * 2} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Loop Synthesis Highlight */}
        <div className="p-6 rounded-2xl border border-violet-500/20 bg-[#0c0c0f] relative overflow-hidden glow-violet">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-cyan-500"></div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Last Sunday&apos;s Loop</h2>
            <span className="px-2 py-1 rounded text-xs bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20">Week 16</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">The One Thing</p>
              <p className="text-sm text-white font-medium bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                Fix the onboarding conversion drop-off by removing the mandatory phone number field.
              </p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Build in Public Draft</p>
              <p className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                &quot;Noticed a 40% drop-off in our onboarding flow. This week we&apos;re killing the mandatory phone number field. Friction is the enemy of growth. #buildinpublic&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
