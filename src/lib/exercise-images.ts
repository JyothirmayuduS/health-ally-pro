import type { ExerciseCategory, ExerciseRoutine } from "@/lib/exercise-mock-data";

/** Curated Unsplash photos — warm, clinical-wellness tone matching Medora palette */
const ROUTINE_IMAGES: Record<string, string> = {
  "ex-walk-am":
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
  "ex-neck":
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
  "ex-breath":
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  "ex-sunwalk":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
  "ex-evening-stretch":
    "https://images.unsplash.com/photo-1545205597-3b9d02c29597?auto=format&fit=crop&w=800&q=80",
  "ex-low-impact":
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?auto=format&fit=crop&w=800&q=80",
  "ex-ankle":
    "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80",
  "ex-core-gentle":
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
  "ex-balance":
    "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80",
  "ex-relax":
    "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=800&q=80",
};

const CATEGORY_FALLBACK: Record<ExerciseCategory, string> = {
  mobility:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
  cardio:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
  strength:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  breathing:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  recovery:
    "https://images.unsplash.com/photo-1545205597-3b9d02c29597?auto=format&fit=crop&w=800&q=80",
};

export function getExerciseImageUrl(routine: Pick<ExerciseRoutine, "id" | "category">): string {
  return ROUTINE_IMAGES[routine.id] ?? CATEGORY_FALLBACK[routine.category];
}
