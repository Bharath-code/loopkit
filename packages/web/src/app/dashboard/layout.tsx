export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./DashboardLayoutClient";

const hasConvexUrl = !!(
  process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  if (!hasConvexUrl) {
    redirect("/login?error=noConvex");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
