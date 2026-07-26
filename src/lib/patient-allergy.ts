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

  if (!cleaned || cleaned === "—") return [];

  return cleaned
    .split(/,\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatAllergieList(substances: string[]): string {
  return substances.join(", ");
}

/**
 * Prefer structured patient_allergies rows; fall back to legacy allergy string.
 * Keeps prescription / vaccination safety checks working across migration.
 */
export function resolveAllergySubstances(input: {
  structured?: Array<{ substance?: string | null; status?: string | null; archived_at?: string | null }>;
  legacyWarning?: string | null;
}): string[] {
  const fromStructured = (input.structured ?? [])
    .filter((a) => (a.status ?? "active") === "active" && !a.archived_at)
    .map((a) => (a.substance ?? "").trim())
    .filter(Boolean);
  if (fromStructured.length) return fromStructured;
  return parseAllergieSubstances(input.legacyWarning ?? undefined);
}
