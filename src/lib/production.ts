/**
 * Production readiness flags — client-safe (VITE_*) and shared helpers.
 * Demo auth / mock data must be explicit in production builds.
 */

export function isProdBuild(): boolean {
  return import.meta.env.PROD === true;
}

/** Allow hardcoded demo logins (doctor@oakhaven.demo, etc.). Default: on in dev, off in prod unless set. */
export function allowDemoAuth(): boolean {
  const flag = import.meta.env.VITE_ALLOW_DEMO_AUTH;
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return !isProdBuild();
}

/** Prefer mock / localStorage clinical stores when Supabase is not configured. */
export function allowClientMockData(): boolean {
  const flag = import.meta.env.VITE_ALLOW_CLIENT_MOCKS;
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return !isProdBuild();
}

export function appEnvironment(): "development" | "staging" | "production" {
  const env = (import.meta.env.VITE_APP_ENV as string | undefined)?.toLowerCase();
  if (env === "staging" || env === "production" || env === "development") return env;
  return isProdBuild() ? "production" : "development";
}

export function productionReadinessWarnings(): string[] {
  const warnings: string[] = [];
  if (isProdBuild() && allowDemoAuth()) {
    warnings.push("Demo auth is enabled in a production build (VITE_ALLOW_DEMO_AUTH).");
  }
  if (isProdBuild() && allowClientMockData()) {
    warnings.push("Client mock/localStorage clinical data is allowed in production.");
  }
  if (isProdBuild() && !import.meta.env.VITE_SUPABASE_URL) {
    warnings.push("VITE_SUPABASE_URL is missing.");
  }
  if (isProdBuild() && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    warnings.push("VITE_SUPABASE_ANON_KEY is missing.");
  }
  return warnings;
}
