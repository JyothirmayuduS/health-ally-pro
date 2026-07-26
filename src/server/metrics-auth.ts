/**
 * Metrics endpoint access control — bearer token only.
 * Token is injected at runtime (compose/env/Wrangler secret), never baked into the image.
 * No PHI in this module.
 */

function readEnv(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

/** Returns an HTTP error Response when the caller is not authorized; null when OK. */
export function authorizeMetricsRequest(request: Request): Response | null {
  const expected = (readEnv("METRICS_BEARER_TOKEN") ?? "").trim();
  if (!expected) {
    // Fail closed when no token is configured — prevents accidental public exposure.
    return new Response(
      JSON.stringify({
        ok: false,
        error: "metrics_token_not_configured",
        message: "Set METRICS_BEARER_TOKEN at runtime to enable scraping.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  const presented = match?.[1]?.trim() ?? "";
  if (!presented || presented !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "WWW-Authenticate": 'Bearer realm="medora-metrics"',
      },
    });
  }
  return null;
}
