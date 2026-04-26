"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const navLinks = [
  { name: "Overview", href: "/dashboard", icon: "⟳" },
  { name: "Pulse Inbox", href: "/dashboard/pulse", icon: "●" },
  { name: "Loop History", href: "/dashboard/loop", icon: "↻" },
  { name: "Benchmarks", href: "/dashboard/benchmarks", icon: "◈" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Workspace
          </h2>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px] ${
                  isActive
                    ? "bg-zinc-800/50 text-white font-medium"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span className={isActive ? "text-violet-400" : "text-zinc-500"}>
                  {link.icon}
                </span>
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 sm:p-6 border-t border-zinc-900 space-y-4">
        {user?.tier === "free" && (
          <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/10">
            <h3 className="text-sm font-semibold text-white mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-zinc-400 mb-3">Unlock AI synthesis and team pulse features.</p>
            <button className="w-full py-2.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer min-h-[44px]">
              View Plans
            </button>
          </div>
        )}
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer min-h-[44px]"
        >
          <span className="text-zinc-500">➜</span>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-[#0c0c0f] flex-col hidden sm:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full border-r border-zinc-900 bg-[#0c0c0f] flex flex-col z-50 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#09090b]">
        {/* Mobile top bar */}
        <div className="sm:hidden border-b border-zinc-900 p-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>

          <nav className="flex gap-1.5 overflow-x-auto flex-1 scrollbar-none">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-full text-xs whitespace-nowrap transition-colors min-h-[36px] flex items-center ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
