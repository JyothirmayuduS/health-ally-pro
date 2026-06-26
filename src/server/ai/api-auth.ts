export function verifyMedoraApiKey(request: Request): boolean {
  const expected = process.env.MEDORA_AI_API_KEY;
  if (!expected) return true;
  const key = request.headers.get("x-medora-ai-key");
  return key === expected;
}

/** Allow same-origin browser requests from the patient web app (no API key header). */
export function verifyPatientWebAiRequest(request: Request): boolean {
  if (verifyMedoraApiKey(request)) return true;

  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "same-site") return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      /* ignore */
    }
  }

  const referer = request.headers.get("referer");
  if (referer && host && referer.includes(host)) return true;

  return false;
}

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed =
    process.env.MEDORA_AI_CORS_ORIGIN ??
    process.env.EXPO_PUBLIC_MEDORA_API_URL ??
    "*";

  return {
    "Access-Control-Allow-Origin": origin && allowed !== "*" ? origin : allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-medora-ai-key",
  };
}

export function jsonResponse(data: unknown, init?: ResponseInit & { cors?: boolean }) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.cors !== false) {
    for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function unauthorizedResponse() {
  return jsonResponse({ error: "Unauthorized" }, { status: 401 });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
