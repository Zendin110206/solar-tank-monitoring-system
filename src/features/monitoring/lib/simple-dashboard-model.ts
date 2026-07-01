import type { DashboardMonitoringSite } from "./dashboard-view-model";
import type { TankShape } from "@/features/monitoring/types/monitoring";

export const SIMPLE_DASHBOARD_ALL_AREAS = "all";

export type SimpleDashboardStatusFilter = "all" | "online" | "offline";

export type SimpleDashboardSite = {
  code: string;
  name: string;
  areaLabel: string;
  tankId: string;
  tankShape: TankShape;
  volumeLiter: number;
  capacityLiter: number;
  updateLabel: string;
  lastReceivedAt: string;
  deviceId: string;
  latitude?: number;
  longitude?: number;
  isOnline: boolean;
};

export type SimpleDashboardFilters = {
  query: string;
  status: SimpleDashboardStatusFilter;
  area: string;
};

export type SimpleDashboardSummary = {
  total: number;
  online: number;
  offline: number;
};

function normalizeSearchValue(value: string) {
  return value.toLocaleLowerCase("id-ID").trim();
}

function getReceivedTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function createSimpleDashboardSites(
  rows: DashboardMonitoringSite[],
  capacityByTankId: ReadonlyMap<string, number>,
  shapeByTankId: ReadonlyMap<string, TankShape>,
): SimpleDashboardSite[] {
  return rows.map((site) => ({
    code: site.code,
    name: site.name,
    areaLabel: site.areaLabel,
    tankId: site.tankId,
    tankShape: shapeByTankId.get(site.tankId) ?? "horizontal-cylinder",
    volumeLiter: site.volumeLiter,
    capacityLiter: capacityByTankId.get(site.tankId) ?? 0,
    updateLabel: site.updateLabel,
    lastReceivedAt: site.lastReceivedAt,
    deviceId: site.deviceId,
    latitude: site.latitude,
    longitude: site.longitude,
    isOnline: site.deviceStatus === "online",
  }));
}

export function getSimpleDashboardSummary(
  sites: SimpleDashboardSite[],
): SimpleDashboardSummary {
  const online = sites.filter((site) => site.isOnline).length;

  return {
    total: sites.length,
    online,
    offline: sites.length - online,
  };
}

export function getSimpleDashboardAreas(sites: SimpleDashboardSite[]) {
  return Array.from(
    new Set(
      sites
        .map((site) => site.areaLabel.trim())
        .filter((areaLabel) => areaLabel.length > 0),
    ),
  ).sort((first, second) => first.localeCompare(second, "id-ID"));
}

export function filterSimpleDashboardSites(
  sites: SimpleDashboardSite[],
  filters: SimpleDashboardFilters,
) {
  const query = normalizeSearchValue(filters.query);
  const area = filters.area.trim();

  return sites.filter((site) => {
    if (filters.status === "online" && !site.isOnline) {
      return false;
    }

    if (filters.status === "offline" && site.isOnline) {
      return false;
    }

    if (area !== SIMPLE_DASHBOARD_ALL_AREAS && site.areaLabel !== area) {
      return false;
    }

    if (query.length === 0) {
      return true;
    }

    const haystack = [site.code, site.name, site.areaLabel, site.deviceId]
      .map(normalizeSearchValue)
      .join(" ");

    return haystack.includes(query);
  });
}

export function sortSimpleDashboardSites(sites: SimpleDashboardSite[]) {
  return [...sites].sort((first, second) => {
    if (first.isOnline !== second.isOnline) {
      return first.isOnline ? 1 : -1;
    }

    return (
      getReceivedTime(second.lastReceivedAt) -
        getReceivedTime(first.lastReceivedAt) ||
      first.code.localeCompare(second.code, "id-ID")
    );
  });
}
