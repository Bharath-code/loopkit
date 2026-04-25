"use client";

export default function LoopHistoryPage() {
  return (
    <div className="space-y-8 fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Loop History</h1>
          <p className="text-zinc-400 text-sm">
            Your weekly synthesis and shipping velocity.
          </p>
        </div>

        {/* Gamification Streak */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 glow-amber cursor-help group relative">
          <span className="text-xl">🔥</span>
          <div>
            <div className="text-sm font-bold text-amber-400">4-Week Streak</div>
            <div className="text-xs text-amber-500/70">Loop closed every Sunday</div>
          </div>
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            You&apos;ve successfully run `loopkit loop` and shipped your synthesis for 4 consecutive weeks.
          </div>
        </div>
      </header>

      {/* Timeline */}
      <div className="relative pl-4 sm:pl-0">
        {/* Vertical line */}
        <div className="absolute left-4 sm:left-[120px] top-2 bottom-0 w-px bg-zinc-800"></div>

        <div className="space-y-12">
          {[
            {
              week: 16,
              date: "April 21, 2026",
              score: 82,
              oneThing: "Fix the onboarding conversion drop-off by removing the mandatory phone number field.",
              tasks: 12,
            },
            {
              week: 15,
              date: "April 14, 2026",
              score: 75,
              oneThing: "Ship the new pricing tier for Teams before marketing push.",
              tasks: 8,
            },
            {
              week: 14,
              date: "April 7, 2026",
              score: 90,
              oneThing: "Rewrite the hero copy to focus on the 'Shipping OS' angle rather than just task management.",
              tasks: 15,
            }
          ].map((loop) => (
            <div key={loop.week} className="relative flex flex-col sm:flex-row gap-6 sm:gap-12 group">
              {/* Timeline marker & Date */}
              <div className="sm:w-[120px] shrink-0 pt-1 flex sm:flex-col items-center sm:items-end sm:text-right gap-4 sm:gap-1 relative z-10">
                <div className="absolute left-[-21px] sm:left-auto sm:-right-[5px] w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-[#09090b] group-hover:scale-125 transition-transform"></div>
                <div className="text-sm font-bold text-white">Week {loop.week}</div>
                <div className="text-xs text-zinc-500">{loop.date}</div>
              </div>

              {/* Content Card */}
              <div className="flex-1 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Shipping Score</span>
                    <span className={`text-sm font-bold ${loop.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{loop.score}/100</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Tasks Done</span>
                    <span className="text-sm font-bold text-white">{loop.tasks}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">The One Thing</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50">
                    {loop.oneThing}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
