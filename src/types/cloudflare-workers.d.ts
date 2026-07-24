/** Ambient types for the real Cloudflare Workers module (production / wrangler). */
declare module "cloudflare:workers" {
  export function waitUntil(promise: Promise<unknown>): void;
  export const env: Record<string, unknown>;
}
