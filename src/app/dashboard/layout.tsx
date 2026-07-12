import type { ReactNode } from "react";

import { DashboardFooter } from "@/components/dashboard/dashboard-footer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DashboardFooter />
    </>
  );
}
