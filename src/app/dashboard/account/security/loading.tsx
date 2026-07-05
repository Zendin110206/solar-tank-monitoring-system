import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function AccountSecurityLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat keamanan"
      title="Menyiapkan keamanan akun"
      description="Sistem sedang membaca sesi aktif dan pengaturan keamanan akun."
    />
  );
}
