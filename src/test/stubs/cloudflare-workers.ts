/** Vitest stub for cloudflare:workers */
export function waitUntil(promise: Promise<unknown>): void {
  void promise.catch(() => {});
}

export const env = {};
