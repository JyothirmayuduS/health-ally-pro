import type { CachedMediaBundle } from "@/server/diet/media-cache";
import {
  readBundleFromDb,
  readImageFromDb,
  readVideosFromDb,
  writeBundleToDb,
  writeImageToDb,
  writeVideosToDb,
} from "@/server/diet/media-cache-db";

export const MEDIA_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadMediaBundle(
  fingerprint: string,
  language: string,
  memory?: CachedMediaBundle,
): Promise<CachedMediaBundle | undefined> {
  if (memory) return memory;
  return readBundleFromDb(fingerprint, language);
}

export async function persistMediaBundle(
  fingerprint: string,
  language: string,
  bundle: CachedMediaBundle,
): Promise<void> {
  await writeBundleToDb(fingerprint, language, bundle, MEDIA_CACHE_TTL_MS);
}

export async function loadVideos<T>(
  key: string,
  language: string,
  memory?: T,
): Promise<T | undefined> {
  if (memory) return memory;
  return readVideosFromDb<T>(key, language);
}

export async function persistVideos<T>(
  key: string,
  language: string,
  videos: T,
): Promise<void> {
  await writeVideosToDb(key, language, videos, MEDIA_CACHE_TTL_MS);
}

export async function loadImage(key: string, memory?: string): Promise<string | undefined> {
  if (memory) return memory;
  return readImageFromDb(key);
}

export async function persistImage(key: string, url: string): Promise<void> {
  await writeImageToDb(key, url, MEDIA_CACHE_TTL_MS);
}
