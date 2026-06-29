import type { Device } from "../types/monitoring";

export const mockDevices: Device[] = [
  {
    id: "device-tph-main",
    siteId: "site-tph",
    tankId: "tank-tph-main",
    code: "demo-tph-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    apiKeyHash:
      "sha256:749a381823e9c3e494badf95003e255a389eb65b1f894a058a54f27b1834d1f4",
    isActive: true,
  },
  {
    id: "device-psn-main",
    siteId: "site-psn",
    tankId: "tank-psn-main",
    code: "demo-psn-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    apiKeyHash:
      "sha256:89e3d6fef81054bd1948dee958084e69a7120e43587c7ae0244ba2f5b8354ef1",
    isActive: true,
  },
  {
    id: "device-nja-main",
    siteId: "site-nja",
    tankId: "tank-nja-main",
    code: "demo-nja-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    apiKeyHash:
      "sha256:b700ffe64480089f21b90066d3900ce529d9ddfc5f7b4ac4804dc2c9876188aa",
    isActive: true,
  },
  {
    id: "device-jto-main",
    siteId: "site-jto",
    tankId: "tank-jto-main",
    code: "demo-jto-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    apiKeyHash:
      "sha256:625067fdabde596e7fc076429db5d271e54b97ca690fefe188d9e81eaeb54688",
    isActive: true,
  },
  {
    id: "device-skp-main",
    siteId: "site-skp",
    tankId: "tank-skp-main",
    code: "demo-skp-01",
    label: "NodeMCU Ultrasonic Demo",
    expectedReportIntervalSec: 300,
    apiKeyHash:
      "sha256:075c5a726900bd6bcaf8c5695a87a0928fa7f283a39bd735706011232ed9544b",
    isActive: true,
  },
];
