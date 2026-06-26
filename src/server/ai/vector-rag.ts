import { buildKnowledgeIndex } from "@/lib/ai/knowledge-index";
import type { KnowledgeChunk } from "@/lib/ai/types";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { embedText, embedTexts } from "./embeddings";

let syncInFlight: Promise<void> | null = null;

function chunkHash(chunk: KnowledgeChunk): string {
  return `${chunk.id}:${chunk.title}:${chunk.body}`.length.toString(36);
}

export async function syncKnowledgeToVectorStore(): Promise<{ synced: number; skipped: boolean }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { synced: 0, skipped: true };

  if (syncInFlight) {
    await syncInFlight;
    return { synced: 0, skipped: false };
  }

  syncInFlight = (async () => {
    const chunks = buildKnowledgeIndex();
    const { count } = await admin
      .from("ai_knowledge_chunks")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) >= chunks.length) return;

    const texts = chunks.map((c) => `${c.title}\n${c.body}\n${c.keywords.join(" ")}`);
    const embeddings = await embedTexts(texts);

    const rows = chunks
      .map((chunk, i) => {
        const embedding = embeddings[i];
        if (!embedding) return null;
        return {
          id: chunk.id,
          category: chunk.category,
          title: chunk.title,
          body: chunk.body,
          keywords: chunk.keywords,
          link_to: chunk.to ?? null,
          embedding,
          content_hash: chunkHash(chunk),
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length === 0) return;

    await admin.from("ai_knowledge_chunks").upsert(rows, { onConflict: "id" });
  })();

  try {
    await syncInFlight;
    const chunks = buildKnowledgeIndex();
    return { synced: chunks.length, skipped: false };
  } finally {
    syncInFlight = null;
  }
}

export async function vectorSearchKnowledge(
  query: string,
  limit = 8,
): Promise<KnowledgeChunk[]> {
  if (!isSupabaseAdminConfigured()) return [];

  await syncKnowledgeToVectorStore();

  const queryEmbedding = await embedText(query);
  if (!queryEmbedding) return [];

  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin.rpc("match_ai_knowledge", {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_category: null,
  });

  if (error || !data) return [];

  return (data as Array<{
    id: string;
    category: string;
    title: string;
    body: string;
    keywords: string[];
    link_to: string | null;
  }>).map((row) => ({
    id: row.id,
    category: row.category as KnowledgeChunk["category"],
    title: row.title,
    body: row.body,
    keywords: row.keywords ?? [],
    to: row.link_to ?? undefined,
  }));
}

export async function retrieveRagContextAsync(query: string, limit = 6): Promise<KnowledgeChunk[]> {
  const vectorHits = await vectorSearchKnowledge(query, limit);
  if (vectorHits.length > 0) return vectorHits;

  const { semanticSearch } = await import("@/lib/ai/semantic-search");
  return semanticSearch(query, limit).map((h) => h.chunk);
}
