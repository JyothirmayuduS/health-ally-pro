/**
 * Local ES256 JWT verification via Supabase Auth JWKS.
 * Avoids Auth getUser round-trip on the hot path; falls back to getUser on failure.
 * Does not weaken issuer/exp/signature checks — same access-token trust model as short-lived auth cache.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type VerifiedAccessToken = {
  userId: string;
  email: string | null;
  role: string | null;
};

type JwksCache = {
  url: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
};

let jwksCache: JwksCache | null = null;

function supabaseUrl(): string | null {
  const u =
    (typeof process !== "undefined" &&
      (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
    undefined;
  return u?.replace(/\/$/, "") || null;
}

function getJwks() {
  const base = supabaseUrl();
  if (!base) return null;
  const url = `${base}/auth/v1/.well-known/jwks.json`;
  if (jwksCache?.url === url) return jwksCache.jwks;
  const jwks = createRemoteJWKSet(new URL(url));
  jwksCache = { url, jwks };
  return jwks;
}

function expectedIssuer(): string | null {
  const base = supabaseUrl();
  return base ? `${base}/auth/v1` : null;
}

/** Test-only */
export function __resetSupabaseJwksCacheForTests() {
  jwksCache = null;
}

/**
 * Cryptographically verify a Supabase access token using JWKS.
 * Returns null when verification fails (caller should fall back to auth.getUser).
 */
export async function verifySupabaseAccessToken(
  token: string,
): Promise<VerifiedAccessToken | null> {
  const jwks = getJwks();
  const issuer = expectedIssuer();
  if (!jwks || !issuer) return null;

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      algorithms: ["ES256", "RS256"],
    });
    return claimsToUser(payload);
  } catch {
    return null;
  }
}

function claimsToUser(payload: JWTPayload): VerifiedAccessToken | null {
  const userId = typeof payload.sub === "string" ? payload.sub : null;
  if (!userId) return null;
  const role = typeof payload.role === "string" ? payload.role : null;
  if (role && role !== "authenticated" && role !== "service_role") {
    // Reject unexpected roles; service_role should not arrive as user bearer.
    if (role === "anon") return null;
  }
  if (role === "service_role") return null;
  const email =
    typeof payload.email === "string"
      ? payload.email
      : typeof (payload as { user_metadata?: { email?: string } }).user_metadata?.email ===
          "string"
        ? (payload as { user_metadata: { email: string } }).user_metadata.email
        : null;
  return { userId, email, role };
}
