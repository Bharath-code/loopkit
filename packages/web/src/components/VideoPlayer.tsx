"use client";

/**
 * VideoPlayer — Loom embed with a fallback poster.
 *
 * If `loomId` is set to a real Loom share ID, the component renders
 * a click-to-play thumbnail (Loom's official embed pattern) — it's
 * faster and lighter than auto-loading an iframe, and the user
 * controls the bandwidth cost.
 *
 * If `loomId` is the literal placeholder "LOOM_ID" (the default for
 * un-configured deployments), it renders a styled "Video coming
 * soon" block instead of a broken embed.
 */
import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  loomId: string;
  title: string;
  posterHint?: string;
}

export function VideoPlayer({ loomId, title, posterHint }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const isPlaceholder = !loomId || loomId === "LOOM_ID";
  const embedUrl = `https://www.loom.com/embed/${loomId}?autoplay=1`;

  if (isPlaceholder) {
    return (
      <div className="relative aspect-video rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Play className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="text-zinc-300 text-sm font-medium">{title}</div>
          <div className="text-zinc-600 text-xs max-w-xs mx-auto">
            {posterHint ?? "Video walkthrough will be embedded here."}
          </div>
          <div className="text-zinc-700 text-[10px] font-mono mt-2">
            Set LOOM_ID in <code className="text-zinc-500">src/app/page.tsx</code>
          </div>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="relative aspect-video rounded-2xl border border-zinc-800 overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden text-left transition-colors hover:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      aria-label={`Play ${title}`}
    >
      {/* Placeholder thumbnail — the Loom embed renders its own
          thumbnail once loaded, so we just show a generic gradient. */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-zinc-900 to-cyan-500/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900/80 border border-zinc-700 group-hover:border-violet-400 group-hover:scale-110 transition-all">
            <Play className="h-8 w-8 text-violet-400 ml-1" aria-hidden="true" />
          </div>
          {posterHint && (
            <div className="text-zinc-400 text-sm">{posterHint}</div>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <span className="text-zinc-300 text-xs font-medium">{title}</span>
        <span className="text-zinc-600 text-[10px] font-mono">4 min</span>
      </div>
    </button>
  );
}
