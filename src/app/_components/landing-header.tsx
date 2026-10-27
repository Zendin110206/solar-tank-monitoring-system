import { BrandLogo } from "@/components/brand-logo";

const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Alur Data", href: "#alur-data" },
  { label: "Operasional", href: "#operasional" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Akses", href: "#daftar" },
  { label: "Dashboard", href: "/dashboard" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 mx-auto flex h-20 max-w-[1480px] items-center justify-between border-b border-zinc-100 bg-white/85 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
      <a href="#beranda" className="flex items-center gap-3" aria-label="FTM">
        <BrandLogo
          markClassName="size-10 sm:size-11"
          priority
          textClassName="text-xl font-semibold tracking-normal sm:text-2xl"
        />
      </a>

      <nav className="hidden items-center gap-10 text-sm font-medium text-zinc-800 lg:flex">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="transition hover:text-red-600"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-3 text-sm font-medium sm:flex">
        <a
          href="/login"
          className="hidden text-zinc-800 transition hover:text-red-600 sm:inline"
        >
          Masuk
        </a>
        <a
          href="/register"
          className="rounded-lg border border-zinc-300 px-5 py-3 text-zinc-900 transition hover:border-red-500 hover:text-red-600"
        >
          Daftar
        </a>
      </div>
    </header>
  );
}
