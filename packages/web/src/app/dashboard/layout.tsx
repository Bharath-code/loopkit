export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
