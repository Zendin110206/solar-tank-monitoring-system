import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function DeviceRequestLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat form"
      title="Menyiapkan pengajuan perangkat"
      description="Sistem sedang menyiapkan profil sensor, tipe tangki, dan validasi pengajuan."
    />
  );
}
