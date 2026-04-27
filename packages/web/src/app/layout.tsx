export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoopKit — The Solo Founder's Shipping OS",
  description:
    "Define · Develop · Deliver · Learn · Repeat. The CLI-first tool that closes every phase of the shipping loop for solo technical founders.",
  keywords: [
    "solo founder",
    "shipping",
    "CLI",
    "build in public",
    "indie hacker",
    "productivity",
  ],
  openGraph: {
    title: "LoopKit — The Solo Founder's Shipping OS",
    description: "One CLI. Five commands. The entire shipping loop closed.",
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
        inter.variable,
        jetbrains.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* ─── Nav ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-zinc-900/80 bg-background/80 backdrop-blur-md">
          <nav
            className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-white hover:opacity-80 transition-opacity"
              aria-label="LoopKit home"
            >
              <span className="text-violet-400 text-lg">⟳</span>
              <span className="tracking-tight">LoopKit</span>
            </Link>

            {/* Center links */}
            <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
              <Link
                href="#how-it-works"
                className="hover:text-white transition-colors"
              >
                How it works
              </Link>
              <Link
                href="#pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <a
                href="https://github.com/loopkit/loopkit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>

            {/* Right CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                id="nav-sign-in"
                className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="#pricing"
                id="nav-get-started"
                className="text-sm px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
              >
                Get started
              </Link>
            </div>
          </nav>
        </header>

        <ConvexClientProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
