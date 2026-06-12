export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

// LoopKit is a CLI company. The site is mono-everything.
// JetBrains Mono is the only typeface — used for body, code,
// and headings. This is intentional and is the brand.
const jetbrains = JetBrains_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "loopkit — a CLI for solo founders who keep quitting at week 4",
  description:
    "Five commands. One weekly loop. Run init, then close loop every Sunday for 6 weeks. Free for the basics.",
  keywords: [
    "solo founder",
    "shipping",
    "CLI",
    "build in public",
    "indie hacker",
    "weekly loop",
  ],
  openGraph: {
    title: "loopkit — a CLI for solo founders who keep quitting at week 4",
    description: "Five commands. One weekly loop. Free for the basics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        jetbrains.variable,
        "font-sans",
        "dark", // Marketing site is intentionally dark-only; the dashboard
                // sidebar toggle only affects /dashboard/* sub-routes
                // because the dashboard layout sets its own theme.
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:text-sm"
        >
          Skip to content
        </a>
        {/* ─── Nav ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-zinc-900 bg-background">
          <nav
            className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-100 hover:text-white"
              aria-label="LoopKit home"
            >
              <RefreshCw className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>loopkit</span>
            </Link>

            {/* Right links — minimal, terminal-style */}
            <div className="flex items-center gap-5 text-sm text-zinc-500">
              <Link
                href="/docs"
                className="hover:text-zinc-200"
              >
                docs
              </Link>
              <a
                href="https://github.com/loopkit/loopkit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-200"
              >
                github
              </a>
              <Link
                href="/login"
                id="nav-sign-in"
                className="hover:text-zinc-200"
              >
                sign in
              </Link>
            </div>
          </nav>
        </header>

        <ConvexClientProvider>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
