import { describe, expect, it } from "vitest";
import {
  hashDeviceKey,
  isGlobalDeviceKeyFallbackAllowed,
  verifyDeviceKey,
  verifyDeviceKeyHash,
} from "../lib/device-key";

describe("device key security", () => {
  it("hashes device keys with a sha256 prefix", () => {
    const hash = hashDeviceKey("demo-tph-key");

    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("verifies a supplied key against a stored hash", () => {
    const hash = hashDeviceKey("demo-tph-key");

    expect(verifyDeviceKeyHash("demo-tph-key", hash)).toBe(true);
    expect(verifyDeviceKeyHash("wrong-key", hash)).toBe(false);
  });

  it("allows a device-specific key before trying the global fallback", () => {
    const apiKeyHash = hashDeviceKey("demo-tph-key");

    expect(
      verifyDeviceKey({
        device: { apiKeyHash },
        suppliedDeviceKey: "demo-tph-key",
        fallbackDeviceKey: "local-development-key",
        allowGlobalFallback: false,
      }),
    ).toBe(true);
  });

  it("can disable the global fallback key", () => {
    expect(
      verifyDeviceKey({
        device: { apiKeyHash: hashDeviceKey("demo-tph-key") },
        suppliedDeviceKey: "local-development-key",
        fallbackDeviceKey: "local-development-key",
        allowGlobalFallback: false,
      }),
    ).toBe(false);
  });

  it("keeps the global fallback enabled by default for local development", () => {
    expect(isGlobalDeviceKeyFallbackAllowed(undefined)).toBe(true);
    expect(isGlobalDeviceKeyFallbackAllowed("true")).toBe(true);
    expect(isGlobalDeviceKeyFallbackAllowed("false")).toBe(false);
    expect(isGlobalDeviceKeyFallbackAllowed("0")).toBe(false);
  });
});
