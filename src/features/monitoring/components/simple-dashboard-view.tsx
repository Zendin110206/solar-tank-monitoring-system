"use client";

import { LayoutGrid, MapPinned, Search } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  filterSimpleDashboardSites,
  getSimpleDashboardAreas,
  getSimpleDashboardRegionals,
  getSimpleDashboardSummary,
  getSimpleDashboardWilayahs,
  SIMPLE_DASHBOARD_ALL_AREAS,
  SIMPLE_DASHBOARD_ALL_REGIONALS,
  SIMPLE_DASHBOARD_ALL_WILAYAHS,
  sortSimpleDashboardSites,
  type SimpleDashboardSite,
  type SimpleDashboardStatusFilter,
} from "../domain/simple-dashboard-model";
import { SimpleDashboardCards } from "./simple-dashboard-cards";
import { SimpleDashboardMap } from "./simple-dashboard-map";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { STATUS_DOT_CLASS } from "@/components/ui/status-tone";

type SimpleDashboardViewProps = {
  adminCleanupToken?: string;
  sites: SimpleDashboardSite[];
};

type StatusFilterOption = {
  value: SimpleDashboardStatusFilter;
  label: string;
};

type DashboardViewMode = "cards" | "map";

const SIMPLE_DASHBOARD_ALL_STOS = "all";

const STATUS_FILTERS: StatusFilterOption[] = [
  { value: "all", label: "Semua" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const VIEW_MODES = [
  {
    value: "cards",
    label: "Kartu",
    icon: <LayoutGrid aria-hidden="true" className="size-4" />,
  },
  {
    value: "map",
    label: "Peta",
    icon: <MapPinned aria-hidden="true" className="size-4" />,
  },
] as const satisfies readonly {
  icon: ReactNode;
  label: string;
  value: DashboardViewMode;
}[];

type SummaryTone = "blue" | "emerald" | "red";

const SUMMARY_TONES: Record<
  SummaryTone,
  { border: string; line: string; text: string }
> = {
  blue: {
    border: "border-blue-100",
    line: "bg-blue-500",
    text: "text-blue-700",
  },
  emerald: {
    border: "border-emerald-100",
    line: STATUS_DOT_CLASS.success,
    text: "text-emerald-700",
  },
  red: {
    border: "border-red-100",
    line: STATUS_DOT_CLASS.danger,
    text: "text-red-700",
  },
};

function SummaryValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: SummaryTone;
}) {
  const toneClass = SUMMARY_TONES[tone];

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-lg border bg-white px-4 py-3 shadow-sm ${toneClass.border}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${toneClass.line}`} />
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass.text}`}>{value}</p>
    </div>
  );
}

