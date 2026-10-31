import "server-only";

import { mockDevices } from "../data/mock-devices";
import { mockSites } from "../data/mock-sites";
import { mockTanks } from "../data/mock-tanks";
import type { Device, Site, Tank } from "../types/monitoring";
import { listMonitoringReferenceFromMysql } from "./repositories/mysql-reference-repository";
import {
  getMonitoringStorageDriver,
  type MonitoringStorageDriver,
} from "./monitoring-storage";

export type MonitoringReferenceData = {
  sites: Site[];
  tanks: Tank[];
  devices: Device[];
};

type MonitoringRegistrySource = {
  configuredDriver: MonitoringStorageDriver;
  activeDriver: MonitoringStorageDriver;
  isFallback: boolean;
  label: string;
};

type MonitoringReferenceResult = {
  reference: MonitoringReferenceData;
  source: MonitoringRegistrySource;
};
function cloneReferenceData(
  reference: MonitoringReferenceData,
): MonitoringReferenceData {
  return {
    sites: reference.sites.map((site) => ({ ...site })),
    tanks: reference.tanks.map((tank) => ({ ...tank })),
    devices: reference.devices.map((device) => ({ ...device })),
  };
}

function getMemoryReferenceData(): MonitoringReferenceData {
  return cloneReferenceData({
    sites: mockSites,
    tanks: mockTanks,
    devices: mockDevices,
  });
}

function createRegistrySource(
  driver: MonitoringStorageDriver,
): MonitoringRegistrySource {
  if (driver === "mysql") {
    return {
      configuredDriver: "mysql",
      activeDriver: "mysql",
      isFallback: false,
      label: "Registry MySQL",
    };
  }

  return {
    configuredDriver: "memory",
    activeDriver: "memory",
    isFallback: false,
    label: "Registry memory lokal",
  };
}

function assertCompleteReferenceData(reference: MonitoringReferenceData): void {
  if (
    reference.sites.length === 0 ||
    reference.tanks.length === 0 ||
    reference.devices.length === 0
  ) {
    throw new Error(
      "Registry site/tangki/device MySQL belum lengkap. Jalankan migration dan seed reference data terlebih dahulu.",
    );
  }
}

export async function getMonitoringReferenceDataWithSource(): Promise<MonitoringReferenceResult> {
  const configuredDriver = getMonitoringStorageDriver();

  if (configuredDriver !== "mysql") {
    return {
      reference: getMemoryReferenceData(),
      source: createRegistrySource("memory"),
    };
  }

  const reference = await listMonitoringReferenceFromMysql();
  assertCompleteReferenceData(reference);

  return {
    reference,
    source: createRegistrySource("mysql"),
  };
}

export async function getMonitoringReferenceData(): Promise<MonitoringReferenceData> {
  const result = await getMonitoringReferenceDataWithSource();
  return result.reference;
}
