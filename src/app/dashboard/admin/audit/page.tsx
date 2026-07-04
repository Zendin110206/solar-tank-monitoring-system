import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { requirePageAdmin } from "@/features/auth/lib/auth-guards";
import { listAuthAuditEvents } from "@/features/auth/lib/mysql-auth-repository";

export const metadata: Metadata = {
  title: "Audit Keamanan | SolarTank",
  description: "Log audit keamanan akun SolarTank untuk administrator.",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "-";
  }

  return JSON.stringify(metadata);
}

export default async function AdminAuditPage() {
  await requirePageAdmin();
  const events = await listAuthAuditEvents();

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
              href="/dashboard/admin/users"
              className="rounded-lg px-3 py-2 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Manajemen Pengguna
            </Link>
            <span className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Audit Keamanan
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ClipboardList className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-zinc-500">
                Audit keamanan
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                Log aktivitas keamanan
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Catatan login, OTP, reset password, perubahan role, aktivasi,
                dan event keamanan akun lain.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr className="bg-zinc-50" key={event.id}>
                    <td className="rounded-l-lg px-3 py-3 text-zinc-600">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-zinc-950">
                      {event.eventType}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {event.actorUserId ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">
                      {event.targetUserId ?? "-"}
                    </td>
                    <td className="rounded-r-lg px-3 py-3 text-zinc-600">
                      <span className="block max-w-xl break-all">
                        {formatMetadata(event.metadata)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
