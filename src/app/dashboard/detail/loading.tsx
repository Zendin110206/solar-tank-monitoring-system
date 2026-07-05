import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function TechnicalDetailLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat analisis"
      title="Menyiapkan analisis teknis"
      description="Sistem sedang membaca data teknis, peta monitoring, dan riwayat perangkat."
    />
  );
}
