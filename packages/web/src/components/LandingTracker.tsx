"use client";

/**
 * Landing-page telemetry hooks.
 *
 * Mounts once on the landing page to record:
 *   - landing.view (on mount, deduped per session)
 *   - landing.cta_click (delegated; data-cta="..." attribute on Link/button)
 *
 * Dedup uses sessionStorage so a refresh doesn't double-count as a
 * new "view" — but a new browser session (or new tab) does count.
 */
import { useEffect } from "react";
import { track } from "@/lib/track";

const SESSION_KEY = "loopkit:landing_viewed";

export function LandingTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage blocked — track anyway, don't error
    }
    track("landing.view");

    // Delegate click tracking
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("[data-cta]");
      if (!target) return;
      const cta = target.getAttribute("data-cta");
      if (cta) track("landing.cta_click", { cta });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
