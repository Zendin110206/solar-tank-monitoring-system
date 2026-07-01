import { describe, expect, it } from "vitest";
import {
  createSimpleDashboardSites,
  filterSimpleDashboardSites,
  getSimpleDashboardAreas,
  getSimpleDashboardSummary,
  SIMPLE_DASHBOARD_ALL_AREAS,
  sortSimpleDashboardSites,
  type SimpleDashboardSite,
} from "../lib/simple-dashboard-model";
import type { DashboardMonitoringSite } from "../lib/dashboard-view-model";

const sites: SimpleDashboardSite[] = [
  {
    code: "TPH",
    name: "STO Tosari Pasuruan",
    areaLabel: "Pasuruan Barat",
    tankId: "tank-tph",
    tankShape: "horizontal-cylinder",
    volumeLiter: 3900,
    capacityLiter: 5000,
    updateLabel: "2 menit lalu",
    lastReceivedAt: "2026-07-01T10:02:00.000Z",
    deviceId: "demo-tph-01",
    isOnline: true,
  },
  {
    code: "NJA",
    name: "STO Nguling Jaya",
    areaLabel: "Pasuruan Timur",
    tankId: "tank-nja",
    tankShape: "horizontal-cylinder",
    volumeLiter: 350,
    capacityLiter: 5000,
    updateLabel: "4 menit lalu",
    lastReceivedAt: "2026-07-01T10:00:00.000Z",
    deviceId: "demo-nja-01",
    isOnline: true,
  },
  {
    code: "SKP",
    name: "STO Sukorejo Pasuruan",
    areaLabel: "Pasuruan Barat",
    tankId: "tank-skp",
    tankShape: "rectangular",
    volumeLiter: 3200,
    capacityLiter: 5000,
    updateLabel: "2 jam lalu",
    lastReceivedAt: "2026-07-01T08:00:00.000Z",
    deviceId: "demo-skp-01",
    isOnline: false,
  },
];

describe("simple dashboard model", () => {
  it("meneruskan kapasitas, bentuk tangki, dan koordinat untuk kartu serta peta", () => {
    const rows: DashboardMonitoringSite[] = [
      {
        id: "site-tph-tank-tph",
        code: "TPH",
        name: "STO TPH",
        areaLabel: "Area demo",
        tankId: "tank-tph",
        tank: "Tangki TPH",
        status: "online",
        deviceStatus: "online",
        runtimeStatus: "safe",
        operationalStatus: "safe",
        fillPercent: 59,
        volumeLiter: 317,
        runtimeHour: 13,
        lastReceivedAt: "2026-07-01T10:02:00.000Z",
        updateLabel: "10 dtk lalu",
        deviceId: "demo-tph-01",
        signal: "-",
        left: "50%",
        top: "50%",
        latitude: -7.65,
        longitude: 112.9,
        note: "Data stabil.",
        consumptionLiterPerHour: 24,
        configStatus: "normal",
        configNeedsReview: false,
        configSummary: "Sesuai registry",
      },
    ];

    expect(
      createSimpleDashboardSites(
        rows,
        new Map([["tank-tph", 540]]),
        new Map([["tank-tph", "rectangular"]]),
      )[0],
    ).toMatchObject({
      capacityLiter: 540,
      tankShape: "rectangular",
      latitude: -7.65,
      longitude: 112.9,
    });
  });

  it("menghitung summary online dan offline", () => {
    expect(getSimpleDashboardSummary(sites)).toEqual({
      total: 3,
      online: 2,
      offline: 1,
    });
  });

  it("mengambil daftar area unik untuk filter", () => {
    expect(getSimpleDashboardAreas(sites)).toEqual([
      "Pasuruan Barat",
      "Pasuruan Timur",
    ]);
  });

  it("memfilter berdasarkan kata kunci kode, nama, area, atau device", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "demo-nja",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
      }).map((site) => site.code),
    ).toEqual(["NJA"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "sukorejo",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
      }).map((site) => site.code),
    ).toEqual(["SKP"]);
  });

  it("memfilter status online dan offline saja", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "online",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
      }).map((site) => site.code),
    ).toEqual(["TPH", "NJA"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "offline",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
      }).map((site) => site.code),
    ).toEqual(["SKP"]);
  });

  it("memfilter area dari data registry, bukan hardcode", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "all",
        area: "Pasuruan Barat",
      }).map((site) => site.code),
    ).toEqual(["TPH", "SKP"]);
  });

  it("mengurutkan offline lebih dulu, lalu reading terbaru", () => {
    expect(sortSimpleDashboardSites(sites).map((site) => site.code)).toEqual([
      "SKP",
      "TPH",
      "NJA",
    ]);
  });
});
