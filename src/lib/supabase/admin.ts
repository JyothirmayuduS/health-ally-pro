import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env[key]) return process.env[key];
  return undefined;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey || serviceKey === "your-service-role-key") return null;

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export function isSupabaseAdminConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}
