import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function DeviceRequestsLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat pengajuan"
      title="Menyiapkan antrean perangkat"
      description="Sistem sedang membaca pengajuan perangkat dan status provisioning terbaru."
    />
  );
}
