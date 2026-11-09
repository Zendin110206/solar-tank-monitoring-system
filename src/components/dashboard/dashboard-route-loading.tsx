import { Card } from "@/components/ui/card";

type DashboardRouteLoadingProps = {
  label?: string;
  title?: string;
  description?: string;
};

export function DashboardRouteLoading({
  label = "Memuat halaman",
  title = "Menyiapkan data terbaru",
  description = "Sistem sedang membaca data dan menyiapkan tampilan. Halaman akan terbuka otomatis setelah siap.",
}: DashboardRouteLoadingProps) {
  return (
    <div className="w-full overflow-x-hidden text-zinc-950">
      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            {label}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
            <span className="h-24 animate-pulse rounded-lg bg-zinc-50" />
          </div>
          <div className="mt-4 h-72 animate-pulse rounded-lg bg-zinc-50" />
        </Card>
      </div>
    </div>
  );
}
