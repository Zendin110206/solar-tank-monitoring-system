"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-error";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function DashboardError({
  error,
  unstable_retry,
}: DashboardErrorProps) {
  return (
    <DashboardRouteError
      error={error}
      onRetry={unstable_retry}
      label="Dashboard belum siap"
      title="Data operasional belum bisa dibaca"
      description="Aplikasi hidup, tetapi dashboard gagal mengambil data dari storage aktif. Cek endpoint /api/ready, konfigurasi MYSQL_DATABASE_URL, status database, dan koneksi jaringan. Jika baru mengubah .env.local, hentikan lalu jalankan ulang pnpm dev karena env dibaca saat proses server dimulai."
    />
  );
}
