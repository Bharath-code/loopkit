"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function createConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) {
    throw new Error(
      "Missing Convex URL. Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL in your environment."
    );
  }
  return new ConvexReactClient(url);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => createConvexClient(), []);

  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
