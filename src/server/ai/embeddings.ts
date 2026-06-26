import { getServerAiEnv } from "./env";

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIM = 768;

export function embeddingDimensions() {
  return EMBEDDING_DIM;
}

export async function embedText(text: string): Promise<number[] | null> {
  const env = getServerAiEnv();
  if (!env.geminiApiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${env.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.slice(0, 8000) }] },
        }),
      },
    );

    if (!response.ok) return null;
    const json = (await response.json()) as { embedding?: { values?: number[] } };
    const values = json.embedding?.values;
    if (!values || values.length !== EMBEDDING_DIM) return null;
    return values;
  } catch {
    return null;
  }
}

export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = [];
  for (const text of texts) {
    results.push(await embedText(text));
    await new Promise((r) => setTimeout(r, 80));
  }
  return results;
}
