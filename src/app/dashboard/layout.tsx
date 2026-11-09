import type { ReactNode } from "react";

import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentSessionUser } from "@/features/auth/server/auth-session";

// Satu kerangka (sidebar + header) untuk semua halaman dashboard. Pengaman
// akses tetap ada di setiap halaman; bila sesi tidak ada, halaman itu sendiri
// yang mengalihkan pengunjung, jadi kerangka tidak dirender.
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentSessionUser().catch(() => null);

  if (!user) {
    return (
      <>
        {children}
        <DashboardFooter />
      </>
    );
  }

  return (
    <DashboardShell
      footer={<DashboardFooter />}
      user={{
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        telegramVerifiedAt: user.telegramVerifiedAt,
        username: user.username,
      }}
    >
      {children}
    </DashboardShell>
  );
}
