/** Extract allergen substance names from chart allergy text (e.g. "Do not prescribe — Aspirin" → ["Aspirin"]). */
export function parseAllergieSubstances(allergyWarning?: string): string[] {
  if (!allergyWarning?.trim()) return [];

  const emDash = allergyWarning.split(/\s*[—–]\s*/);
  if (emDash.length > 1) {
    const substance = emDash[emDash.length - 1]!.trim();
    if (substance) {
      return substance
        .split(/,\s*|\s+and\s+/i)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const cleaned = allergyWarning
    .replace(/^do not prescribe without review\s*[-—]?\s*/i, "")
    .replace(/^allergy:\s*/i, "")
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(/,\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatAllergieList(substances: string[]): string {
  return substances.join(", ");
}
