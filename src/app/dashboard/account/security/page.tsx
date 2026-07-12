import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requirePageUser } from "@/features/auth/lib/auth-guards";
import { listCurrentUserSessions } from "@/features/auth/lib/auth-service";
import AccountSecurityPanel from "./security-panel";

export const metadata: Metadata = {
  title: "Keamanan Akun | FTM",
  description:
    "Pengaturan keamanan akun FTM: password, sesi aktif, dan Telegram.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AccountSecurityPage() {
  const user = await requirePageUser();
  const sessions = await listCurrentUserSessions({ user });

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <DashboardHeader
        navItems={[{ href: "/dashboard", label: "Manajemen Tangki" }]}
        user={user}
      />

      <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Keamanan akun
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                Password, sesi, dan Telegram
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Kelola akses akun sendiri. Perubahan password akan mencabut
                sesi lain, dan sesi mencurigakan bisa dicabut dari daftar ini.
              </p>
            </div>
          </div>
        </section>

        <AccountSecurityPanel initialSessions={sessions} user={user} />
      </div>
    </main>
  );
}
