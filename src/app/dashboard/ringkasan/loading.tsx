import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function SummaryLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat data FTM"
      title="Menyiapkan ringkasan tangki"
      description="Sistem sedang membaca data operasional terbaru untuk seluruh STO."
    />
  );
}
