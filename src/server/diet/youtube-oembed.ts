const oembedCache = new Map<string, boolean>();

/** Verify a YouTube video exists — free oEmbed, no search API quota. */
export async function verifyYoutubeVideoId(videoId: string): Promise<boolean> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return false;
  if (oembedCache.has(videoId)) return oembedCache.get(videoId)!;

  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const ok = res.ok;
    oembedCache.set(videoId, ok);
    return ok;
  } catch {
    oembedCache.set(videoId, false);
    return false;
  }
}

/** Filter to only embeddable, real videos. */
export async function filterVerifiedVideoIds(videoIds: string[]): Promise<string[]> {
  const results = await Promise.all(
    videoIds.map(async (id) => ((await verifyYoutubeVideoId(id)) ? id : null)),
  );
  return results.filter((id): id is string => !!id);
}
