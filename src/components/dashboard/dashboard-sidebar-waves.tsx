// Hiasan sidebar: cahaya merah samar di pojok kanan atas dan pita gelombang
// merah yang mengalir di bagian bawah, di belakang kartu bantuan.
// Perbandingan sisi gambar dijaga (slice), jadi lengkungnya tidak gepeng
// saat lebar sidebar berubah.
export function DashboardSidebarWaves() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -right-24 -top-28 size-72 rounded-full bg-brand-accent/20 blur-3xl" />

      <svg
        className="absolute inset-x-0 bottom-0 h-72 w-full"
        preserveAspectRatio="xMaxYMax slice"
        viewBox="0 0 320 288"
      >
        <defs>
          <linearGradient
            id="dashboard-wave-ribbon"
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="0"
              stopOpacity="0.15"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0.55"
              stopOpacity="0.9"
            />
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="1"
              stopOpacity="0.55"
            />
          </linearGradient>
          <linearGradient id="dashboard-wave-soft" x1="0" x2="1" y1="0" y2="0">
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0"
              stopOpacity="0"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0.6"
              stopOpacity="0.45"
            />
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="1"
              stopOpacity="0.3"
            />
          </linearGradient>
          <linearGradient id="dashboard-wave-fade" x1="0" x2="0" y1="0" y2="1">
            <stop
              className="[stop-color:var(--color-brand-crimson)]"
              offset="0"
              stopOpacity="0.28"
            />
            <stop
              className="[stop-color:var(--color-brand-navy-deep)]"
              offset="1"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Bayangan merah lebar di bawah pita */}
        <path
          d="M0 196C86 150 176 214 320 132V288H0Z"
          fill="url(#dashboard-wave-fade)"
        />
        {/* Pita tipis atas */}
        <path
          d="M0 150C94 112 186 168 320 92V104C188 182 96 128 0 166Z"
          fill="url(#dashboard-wave-soft)"
        />
        {/* Pita utama */}
        <path
          d="M0 184C92 138 182 204 320 120V150C184 232 94 168 0 214Z"
          fill="url(#dashboard-wave-ribbon)"
        />
        {/* Garis halus yang mengikuti arus */}
        <path
          d="M0 236C96 196 196 254 320 182"
          fill="none"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <path
          d="M0 258C104 224 204 276 320 212"
          fill="none"
          stroke="white"
          strokeOpacity="0.07"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
