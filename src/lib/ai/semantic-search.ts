import { buildKnowledgeIndex } from "./knowledge-index";
import type { KnowledgeChunk, SemanticSearchHit } from "./types";

const MEDICAL_SYNONYMS: Record<string, string[]> = {
  hypertension: ["htn", "bp", "blood pressure", "high blood pressure"],
  diabetes: ["dm", "t2dm", "sugar", "glucose", "diabetic"],
  asthma: ["wheeze", "copd", "breathing", "inhaler"],
  antibiotic: ["amoxicillin", "azithromycin", "infection", "abx"],
  pain: ["analgesic", "paracetamol", "ibuprofen", "nsaid"],
  heart: ["cardiac", "cardiology", "pci", "statin", "aspirin"],
  lab: ["blood test", "pathology", "cbc", "lipid"],
  radiology: ["imaging", "xray", "ct", "mri", "scan"],
  billing: ["invoice", "payment", "revenue", "finance"],
  bed: ["ipd", "admission", "ward", "inpatient"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function expandTokens(tokens: string[]): Set<string> {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const [key, syns] of Object.entries(MEDICAL_SYNONYMS)) {
      if (token.includes(key) || syns.some((s) => token.includes(s))) {
        expanded.add(key);
        syns.forEach((s) => expanded.add(s));
      }
    }
  }
  return expanded;
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: Set<string>, rawQuery: string): number {
  const q = rawQuery.toLowerCase();
  let score = 0;

  const title = chunk.title.toLowerCase();
  const body = chunk.body.toLowerCase();
  const haystack = `${title} ${body} ${chunk.keywords.join(" ").toLowerCase()}`;

  if (title.includes(q) || q.includes(title)) score += 12;
  if (chunk.keywords.some((k) => k.toLowerCase().includes(q))) score += 10;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 4;
    if (body.includes(token)) score += 2;
    if (chunk.keywords.some((k) => k.toLowerCase().includes(token))) score += 3;
  }

  const categoryBoost: Partial<Record<KnowledgeChunk["category"], number>> = {
    patient: 1.2,
    drug: 1.15,
    nav: 1.1,
  };
  score *= categoryBoost[chunk.category] ?? 1;

  return score;
}

export function semanticSearch(query: string, limit = 12): SemanticSearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const tokens = expandTokens(tokenize(q));
  const index = buildKnowledgeIndex();

  const hits = index
    .map((chunk) => {
      const score = scoreChunk(chunk, tokens, q);
      return { chunk, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return hits.map((h) => ({
    ...h,
    matchReason:
      h.chunk.category === "drug"
        ? "Formulary match"
        : h.chunk.category === "patient"
          ? "Patient record"
          : h.chunk.category === "nav"
            ? "Quick navigation"
            : undefined,
  }));
}

export function semanticSearchToLegacy(query: string, limit = 12) {
  return semanticSearch(query, limit)
    .filter((h) => h.chunk.to)
    .map((h) => ({
      type: h.chunk.category,
      id: h.chunk.id,
      label: h.chunk.title,
      sub: h.matchReason ? `${h.chunk.category} · ${h.matchReason}` : h.chunk.body.slice(0, 60),
      to: h.chunk.to!,
      score: h.score,
      aiEnhanced: true as const,
    }));
}
