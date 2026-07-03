import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { requirePageUser } from "@/features/auth/lib/auth-guards";
import { listCurrentUserSessions } from "@/features/auth/lib/auth-service";
import AccountSecurityPanel from "./security-panel";

export const metadata: Metadata = {
  title: "Keamanan Akun | SolarTank",
  description:
    "Pengaturan keamanan akun SolarTank: password, sesi aktif, dan Telegram.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AccountSecurityPage() {
  const user = await requirePageUser();
  const sessions = await listCurrentUserSessions({ user });

  return (
    <main className="min-h-screen bg-[#f5faf8] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-3"
            aria-label="Kembali ke dashboard SolarTank"
          >
            <span className="relative grid size-8 place-items-center">
              <span className="absolute size-8 rounded-full border-2 border-red-500" />
              <span className="absolute right-0 top-1 size-3 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1 left-0 size-2.5 rounded-full bg-zinc-950" />
              <span className="size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-lg font-semibold">SolarTank</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Dashboard
            </Link>
            <span className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Keamanan Akun
            </span>
          </nav>
        </div>
      </header>

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
