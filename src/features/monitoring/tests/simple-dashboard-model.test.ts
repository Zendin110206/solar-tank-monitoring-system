import { describe, expect, it } from "vitest";
import {
  createSimpleDashboardSites,
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
} from "../lib/simple-dashboard-model";
import type { DashboardMonitoringSite } from "../lib/dashboard-view-model";

const sites: SimpleDashboardSite[] = [
  {
    code: "TPH",
    name: "STO Tosari Pasuruan",
    areaLabel: "Pasuruan Barat",
    regionalLabel: "TREG 5",
    wilayahLabel: "TIF 3",
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
    regionalLabel: "TREG 5",
    wilayahLabel: "TIF 3",
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
    regionalLabel: "TREG 4",
    wilayahLabel: "TIF 3",
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
        regionalLabel: "TREG 5",
        wilayahLabel: "TIF 3",
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
      regionalLabel: "TREG 5",
      wilayahLabel: "TIF 3",
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

  it("mengambil daftar regional dan wilayah unik untuk filter nasional", () => {
    expect(getSimpleDashboardRegionals(sites)).toEqual(["TREG 4", "TREG 5"]);
    expect(getSimpleDashboardWilayahs(sites)).toEqual(["TIF 3"]);
  });

  it("memfilter berdasarkan kata kunci kode, nama, area, regional, wilayah, atau device", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "demo-nja",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["NJA"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "sukorejo",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["SKP"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "treg 4",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["SKP"]);
  });

  it("memfilter status online dan offline saja", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "online",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["TPH", "NJA"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "offline",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["SKP"]);
  });

  it("memfilter area dari data registry, bukan hardcode", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "all",
        area: "Pasuruan Barat",
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["TPH", "SKP"]);
  });

  it("memfilter regional dan wilayah dari data registry", () => {
    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: "TREG 5",
        wilayah: SIMPLE_DASHBOARD_ALL_WILAYAHS,
      }).map((site) => site.code),
    ).toEqual(["TPH", "NJA"]);

    expect(
      filterSimpleDashboardSites(sites, {
        query: "",
        status: "all",
        area: SIMPLE_DASHBOARD_ALL_AREAS,
        regional: SIMPLE_DASHBOARD_ALL_REGIONALS,
        wilayah: "TIF 3",
      }).map((site) => site.code),
    ).toEqual(["TPH", "NJA", "SKP"]);
  });

  it("mengurutkan offline lebih dulu, lalu reading terbaru", () => {
    expect(sortSimpleDashboardSites(sites).map((site) => site.code)).toEqual([
      "SKP",
      "TPH",
      "NJA",
    ]);
  });
});
