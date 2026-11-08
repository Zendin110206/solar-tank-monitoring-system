import Image from "next/image";

import { AUTH_CONTENT } from "./auth-content";
import { AuthPhoto } from "./auth-photo";

const { panel } = AUTH_CONTENT;

// Gelombang merah di pojok kiri atas dan sepanjang tepi bawah panel.
function AuthWaves() {
  return (
    <>
      <svg
        aria-hidden="true"
        className="absolute left-0 top-0 h-[calc(140*var(--auth-u))] w-[calc(230*var(--auth-u))]"
        preserveAspectRatio="none"
        viewBox="0 0 230 140"
      >
        <defs>
          <linearGradient id="auth-wave-top" x1="0" x2="1" y1="1" y2="0">
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0"
              stopOpacity="0.95"
            />
            <stop
              className="[stop-color:var(--color-brand-red-strong)]"
              offset="1"
              stopOpacity="0.15"
            />
          </linearGradient>
        </defs>
        <path d="M0 0H215C140 22 62 70 0 128Z" fill="url(#auth-wave-top)" />
        <path
          className="[stroke:var(--color-brand-accent)]"
          d="M0 126C62 68 140 22 212 0"
          fill="none"
          strokeOpacity="0.85"
          strokeWidth="2"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[calc(270*var(--auth-u))] w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1072 270"
      >
        <defs>
          <linearGradient id="auth-wave-glow" x1="0" x2="1" y1="0" y2="0">
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0"
              stopOpacity="0"
            />
            <stop
              className="[stop-color:var(--color-brand-red)]"
              offset="0.45"
              stopOpacity="0.35"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="1"
              stopOpacity="0.8"
            />
          </linearGradient>
          <linearGradient id="auth-wave-line" x1="0" x2="1" y1="0" y2="0">
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0"
              stopOpacity="0.2"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="0.3"
              stopOpacity="0.95"
            />
            <stop
              className="[stop-color:var(--color-brand-accent)]"
              offset="1"
              stopOpacity="1"
            />
          </linearGradient>
        </defs>
        <path
          d="M0 270C210 196 470 158 690 164C850 168 960 140 1072 18V270Z"
          fill="url(#auth-wave-glow)"
        />
        <path
          d="M140 270C330 186 560 150 760 158C900 164 990 120 1072 30"
          fill="none"
          stroke="url(#auth-wave-line)"
          strokeWidth="3"
        />
        <path
          className="[stroke:var(--color-brand-accent)]"
          d="M300 270C470 214 650 196 820 200C930 203 1010 180 1072 130"
          fill="none"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
      </svg>
    </>
  );
}

// Panel kanan bermerek: foto, gelombang, logo dan nama produk, serta satu kalimat.
// Hanya tampil di layar lebar.
export function AuthBrandPanel() {
  return (
    <section
      aria-label={panel.label}
      className="@container relative hidden overflow-hidden bg-brand-navy text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center"
    >
      <AuthPhoto />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-brand-navy/80 via-brand-navy/40 via-35% to-brand-navy/0 to-60%"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-brand-navy/70 via-brand-navy/60 via-70% to-brand-navy/30 @min-[44rem]:hidden"
      />
      <AuthWaves />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_50%_38%_at_50%_47%,color-mix(in_srgb,var(--color-brand-navy)_88%,transparent)_0%,color-mix(in_srgb,var(--color-brand-navy)_55%,transparent)_55%,transparent_100%)]"
      />

      <div className="relative z-10 flex flex-col items-center px-[calc(60*var(--auth-u))] pb-[calc(60*var(--auth-u))] text-center">
        <span className="mb-[calc(28*var(--auth-u))] grid size-[calc(88*var(--auth-u))] place-items-center rounded-[calc(20*var(--auth-u))] bg-white shadow-lg shadow-black/25">
          <Image
            alt={panel.logoAlt}
            className="size-[calc(70*var(--auth-u))]"
            height={192}
            loading="eager"
            src="/logo/android-icon-192x192.png"
            width={192}
          />
        </span>
        <h2 className="text-[length:calc(72*var(--auth-u))] font-bold leading-[1.05] tracking-[-0.015em]">
          {panel.title[0]}
          <br />
          {panel.title[1]}
        </h2>
        <p className="mt-[calc(26*var(--auth-u))] text-[length:calc(24*var(--auth-u))] leading-snug text-white/90">
          {panel.tagline}
        </p>
      </div>
    </section>
  );
}
