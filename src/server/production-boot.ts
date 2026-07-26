/**
 * Production boot guard — refuse to serve if demo auth is enabled or license missing.
 * Call from server handlers that run in production (status, persist, billing).
 */

export type ProductionBootResult = { ok: true } | { ok: false; errors: string[] };

function read(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

export function isProductionRuntime(): boolean {
  const appEnv = (read("VITE_APP_ENV") ?? read("APP_ENV") ?? "").toLowerCase();
  if (appEnv === "production") return true;
  return read("NODE_ENV") === "production";
}

function flagEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function flagDisabled(value: string | undefined): boolean {
  return value === "false" || value === "0";
}

/** Demo auth / persist allowed only when explicitly on (or non-prod default). */
export function isDemoAuthEnabledInEnv(): boolean {
  const demoAuth = read("VITE_ALLOW_DEMO_AUTH") ?? read("ALLOW_DEMO_AUTH");
  const demoPersist = read("ALLOW_DEMO_PERSIST");
  if (flagEnabled(demoAuth) || flagEnabled(demoPersist)) return true;
  if (flagDisabled(demoAuth) && (demoPersist === undefined || flagDisabled(demoPersist))) {
    return false;
  }
  if (flagDisabled(demoAuth) || flagDisabled(demoPersist)) return false;
  return !isProductionRuntime();
}

export function hasProductionLicenseKey(): boolean {
  const key = (read("MEDORA_LICENSE_KEY") ?? read("VITE_MEDORA_LICENSE_KEY") ?? "").trim();
  return key.length >= 16;
}

/**
 * In production: demo auth must be off AND a commercial license key must be set.
 * Non-production: always ok (evaluation / local demos allowed).
 */
export function checkProductionBoot(): ProductionBootResult {
  if (!isProductionRuntime()) return { ok: true };

  const errors: string[] = [];
  if (isDemoAuthEnabledInEnv()) {
    errors.push(
      "Demo auth/persist is enabled in production (VITE_ALLOW_DEMO_AUTH / ALLOW_DEMO_PERSIST). Set both to false.",
    );
  }
  if (!hasProductionLicenseKey()) {
    errors.push(
      "MEDORA_LICENSE_KEY (or VITE_MEDORA_LICENSE_KEY) missing or shorter than 16 chars.",
    );
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/** Throws if production boot is unsafe — use at the top of critical API handlers. */
export function assertProductionBootSafe(): void {
  const result = checkProductionBoot();
  if (!result.ok) {
    throw new Error(`Medora refused to boot in production: ${result.errors.join(" ")}`);
  }
}

export function productionBootHttpResponse(): Response | null {
  const result = checkProductionBoot();
  if (result.ok) return null;
  return new Response(
    JSON.stringify({
      ok: false,
      error: "production_boot_blocked",
      errors: result.errors,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
}
