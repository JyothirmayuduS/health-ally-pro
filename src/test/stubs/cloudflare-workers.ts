/** Vitest / Node stub for `cloudflare:workers` — MUST NOT ship in production bundles. */
export function waitUntil(promise: Promise<unknown>): void {
  void promise.catch(() => {});
}

/** Marker so production code can detect this no-op and refuse silent loss. */
(waitUntil as { __medoraNoOpWaitUntil?: boolean }).__medoraNoOpWaitUntil = true;

export const env = {};
