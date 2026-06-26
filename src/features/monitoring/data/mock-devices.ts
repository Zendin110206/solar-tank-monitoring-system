import type { Device } from "../types/monitoring";

export const mockDevices: Device[] = [
  {
    id: "device-tph-main",
    siteId: "site-tph",
    tankId: "tank-tph-main",
    code: "demo-tph-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    isActive: true,
  },
  {
    id: "device-nja-main",
    siteId: "site-nja",
    tankId: "tank-nja-main",
    code: "demo-nja-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    isActive: true,
  },
  {
    id: "device-jto-main",
    siteId: "site-jto",
    tankId: "tank-jto-main",
    code: "demo-jto-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    isActive: true,
  },
  {
    id: "device-skp-main",
    siteId: "site-skp",
    tankId: "tank-skp-main",
    code: "demo-skp-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    isActive: true,
  },
];
