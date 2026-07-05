import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function LocationsLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat lokasi"
      title="Menyiapkan lokasi perangkat"
      description="Sistem sedang membaca data STO, perangkat, dan konfigurasi tangki."
    />
  );
}
