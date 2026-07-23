import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertProductionBootSafe,
  checkProductionBoot,
  hasProductionLicenseKey,
  isDemoAuthEnabledInEnv,
  isProductionRuntime,
} from "@/server/production-boot";

describe("production-boot", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.VITE_APP_ENV;
    delete process.env.APP_ENV;
    delete process.env.VITE_ALLOW_DEMO_AUTH;
    delete process.env.ALLOW_DEMO_AUTH;
    delete process.env.ALLOW_DEMO_PERSIST;
    delete process.env.MEDORA_LICENSE_KEY;
    delete process.env.VITE_MEDORA_LICENSE_KEY;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("allows boot in non-production without license", () => {
    process.env.NODE_ENV = "development";
    expect(isProductionRuntime()).toBe(false);
    expect(checkProductionBoot()).toEqual({ ok: true });
  });

  it("refuses production when demo auth is enabled", () => {
    process.env.NODE_ENV = "production";
    process.env.VITE_APP_ENV = "production";
    process.env.VITE_ALLOW_DEMO_AUTH = "true";
    process.env.MEDORA_LICENSE_KEY = "abcdefghijklmnop";
    const result = checkProductionBoot();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => /demo auth/i.test(e))).toBe(true);
    expect(() => assertProductionBootSafe()).toThrow(/refused to boot/i);
  });

  it("refuses production when license key missing", () => {
    process.env.NODE_ENV = "production";
    process.env.VITE_APP_ENV = "production";
    process.env.VITE_ALLOW_DEMO_AUTH = "false";
    expect(hasProductionLicenseKey()).toBe(false);
    const result = checkProductionBoot();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => /LICENSE_KEY/i.test(e))).toBe(true);
  });

  it("allows production when demo off and license set", () => {
    process.env.NODE_ENV = "production";
    process.env.VITE_APP_ENV = "production";
    process.env.VITE_ALLOW_DEMO_AUTH = "false";
    process.env.ALLOW_DEMO_PERSIST = "false";
    process.env.MEDORA_LICENSE_KEY = "medora-prod-license-key";
    expect(isDemoAuthEnabledInEnv()).toBe(false);
    expect(checkProductionBoot()).toEqual({ ok: true });
    expect(() => assertProductionBootSafe()).not.toThrow();
  });

  it("treats unset demo flags as disabled in production", () => {
    process.env.NODE_ENV = "production";
    process.env.VITE_APP_ENV = "production";
    process.env.MEDORA_LICENSE_KEY = "medora-prod-license-key";
    expect(isDemoAuthEnabledInEnv()).toBe(false);
    expect(checkProductionBoot()).toEqual({ ok: true });
  });
});
