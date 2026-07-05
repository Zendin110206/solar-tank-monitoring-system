import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function TankAdminDetailLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat detail"
      title="Menyiapkan detail tangki"
      description="Sistem sedang membaca pembacaan terakhir, riwayat volume, dan parameter tangki."
    />
  );
}
