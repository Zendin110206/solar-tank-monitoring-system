// Semua teks kerangka dashboard (sidebar, header, pencarian, notifikasi,
// menu akun, bendera, kartu bantuan) dikumpulkan di sini agar mudah ditinjau.

export const DASHBOARD_SHELL_CONTENT = {
  skipToContent: "Lewati ke konten utama",
  homeLabel: "Beranda dashboard FTM",
  productName: "FTM",
  productFullName: "Fuel Tank Management",
  mainNavigationLabel: "Navigasi utama",
  openMenu: "Buka navigasi",
  closeMenu: "Tutup navigasi",
  collapseMenu: "Ciutkan navigasi",
  expandMenu: "Perluas navigasi",
  search: {
    label: "Cari menu atau halaman",
    placeholder: "Cari menu atau halaman FTM",
    empty: "Tidak ada menu atau halaman yang cocok.",
    resultsLabel: "Hasil pencarian",
    close: "Tutup pencarian",
  },
  language: {
    groupLabel: "Bahasa tampilan",
    indonesian: "Bahasa Indonesia",
    englishUnavailable: "English, belum tersedia",
    englishNote: "Versi bahasa Inggris belum tersedia.",
  },
  notifications: {
    open: "Buka notifikasi",
    openWithAlert: "Buka notifikasi, ada pemberitahuan baru",
    title: "Notifikasi",
    newLabel: "baru",
    telegramTitle: "Telegram belum terhubung",
    telegramDescription:
      "Hubungkan akun agar notifikasi dan fitur Telegram siap dipakai.",
    telegramAction: "Hubungkan Telegram",
    empty: "Belum ada pemberitahuan untuk akun Anda.",
    comingSoon:
      "Pusat notifikasi sedang dikembangkan. Pemberitahuan lain akan tampil di sini setelah tersedia.",
  },
  account: {
    open: "Buka menu akun",
    roleAdmin: "Administrator",
    roleUser: "Pengguna",
    profile: "Profil Saya",
    security: "Keamanan Akun",
    signOut: "Keluar",
    signingOut: "Keluar...",
  },
  helpCard: {
    title: "Butuh bantuan?",
    description: "Hubungi layanan bantuan FTM",
  },
  pageNavigationLabel: "Bagian halaman ini",
} as const;
