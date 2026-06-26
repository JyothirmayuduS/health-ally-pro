type CacheEntry<T> = { value: T; expiresAt: number };

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const videoCache = new Map<string, CacheEntry<unknown>>();
const imageCache = new Map<string, CacheEntry<unknown>>();
const mediaBundleCache = new Map<string, CacheEntry<unknown>>();

function cacheKey(parts: string[]): string {
  return parts.join("::");
}

export function getCachedVideos<T>(key: string, language: string): T | undefined {
  const entry = videoCache.get(cacheKey(["videos", key, language]));
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.value as T;
}

export function setCachedVideos<T>(key: string, language: string, value: T): void {
  videoCache.set(cacheKey(["videos", key, language]), {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getCachedImage(key: string): string | undefined {
  const entry = imageCache.get(cacheKey(["image", key]));
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.value as string;
}

export function setCachedImage(key: string, url: string): void {
  imageCache.set(cacheKey(["image", key]), {
    value: url,
    expiresAt: Date.now() + TTL_MS,
  });
}

export type CachedMediaBundle = {
  imageUrl: string | null;
  videos: unknown[];
  source: string;
};

export function getCachedMediaBundle(
  fingerprint: string,
  language: string,
): CachedMediaBundle | undefined {
  const entry = mediaBundleCache.get(cacheKey(["bundle", fingerprint, language]));
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.value as CachedMediaBundle;
}

export function setCachedMediaBundle(
  fingerprint: string,
  language: string,
  bundle: CachedMediaBundle,
): void {
  mediaBundleCache.set(cacheKey(["bundle", fingerprint, language]), {
    value: bundle,
    expiresAt: Date.now() + TTL_MS,
  });
}

export { TTL_MS as MEDIA_MEMORY_TTL_MS };
