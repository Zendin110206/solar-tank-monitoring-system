import { BrandLogo } from "@/components/brand-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo
            className="gap-2"
            markClassName="size-7"
            textClassName="font-semibold text-zinc-900"
          />
          <span>&copy; 2026 Hak Cipta Dilindungi.</span>
        </div>
        <p>FTM Fuel Tank Management Service.</p>
      </div>
    </footer>
  );
}
