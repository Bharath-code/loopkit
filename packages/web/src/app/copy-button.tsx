"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      id="copy-install-cmd"
      onClick={handleCopy}
      className={`ml-2 transition-all duration-200 text-sm ${
        copied
          ? "text-emerald-400"
          : "text-zinc-500 hover:text-zinc-200"
      }`}
      aria-label={copied ? "Copied!" : "Copy install command"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}
