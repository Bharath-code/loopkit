"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  const navLinks = [
    { name: "Overview", href: "/dashboard", icon: "⟳" },
    { name: "Pulse Inbox", href: "/dashboard/pulse", icon: "●" },
    { name: "Loop History", href: "/dashboard/loop", icon: "↻" },
  ];

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-[#0c0c0f] flex flex-col hidden sm:flex">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Workspace
            </h2>
          </div>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
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

        <div className="mt-auto p-6 border-t border-zinc-900">
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-zinc-500">➜</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#09090b]">
        {/* Mobile Header (optional if needed) */}
        <div className="sm:hidden border-b border-zinc-900 p-4 flex gap-4 overflow-x-auto">
          {navLinks.map((link) => (
             <Link
             key={link.name}
             href={link.href}
             className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
               pathname === link.href
                 ? "bg-zinc-800 text-white"
                 : "text-zinc-400 border border-zinc-800"
             }`}
           >
             {link.name}
           </Link>
          ))}
        </div>
        
        <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
