import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function TankOperationalDetailLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat detail"
      title="Menyiapkan detail operasional"
      description="Sistem sedang membaca status perangkat, volume, dan tren tangki terbaru."
    />
  );
}
