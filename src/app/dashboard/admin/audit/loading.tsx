import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function AuditLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat audit"
      title="Menyiapkan catatan keamanan"
      description="Sistem sedang membaca riwayat audit dan aktivitas keamanan terbaru."
    />
  );
}
