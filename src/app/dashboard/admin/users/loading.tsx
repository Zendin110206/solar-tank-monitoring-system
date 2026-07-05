import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";

export default function UsersLoading() {
  return (
    <DashboardRouteLoading
      label="Memuat pengguna"
      title="Menyiapkan manajemen pengguna"
      description="Sistem sedang membaca akun, status akses, dan antrean persetujuan."
    />
  );
}
