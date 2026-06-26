import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { CachedMediaBundle } from "@/server/diet/media-cache";

type CacheType = "bundle" | "videos" | "image";

function dbKey(parts: string[]): string {
  return parts.join("::");
}

export async function readMediaCacheFromDb<T>(
  cacheKey: string,
  cacheType: CacheType,
  language: string | null,
): Promise<T | undefined> {
  if (!isSupabaseAdminConfigured()) return undefined;

  const admin = getSupabaseAdmin()!;
  let query = admin
    .from("diet_meal_media_cache")
    .select("payload, expires_at")
    .eq("cache_key", cacheKey)
    .eq("cache_type", cacheType);

  query =
    language === null ? query.is("language", null) : query.eq("language", language);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return undefined;
  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    let del = admin
      .from("diet_meal_media_cache")
      .delete()
      .eq("cache_key", cacheKey)
      .eq("cache_type", cacheType);
    del = language === null ? del.is("language", null) : del.eq("language", language);
    void del;
    return undefined;
  }

  return data.payload as T;
}

export async function writeMediaCacheToDb(
  cacheKey: string,
  cacheType: CacheType,
  language: string | null,
  payload: unknown,
  ttlMs: number,
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const admin = getSupabaseAdmin()!;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  await admin.from("diet_meal_media_cache").upsert(
    {
      cache_key: cacheKey,
      cache_type: cacheType,
      language,
      payload,
      expires_at: expiresAt,
    },
    { onConflict: "cache_key,cache_type,language" },
  );
}

export async function readBundleFromDb(
  fingerprint: string,
  language: string,
): Promise<CachedMediaBundle | undefined> {
  return readMediaCacheFromDb<CachedMediaBundle>(
    dbKey(["bundle", fingerprint, language]),
    "bundle",
    language,
  );
}

export async function writeBundleToDb(
  fingerprint: string,
  language: string,
  bundle: CachedMediaBundle,
  ttlMs: number,
): Promise<void> {
  await writeMediaCacheToDb(
    dbKey(["bundle", fingerprint, language]),
    "bundle",
    language,
    bundle,
    ttlMs,
  );
}

export async function readVideosFromDb<T>(
  key: string,
  language: string,
): Promise<T | undefined> {
  return readMediaCacheFromDb<T>(dbKey(["videos", key, language]), "videos", language);
}

export async function writeVideosToDb<T>(
  key: string,
  language: string,
  videos: T,
  ttlMs: number,
): Promise<void> {
  await writeMediaCacheToDb(
    dbKey(["videos", key, language]),
    "videos",
    language,
    videos,
    ttlMs,
  );
}

export async function readImageFromDb(key: string): Promise<string | undefined> {
  return readMediaCacheFromDb<string>(dbKey(["image", key]), "image", null);
}

export async function writeImageToDb(
  key: string,
  url: string,
  ttlMs: number,
): Promise<void> {
  await writeMediaCacheToDb(dbKey(["image", key]), "image", null, url, ttlMs);
}
