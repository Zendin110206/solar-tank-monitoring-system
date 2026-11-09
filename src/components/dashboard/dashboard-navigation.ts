import {
  ChartColumn,
  ClipboardCheck,
  Cpu,
  Fuel,
  Headset,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { AuthRole } from "@/features/auth/types/auth";

// Satu-satunya daftar menu dashboard. Sidebar, panel geser, dan pencarian
// di header semuanya membaca daftar ini. Peran di `roles` harus sama dengan
// pengaman halaman di server (requirePageUser / requirePageAdmin); menu
// hanya menyembunyikan tautan, pengamannya tetap di server.

export type DashboardNavItem = {
  // Keterangan singkat dan kata kunci untuk pencarian di header.
  description: string;
  href: string;
  icon: LucideIcon;
  id: string;
  keywords?: string;
  label: string;
  // Awalan alamat halaman anak yang ikut menyorot item ini.
  matchPrefixes?: readonly string[];
  roles: readonly AuthRole[];
};

export type DashboardNavGroup = {
  id: string;
  items: readonly DashboardNavItem[];
  label: string;
};

const ALL_ROLES: readonly AuthRole[] = ["admin", "user"];
const ADMIN_ONLY: readonly AuthRole[] = ["admin"];

export const DASHBOARD_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    id: "utama",
    label: "Utama",
    items: [
      {
        id: "tangki",
        label: "Manajemen Tangki",
        description: "Isi tangki, status perangkat, dan peta lokasi STO",
        keywords: "tangki solar bbm volume genset sto lokasi",
        href: "/dashboard",
        icon: Fuel,
        matchPrefixes: ["/dashboard/tanks/", "/dashboard/ringkas/tanks/"],
        roles: ALL_ROLES,
      },
      {
        id: "analisis",
        label: "Analisis Teknis",
        description: "Prioritas, log perangkat, dan riwayat bacaan",
        keywords: "grafik log riwayat sensor teknis",
        href: "/dashboard/detail",
        icon: ChartColumn,
        roles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: "perangkat",
    label: "Perangkat",
    items: [
      {
        id: "pengajuan-perangkat",
        label: "Pengajuan Perangkat",
        description: "Ajukan perangkat sensor baru untuk ditinjau admin",
        keywords: "sensor esp8266 firmware perangkat baru",
        href: "/dashboard/devices/request",
        icon: Cpu,
        roles: ALL_ROLES,
      },
      {
        id: "tinjau-pengajuan",
        label: "Tinjau Pengajuan",
        description: "Setujui atau tolak pengajuan perangkat",
        keywords: "persetujuan firmware paket perangkat",
        href: "/dashboard/admin/device-requests",
        icon: ClipboardCheck,
        roles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: "administrasi",
    label: "Administrasi",
    items: [
      {
        id: "pengguna",
        label: "Manajemen Pengguna",
        description: "Akun, peran, dan akses pengguna",
        keywords: "user akun role admin akses",
        href: "/dashboard/admin/users",
        icon: Users,
        roles: ADMIN_ONLY,
      },
      {
        id: "audit",
        label: "Audit Keamanan",
        description: "Log login, OTP, dan aktivitas keamanan akun",
        keywords: "log keamanan login otp reset",
        href: "/dashboard/admin/audit",
        icon: ShieldCheck,
        roles: ADMIN_ONLY,
      },
    ],
  },
  {
    id: "bantuan",
    label: "Bantuan",
    items: [
      {
        id: "kontak",
        label: "Kontak",
        description: "Informasi bantuan dan kontak administrator",
        keywords: "bantuan helpdesk admin kontak",
        href: "/dashboard/contact",
        icon: Headset,
        roles: ALL_ROLES,
      },
    ],
  },
];

// Halaman akun yang tidak ada di menu tetapi tetap bisa dicari dari header.
const ACCOUNT_SEARCH_ITEMS: readonly DashboardSearchItem[] = [
  {
    id: "profil",
    label: "Profil Saya",
    description: "Data akun dan peran Anda",
    href: "/dashboard/profile",
    keywords: "profil akun nama email",
  },
  {
    id: "keamanan-akun",
    label: "Keamanan Akun",
    description: "Password, sesi, dan Telegram",
    href: "/dashboard/account/security",
    keywords: "password kata sandi sesi telegram",
  },
];

export type DashboardSearchItem = Pick<
  DashboardNavItem,
  "description" | "href" | "id" | "keywords" | "label"
>;

export function getNavGroupsForRole(role: AuthRole): DashboardNavGroup[] {
  return DASHBOARD_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function isNavItemActive(item: DashboardNavItem, pathname: string) {
  return (
    pathname === item.href ||
    (item.matchPrefixes ?? []).some((prefix) => pathname.startsWith(prefix))
  );
}

// Daftar yang bisa dicari di header: menu sesuai peran ditambah halaman akun.
export function getSearchItemsForRole(role: AuthRole): DashboardSearchItem[] {
  return [
    ...getNavGroupsForRole(role).flatMap((group) => group.items),
    ...ACCOUNT_SEARCH_ITEMS,
  ];
}

export function filterSearchItems(
  items: readonly DashboardSearchItem[],
  query: string,
): DashboardSearchItem[] {
  const words = query
    .trim()
    .toLocaleLowerCase("id")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  return items.filter((item) => {
    const text =
      `${item.label} ${item.description} ${item.keywords ?? ""}`.toLocaleLowerCase(
        "id",
      );

    return words.every((word) => text.includes(word));
  });
}
