"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  Flame,
  Activity,
  Award,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export default function AdvisorSharePage({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>;
}) {
  const params = use(paramsPromise);
  const token = params.token;

  const data = useQuery(api.projects.getSharedProject, { shareToken: token });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Advisor Dashboard...</span>
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Not Found</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          This share link is invalid, expired, or has been marked private by the project owner.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Go to LoopKit Home
        </Link>
      </div>
    );
  }

  const { project, loopLogs, user } = data;
  const latestLog = loopLogs[0];
  const activeStreak = loopLogs.length > 0 ? getStreak(loopLogs) : 0;
  const totalShipped = loopLogs.filter(log => log.shippingScore > 0).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 pb-20">
      {/* Header Banner */}
      <header className="border-b border-zinc-900 bg-zinc-900/10 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-lg">
              LK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{project.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 font-mono uppercase">
                  Advisor View
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {user?.name ? `Owner: ${user.name}` : "Project Progress & Metrics"}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium rounded-xl transition-colors"
          >
            Powered by LoopKit
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10 space-y-10">
        {/* Project info card */}
        {project.description && (
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/20">
            <h2 className="text-xs uppercase font-mono tracking-widest text-zinc-500 mb-2">Project Vision</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* High-level metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Current Streak</p>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <Flame className="h-6 w-6 text-amber-500" />
              {activeStreak} <span className="text-xs text-zinc-500 font-normal font-sans">weeks</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Weeks Shipped</p>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-violet-400" />
              {totalShipped} <span className="text-xs text-zinc-500 font-normal font-sans">weeks</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Latest Loop Score</p>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              {latestLog ? latestLog.shippingScore : 0}
              <span className="text-xs text-zinc-500 font-normal font-sans">/100</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Latest Tasks</p>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-cyan-400" />
              {latestLog ? `${latestLog.tasksCompleted}/${latestLog.tasksTotal}` : "0/0"}
            </div>
          </div>
        </section>

        {/* Weekly Logs list */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-400" />
            Weekly Progress Logs
          </h2>

          {loopLogs.length === 0 ? (
            <div className="p-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 text-center text-zinc-500 text-sm">
              No weekly loops closed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {loopLogs.map((log) => (
                <div key={log._id} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/30 transition-colors space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white font-mono">
                        Week {log.weekNumber}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {log.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 mr-1.5 font-mono">Tasks:</span>
                        <span className="text-white font-medium">{log.tasksCompleted} / {log.tasksTotal}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 mr-1.5 font-mono">Score:</span>
                        <span className={`font-bold ${log.shippingScore >= 70 ? 'text-emerald-400' : log.shippingScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {log.shippingScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {log.synthesis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">
                            The One Thing
                          </p>
                          <div className="text-sm text-white font-medium flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{log.synthesis.oneThing}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">
                            Rationale
                          </p>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {log.synthesis.rationale}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {log.synthesis.weekWin && (
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">
                              Week Win
                            </p>
                            <p className="text-xs text-emerald-400 font-medium">
                              🏆 {log.synthesis.weekWin}
                            </p>
                          </div>
                        )}
                        {log.synthesis.tension && (
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">
                              Tension / Risk
                            </p>
                            <p className="text-xs text-red-400 font-medium">
                              ⚠️ {log.synthesis.tension}
                            </p>
                          </div>
                        )}
                        {log.synthesis.founderNote && (
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">
                              Founder Note
                            </p>
                            <p className="text-xs text-zinc-400 italic">
                              &ldquo;{log.synthesis.founderNote}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function getStreak(logs: Array<{ weekNumber: number }>): number {
  let streak = 0;
  let prevWeek: number | null = null;
  const sorted = [...logs].sort((a, b) => b.weekNumber - a.weekNumber);

  for (const log of sorted) {
    if (prevWeek === null) {
      streak = 1;
      prevWeek = log.weekNumber;
    } else if (log.weekNumber === prevWeek - 1) {
      streak++;
      prevWeek = log.weekNumber;
    } else {
      break;
    }
  }

  return streak;
}