export function SimpleDashboardView({
  adminCleanupToken,
  sites,
}: SimpleDashboardViewProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SimpleDashboardStatusFilter>("all");
  const [areaFilter, setAreaFilter] = useState(SIMPLE_DASHBOARD_ALL_AREAS);
  const [regionalFilter, setRegionalFilter] = useState(
    SIMPLE_DASHBOARD_ALL_REGIONALS,
  );
  const [wilayahFilter, setWilayahFilter] = useState(
    SIMPLE_DASHBOARD_ALL_WILAYAHS,
  );
  const [selectedSto, setSelectedSto] = useState(SIMPLE_DASHBOARD_ALL_STOS);
  const [viewMode, setViewMode] = useState<DashboardViewMode>("cards");

  const summary = useMemo(() => getSimpleDashboardSummary(sites), [sites]);
  const areas = useMemo(() => getSimpleDashboardAreas(sites), [sites]);
  const regionals = useMemo(() => getSimpleDashboardRegionals(sites), [sites]);
  const wilayahs = useMemo(() => getSimpleDashboardWilayahs(sites), [sites]);
  const stoOptions = useMemo(
    () =>
      [...sites].sort(
        (first, second) =>
          first.name.localeCompare(second.name, "id-ID") ||
          first.code.localeCompare(second.code, "id-ID"),
      ),
    [sites],
  );
  const visibleSites = useMemo(
    () =>
      selectedSto === SIMPLE_DASHBOARD_ALL_STOS
        ? sortSimpleDashboardSites(
            filterSimpleDashboardSites(sites, {
              query,
              status: statusFilter,
              area: areaFilter,
              regional: regionalFilter,
              wilayah: wilayahFilter,
            }),
          )
        : sortSimpleDashboardSites(
            sites.filter((site) => site.tankId === selectedSto),
          ),
    [
      areaFilter,
      query,
      regionalFilter,
      selectedSto,
      sites,
      statusFilter,
      wilayahFilter,
    ],
  );
  const mapViewKey = useMemo(
    () => visibleSites.map((site) => site.tankId).join("|"),
    [visibleSites],
  );

  return (
    <section className="flex min-h-0 w-[calc(100vw-2rem)] max-w-full min-w-0 flex-1 flex-col gap-4 sm:w-full">
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <SummaryValue label="Total STO" tone="blue" value={summary.total} />
        <SummaryValue label="Online" tone="emerald" value={summary.online} />
        <SummaryValue label="Offline" tone="red" value={summary.offline} />
      </div>

      {/* Bar filter. Susunannya mengikuti lebar kotak ini sendiri (container
          query), jadi tetap lega saat sidebar dibuka maupun diciutkan. */}
      <div className="@container rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid min-w-0 gap-4 @xl:grid-cols-[minmax(0,1fr)_auto] @min-[88rem]:grid-cols-[minmax(14rem,1fr)_auto_minmax(0,2.6fr)] @min-[88rem]:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
              Cari STO
            </span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              />
              <input
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm font-medium text-zinc-950 shadow-xs outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kode, nama, area, regional, wilayah, atau perangkat"
                type="search"
                value={query}
              />
            </span>
          </label>

          <div className="min-w-0">
            <p className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
              Status
            </p>
            <SegmentedControl
              className="@xl:w-[16.5rem]"
              label="Filter status STO"
              onChange={setStatusFilter}
              options={STATUS_FILTERS}
              value={statusFilter}
            />
          </div>

          <div className="grid min-w-0 gap-4 @xl:col-span-2 @xl:grid-cols-2 @4xl:grid-cols-4 @min-[88rem]:col-span-1">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
                Regional
              </span>
              <SelectField
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-3 text-sm font-semibold text-zinc-800 shadow-xs outline-none transition hover:border-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setRegionalFilter(event.target.value)}
                value={regionalFilter}
              >
                <option value={SIMPLE_DASHBOARD_ALL_REGIONALS}>
                  Semua regional
                </option>
                {regionals.map((regional) => (
                  <option key={regional} value={regional}>
                    {regional}
                  </option>
                ))}
              </SelectField>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
                Wilayah
              </span>
              <SelectField
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-3 text-sm font-semibold text-zinc-800 shadow-xs outline-none transition hover:border-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setWilayahFilter(event.target.value)}
                value={wilayahFilter}
              >
                <option value={SIMPLE_DASHBOARD_ALL_WILAYAHS}>
                  Semua wilayah
                </option>
                {wilayahs.map((wilayah) => (
                  <option key={wilayah} value={wilayah}>
                    {wilayah}
                  </option>
                ))}
              </SelectField>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
                Area
              </span>
              <SelectField
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-3 text-sm font-semibold text-zinc-800 shadow-xs outline-none transition hover:border-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setAreaFilter(event.target.value)}
                value={areaFilter}
              >
                <option value={SIMPLE_DASHBOARD_ALL_AREAS}>Semua area</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </SelectField>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.04em] text-zinc-500">
                Pilih STO
              </span>
              <SelectField
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-3 text-sm font-semibold text-zinc-800 shadow-xs outline-none transition hover:border-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10 truncate"
                onChange={(event) => setSelectedSto(event.target.value)}
                value={selectedSto}
              >
                <option value={SIMPLE_DASHBOARD_ALL_STOS}>Semua STO</option>
                {stoOptions.map((site) => (
                  <option key={site.tankId} value={site.tankId}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </SelectField>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal text-zinc-950">
            Monitoring Tangki STO
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {visibleSites.length} dari {sites.length} STO ditampilkan
          </p>
        </div>

        <SegmentedControl
          className="w-full sm:w-[13rem]"
          label="Pilih tampilan dashboard"
          onChange={setViewMode}
          options={VIEW_MODES}
          value={viewMode}
        />
      </div>

      {viewMode === "cards" ? (
        <SimpleDashboardCards
          adminCleanupToken={adminCleanupToken}
          sites={visibleSites}
        />
      ) : (
        <SimpleDashboardMap key={mapViewKey} sites={visibleSites} />
      )}
    </section>
  );
}
