import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function SummaryLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat monitoring"
      title="Menyiapkan ringkasan tangki"
      description="Sistem sedang membaca data monitoring terbaru untuk seluruh STO."
    />
  );
}
