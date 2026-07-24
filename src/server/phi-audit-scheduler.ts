/**
 * Resolves Cloudflare waitUntil without allowing silent no-op scheduling in production.
 * The Vitest stub sets `__medoraNoOpWaitUntil` — production builds must import the real
 * `cloudflare:workers` module (never via tsconfig paths).
 */
import { waitUntil as cfWaitUntil } from "cloudflare:workers";

export type WaitUntilImplementation = "cloudflare" | "noop_stub" | "missing" | "invalid";

export type WaitUntilInspection = {
  present: boolean;
  implementation: WaitUntilImplementation;
  waitUntil: ((promise: Promise<unknown>) => void) | null;
};

type WaitUntilFn = ((promise: Promise<unknown>) => void) & {
  __medoraNoOpWaitUntil?: boolean;
};

export function isProductionAuditRuntime(): boolean {
  // Never treat the Vitest process as production audit runtime.
  if (process.env.VITEST === "true" || process.env.VITEST === "1") {
    if (process.env.MEDORA_FORCE_PRODUCTION_AUDIT_RUNTIME === "1") return true;
    return false;
  }
  const medora = (process.env.MEDORA_BUILD_ENVIRONMENT || "").toLowerCase();
  if (medora === "production") return true;
  if (medora === "staging" || medora === "development" || medora === "test") return false;
  return (process.env.NODE_ENV || "").toLowerCase() === "production";
}

export function diagnosticModeEnabled(): boolean {
  if (isProductionAuditRuntime()) return false;
  const v = process.env.PHI_AUDIT_DIAGNOSTIC_MODE;
  return v === "1" || v === "true";
}

export function inspectWaitUntil(): WaitUntilInspection {
  const fn = cfWaitUntil as WaitUntilFn | undefined;
  if (typeof fn !== "function") {
    return { present: false, implementation: "missing", waitUntil: null };
  }
  if (fn.__medoraNoOpWaitUntil === true) {
    return { present: true, implementation: "noop_stub", waitUntil: null };
  }
  return {
    present: true,
    implementation: "cloudflare",
    waitUntil: (promise) => fn(promise),
  };
}

export function getPhiAuditSchedulerHealth(): {
  ok: boolean;
  wait_until_present: boolean;
  wait_until_type: WaitUntilImplementation;
  no_op_fallback: boolean;
  production_runtime: boolean;
  reason?: string;
} {
  const inspected = inspectWaitUntil();
  const production = isProductionAuditRuntime();
  const noOp = inspected.implementation === "noop_stub" || inspected.implementation === "missing";
  if (production && noOp) {
    return {
      ok: false,
      wait_until_present: inspected.present,
      wait_until_type: inspected.implementation,
      no_op_fallback: true,
      production_runtime: true,
      reason: "production_waituntil_unavailable",
    };
  }
  return {
    ok: inspected.implementation === "cloudflare" || !production,
    wait_until_present: inspected.present,
    wait_until_type: inspected.implementation,
    no_op_fallback: inspected.implementation === "noop_stub",
    production_runtime: production,
  };
}
