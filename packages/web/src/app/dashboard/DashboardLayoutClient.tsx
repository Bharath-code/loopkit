"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { api } from "../../../convex/_generated/api";
import { track, TrackProvider } from "@/lib/track";
import {
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  History,
  BarChart3,
  TrendingUp,
  Search,
  Radar,
  Clock,
  X,
  Menu,
  LogOut,
  Settings,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

const navLinks: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { name: "Pulse Inbox", href: "/dashboard/pulse", icon: MessageCircle },
  { name: "Loop History", href: "/dashboard/loop", icon: History },
  { name: "Benchmarks", href: "/dashboard/benchmarks", icon: BarChart3 },
  { name: "Trends", href: "/dashboard/trends", icon: TrendingUp },
  { name: "Radar", href: "/dashboard/radar", icon: Radar },
  { name: "Timing", href: "/dashboard/timing", icon: Clock },
  { name: "Keywords", href: "/dashboard/keywords", icon: Search },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) track("dashboard.view", { path: pathname });
  }, [user, pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
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
              <X className="h-5 w-5" />
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
                <link.icon
                  className={`h-4 w-4 ${isActive ? "text-violet-400" : "text-zinc-500"}`}
                  aria-hidden="true"
                />
                {link.name}
              </Link>
            );
          })}

          {/* Settings — separated at the bottom of the nav */}
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <Link
              key="/dashboard/settings"
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm transition-colors cursor-pointer min-h-[44px] ${
                pathname === "/dashboard/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Settings
                className={`h-4 w-4 ${pathname === "/dashboard/settings" ? "text-violet-400" : ""}`}
                aria-hidden="true"
              />
              Settings
            </Link>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 sm:p-6 border-t border-sidebar-border space-y-4">
        {user?.tier === "free" && (
          <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/10">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Upgrade to Pro
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Unlock AI synthesis and team pulse features.
            </p>
            <button
              className="w-full py-2.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer min-h-[44px]"
              aria-label="Upgrade to Pro"
            >
              View Plans
            </button>
          </div>
        )}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer min-h-[44px]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" aria-hidden="true" />
                Light mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" aria-hidden="true" />
                Dark mode
              </>
            )}
          </button>
        )}
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer min-h-[44px]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
      <TrackProvider />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-sidebar flex-col hidden sm:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full border-r border-zinc-900 bg-sidebar flex flex-col z-50 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-y-auto bg-background">
        {/* Mobile top bar */}
        <div className="sm:hidden border-b border-zinc-900 p-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
                  <link.icon
                    className="h-3.5 w-3.5 mr-1.5"
                    aria-hidden="true"
                  />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
