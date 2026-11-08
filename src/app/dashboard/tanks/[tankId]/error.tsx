"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-error";

type TankDetailErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function TankDetailError({
  error,
  unstable_retry,
}: TankDetailErrorProps) {
  return (
    <DashboardRouteError
      error={error}
      onRetry={unstable_retry}
      label="Detail tangki belum siap"
      title="Detail tangki belum bisa dibaca"
      description="Halaman detail gagal mengambil data dari storage aktif. Cek endpoint /api/ready dan pastikan database atau mode memory berjalan sesuai konfigurasi. Jika baru mengubah .env.local, hentikan lalu jalankan ulang pnpm dev karena env dibaca saat proses server dimulai."
    />
  );
}
