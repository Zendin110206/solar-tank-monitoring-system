import { describe, expect, it } from "vitest";

import {
  getProvidedReadinessToken,
  hasValidReadinessToken,
} from "../lib/readiness-access";

describe("readiness access", () => {
  it("accepts the explicit readiness header", () => {
    const headers = new Headers({
      "x-solar-tank-readiness-token": "secret-token",
    });

    expect(getProvidedReadinessToken(headers)).toBe("secret-token");
    expect(
      hasValidReadinessToken({
        expectedToken: "secret-token",
        headers,
      }),
    ).toBe(true);
  });

  it("accepts bearer token fallback", () => {
    const headers = new Headers({
      authorization: "Bearer secret-token",
    });

    expect(getProvidedReadinessToken(headers)).toBe("secret-token");
    expect(
      hasValidReadinessToken({
        expectedToken: "secret-token",
        headers,
      }),
    ).toBe(true);
  });

  it("rejects missing, empty, or different tokens", () => {
    expect(
      hasValidReadinessToken({
        expectedToken: null,
        headers: new Headers({ "x-solar-tank-readiness-token": "token" }),
      }),
    ).toBe(false);
    expect(
      hasValidReadinessToken({
        expectedToken: "secret-token",
        headers: new Headers(),
      }),
    ).toBe(false);
    expect(
      hasValidReadinessToken({
        expectedToken: "secret-token",
        headers: new Headers({ authorization: "Bearer wrong-token" }),
      }),
    ).toBe(false);
  });
});
