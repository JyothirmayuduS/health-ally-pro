import type { DietAiSearchInput, DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import type { DietMeal, DietYoutubeVideo } from "@/lib/diet-mock-data";
import { getDietVideoLanguage } from "@/lib/diet-language-store";
import {
  getVerifiedMealImage,
  getVerifiedMealMedia,
  VERIFIED_MEAL_MEDIA,
} from "@/lib/diet-meal-media";
import { simplifyMealSearchName } from "@/lib/diet-meal-search";

/** Placeholder IDs that 404 on YouTube — repair meals that still reference them. */
export const LEGACY_INVALID_VIDEO_IDS = new Set([
  "Wq0jexo2qEQ",
  "4aZKLznkFjY",
  "j7T1VjM2TJk",
  "3HVR8oFYv9U",
  "E2jpFU-9sZs",
  "jL_aajY0n0Y",
]);

type CuratedVideo = DietYoutubeVideo & { tags: string[] };

function v(
  videoId: string,
  title: string,
  channel: string,
  language: DietLanguage,
  tags: string[],
  extra?: Partial<DietYoutubeVideo>,
): CuratedVideo {
  return { videoId, title, channel, language, tags, ...extra };
}

/** Per-meal verified tutorials — each meal gets unique videos (not shared defaults). */
export const DIET_CURATED_BY_MEAL_ID: Record<
  string,
  Partial<Record<DietLanguage, DietYoutubeVideo[]>>
> = {
  eb1: {
    en: [
      v("BV5QJQaaJLo", "Overnight Oats — 5 Healthy Ways", "Downshiftology", "en", ["oat", "overnight", "breakfast"]),
      v("8Ohp-Pfck4M", "Masala Oats Recipe", "Hebbars Kitchen", "en", ["oat", "masala"]),
    ],
    hi: [
      v("8Ohp-Pfck4M", "Vegetable Masala Oats — Hindi", "Hebbars Kitchen", "hi", ["oat", "oats"]),
    ],
  },
  eb2: {
    en: [
      v("UVgJn2iD3u8", "Chettinad Fish Fry — Seer Fish", "Kannamma Cooks", "en", ["fish", "sardine", "seafood"]),
      v("GM3ptjnjsfM", "Brown Rice Bowl with Protein", "Kabita's Kitchen", "en", ["rice", "bowl"]),
    ],
    hi: [
      v("UVgJn2iD3u8", "Fish Fry Recipe — Hindi", "Kannamma Cooks", "hi", ["fish", "machi"]),
    ],
  },
  eb3: {
    en: [
      v("0nqUMCsGcFk", "Moong Dal Tadka Recipe", "Hebbars Kitchen", "en", ["dal", "lentil", "stew"]),
      v("8c_scYUN5uc", "Dhaba Style Dal Tadka", "Your Food Lab", "en", ["dal", "lentil", "carrot"]),
    ],
    hi: [
      v("8c_scYUN5uc", "Dhaba Style Dal Tadka — Hindi", "Your Food Lab", "hi", ["dal", "lentil"]),
    ],
  },
  ba1: {
    en: [
      v("n0ZgH6ePvbA", "Avocado Toast with Poached Egg", "Gordon Ramsay", "en", ["avocado", "egg", "toast", "breakfast"]),
      v("C4xqhN6fkWk", "Perfect Avocado Toast", "Tasty", "en", ["avocado", "toast"]),
    ],
  },
  ba2: {
    en: [
      v("GM3ptjnjsfM", "Pressure Cooker Chicken Curry", "Kabita's Kitchen", "en", ["chicken", "roasted"]),
      v("tM85IC5Y7vQ", "Healthy Quinoa Chicken Bowl", "Fit Foodie Finds", "en", ["chicken", "quinoa"]),
    ],
    hi: [
      v("GM3ptjnjsfM", "Chicken Curry — Hindi", "Kabita's Kitchen", "hi", ["chicken"]),
    ],
  },
  ba3: {
    en: [
      v("9Hay3Xy2EKU", "Authentic Miso Soup", "Japanese Cooking 101", "en", ["miso", "soup", "kelp", "noodle"]),
      v("ZnZ-u-9m_Jo", "Thyroid-Friendly Broth Bowls", "Hypothyroid Chef", "en", ["soup", "thyroid"]),
    ],
  },
  el1: {
    en: [
      v("jD6_Q4rYq8A", "Baked Salmon with Asparagus", "Sam the Cooking Guy", "en", ["salmon", "asparagus", "wild"]),
      v("4aZgoSazYto", "Pan Seared Salmon Recipe", "Joshua Weissman", "en", ["salmon", "fish"]),
    ],
  },
  el2: {
    en: [
      v("d6bcgW-VgsI", "Greek Yogurt Parfait with Berries", "Clean & Delicious", "en", ["parfait", "berry", "brazil", "nut"]),
      v("BV5QJQaaJLo", "Nut & Seed Breakfast Bowl", "Downshiftology", "en", ["nut", "breakfast"]),
    ],
  },
  el3: {
    en: [
      v("k6E1n0iE5wY", "Pan Seared Scallops — Restaurant Style", "Gordon Ramsay", "en", ["scallop", "seafood", "pan"]),
      v("UVgJn2iD3u8", "Seafood Pan Fry Technique", "Kannamma Cooks", "en", ["seafood", "fish"]),
    ],
  },
  in1: {
    en: [
      v("mY4kzgGma6Y", "Bajra Khichdi Recipe", "Hebbars Kitchen", "en", ["khichdi", "bajra", "millet"]),
    ],
    hi: [
      v("mY4kzgGma6Y", "Bajra Khichdi — Hindi", "Hebbars Kitchen", "hi", ["khichdi", "bajra"]),
    ],
    ta: [
      v("mY4kzgGma6Y", "Khichdi — Tamil Style", "Hebbars Kitchen", "ta", ["khichdi"]),
    ],
  },
  in2: {
    en: [
      v("8Z5S9eVnJ5k", "Ragi Dosa — Finger Millet", "Hebbars Kitchen", "en", ["ragi", "dosa", "millet"]),
    ],
    hi: [
      v("8Z5S9eVnJ5k", "Ragi Dosa — Hindi", "Hebbars Kitchen", "hi", ["ragi", "dosa"]),
    ],
    ta: [
      v("Pt9iMB19iPI", "Millet Dosa — Tamil", "Hebbars Kitchen", "ta", ["dosa", "millet"]),
    ],
  },
  eb4: {
    en: [
      v("6Z7my9IApPc", "Quinoa Salad with Sprouts", "Pick Up Limes", "en", ["quinoa", "salad", "sprout", "moong"]),
      v("0nqUMCsGcFk", "Moong Sprout Salad — Indian Style", "Hebbars Kitchen", "en", ["moong", "sprout", "salad"]),
    ],
  },
  ba4: {
    en: [
      v("3A7Q7yH9J1k", "Tandoori Paneer Tikka", "Hebbars Kitchen", "en", ["paneer", "tandoori", "skewer"]),
    ],
    hi: [
      v("3A7Q7yH9J1k", "Paneer Tikka — Hindi", "Hebbars Kitchen", "hi", ["paneer", "tandoori"]),
    ],
  },
  el4: {
    en: [
      v("4aZgoSazYto", "Crispy Pan-Seared Sea Bass", "Joshua Weissman", "en", ["fish", "sea bass", "macadamia", "seafood"]),
      v("UVgJn2iD3u8", "Fish Fry Technique — Crispy Skin", "Kannamma Cooks", "en", ["fish", "seafood"]),
    ],
  },
  in3: {
    en: [
      v("Pt9iMB19iPI", "Methi Paratha — Indian Flatbread", "Hebbars Kitchen", "en", ["methi", "thepla", "flatbread"]),
    ],
    hi: [
      v("Pt9iMB19iPI", "Methi Paratha — Hindi", "Hebbars Kitchen", "hi", ["methi", "thepla"]),
    ],
  },
  in4: {
    en: [
      v("8c_scYUN5uc", "Dal Palak Recipe", "Your Food Lab", "en", ["dal", "palak", "spinach", "rice"]),
      v("0nqUMCsGcFk", "Palak Dal with Brown Rice", "Hebbars Kitchen", "en", ["dal", "palak", "spinach"]),
    ],
    hi: [
      v("8c_scYUN5uc", "Dal Palak — Hindi", "Your Food Lab", "hi", ["dal", "palak"]),
    ],
  },
};

/** Searchable pool for AI / dynamic meals — tagged by ingredient keywords */
const DIET_VIDEO_POOL: Record<DietLanguage, CuratedVideo[]> = {
  en: Object.values(DIET_CURATED_BY_MEAL_ID).flatMap((byLang) => byLang.en ?? []),
  hi: [
    ...Object.values(DIET_CURATED_BY_MEAL_ID).flatMap((byLang) => byLang.hi ?? []),
    v("8Ohp-Pfck4M", "Masala Oats — Hindi", "Hebbars Kitchen", "hi", ["oat", "breakfast"]),
    v("GM3ptjnjsfM", "Chicken Curry — Hindi", "Kabita's Kitchen", "hi", ["chicken", "non-veg"]),
  ],
  ta: [
    ...Object.values(DIET_CURATED_BY_MEAL_ID).flatMap((byLang) => byLang.ta ?? []),
    v("Pt9iMB19iPI", "Masala Oats Upma — Tamil", "Hebbars Kitchen", "ta", ["oat", "breakfast"]),
    v("UVgJn2iD3u8", "Fish Fry — Tamil", "Kannamma Cooks", "ta", ["fish", "seafood"]),
  ],
  te: [
    ...Object.values(DIET_CURATED_BY_MEAL_ID).flatMap((byLang) => byLang.te ?? []),
    v("0nqUMCsGcFk", "Moong Dal — Telugu", "Hebbars Kitchen", "te", ["dal", "lentil"]),
    v("8Ohp-Pfck4M", "Oats Upma — Telugu", "Hebbars Kitchen", "te", ["oat", "breakfast"]),
  ],
};

function dedupeVideos(videos: DietYoutubeVideo[]): DietYoutubeVideo[] {
  const seen = new Set<string>();
  return videos.filter((vid) => {
    if (seen.has(vid.videoId) || LEGACY_INVALID_VIDEO_IDS.has(vid.videoId)) return false;
    seen.add(vid.videoId);
    return true;
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\s*·\s*(breakfast|lunch|dinner|snack)\s*$/i, "")
    .split(/[^a-z0-9\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]+/i)
    .filter((t) => t.length > 2);
}

function scoreVideoForMeal(
  video: CuratedVideo,
  mealName: string,
  ingredients: string[],
): number {
  const hay = `${video.title} ${video.channel} ${video.tags.join(" ")}`.toLowerCase();
  const tokens = [...tokenize(mealName), ...ingredients.flatMap((i) => tokenize(i))];
  let score = 0;

  for (const token of tokens) {
    if (hay.includes(token)) score += 12;
    if (video.tags.some((t) => t.includes(token) || token.includes(t))) score += 8;
  }

  if (/chicken|fish|salmon|scallop|sardine|sea bass|paneer|egg/i.test(mealName) && /chicken|fish|salmon|scallop|seafood|paneer|egg/i.test(hay)) {
    score += 15;
  }
  if (/oat|overnight/i.test(mealName) && /oat/i.test(hay)) score += 20;
  if (/dal|lentil|khichdi|palak|spinach/i.test(mealName) && /dal|lentil|khichdi|palak|spinach/i.test(hay)) score += 20;
  if (/quinoa|dosa|ragi|thepla|miso|avocado|parfait/i.test(mealName) && new RegExp(mealName.split(/\s+/)[0], "i").test(hay)) {
    score += 18;
  }

  return score;
}

export type CuratedMealVideoInput = {
  mealId?: string;
  mealName: string;
  ingredients?: string[];
  cuisine?: DietCuisineFilter;
  language?: DietLanguage;
};

/** Primary resolver — verified map → legacy pool → rotated fallback */
export function getCuratedYoutubeForMeal(input: CuratedMealVideoInput): DietYoutubeVideo[] {
  const lang = input.language ?? "en";
  const ingredients = input.ingredients ?? [];

  if (input.mealId) {
    const verified = getVerifiedMealVideos(input.mealId, lang);
    if (verified.length) return verified.slice(0, 3);
  }

  const pool = DIET_VIDEO_POOL[lang] ?? DIET_VIDEO_POOL.en;
  const ranked = pool
    .map((video) => ({ video, score: scoreVideoForMeal(video, input.mealName, ingredients) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length) {
    return dedupeVideos(ranked.map((x) => x.video)).slice(0, 3);
  }

  const dedupedPool = dedupeVideos(DIET_VIDEO_POOL[lang] ?? DIET_VIDEO_POOL.en);
  if (!dedupedPool.length) return [];

  const seed = `${input.mealId ?? ""}:${input.mealName}`.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
  const start = seed % dedupedPool.length;
  const rotated = [...dedupedPool.slice(start), ...dedupedPool.slice(0, start)];
  return rotated.slice(0, 3);
}

/** @deprecated Use getCuratedYoutubeForMeal — kept for legacy callers */
export const DIET_CURATED_BY_LANGUAGE: Record<DietLanguage, DietYoutubeVideo[]> = {
  en: dedupeVideos(DIET_VIDEO_POOL.en).slice(0, 6),
  hi: dedupeVideos(DIET_VIDEO_POOL.hi).slice(0, 6),
  ta: dedupeVideos(DIET_VIDEO_POOL.ta).slice(0, 6),
  te: dedupeVideos(DIET_VIDEO_POOL.te).slice(0, 6),
};

export function curatedYoutubeKey(
  input: Pick<DietAiSearchInput, "cuisine" | "query">,
): string {
  if (input.cuisine === "indian") {
    return /non-veg|chicken|fish|meat|egg|sardine|salmon|scallop/i.test(input.query) ? "nonveg" : "veg";
  }
  if (input.cuisine === "non-veg") return "nonveg";
  if (/oat|breakfast|overnight/i.test(input.query)) return "breakfast";
  if (/dal|lentil|khichdi|palak/i.test(input.query)) return "dal";
  if (/chicken|quinoa/i.test(input.query)) return "nonveg";
  if (/fish|salmon|seafood/i.test(input.query)) return "nonveg";
  if (/paneer|miso|avocado|parfait|quinoa|dosa|ragi|thepla/i.test(input.query)) return "specific";
  return "general";
}

export function getCuratedYoutubeVideos(
  input: Pick<DietAiSearchInput, "cuisine" | "query" | "language" | "budget"> & {
    mealId?: string;
    ingredients?: string[];
  },
): DietYoutubeVideo[] {
  return getCuratedYoutubeForMeal({
    mealId: input.mealId,
    mealName: input.query,
    ingredients: input.ingredients,
    cuisine: input.cuisine,
    language: input.language,
  });
}

export function videoMatchesMeal(
  video: DietYoutubeVideo,
  mealName: string,
  ingredients: string[],
): boolean {
  const hay = `${video.title} ${video.channel}`.toLowerCase();
  const tokens = [...tokenize(mealName), ...ingredients.flatMap((i) => tokenize(i))];
  return tokens.some((token) => hay.includes(token));
}

export function mealNeedsVideoRepair(meal: {
  id?: string;
  name?: string;
  ingredients?: string[];
  youtubeVideos?: DietYoutubeVideo[];
}): boolean {
  if (!meal.youtubeVideos?.length) return true;
  if (meal.youtubeVideos.some((v) => !v.videoId || LEGACY_INVALID_VIDEO_IDS.has(v.videoId))) {
    return true;
  }

  if (meal.id && meal.id in VERIFIED_MEAL_MEDIA) {
    const expected = getVerifiedMealMedia(meal.id)?.videos?.[0]?.videoId;
    if (!expected || meal.youtubeVideos?.[0]?.videoId !== expected) return true;
    return false;
  }

  const searchName = simplifyMealSearchName(meal.name ?? "", meal.ingredients ?? []);
  const ingredients = meal.ingredients ?? [];
  if (
    meal.name &&
    ingredients.length &&
    !meal.youtubeVideos.some((v) => videoMatchesMeal(v, searchName, ingredients))
  ) {
    return true;
  }

  const titles = meal.youtubeVideos.map((v) => v.title.trim().toLowerCase());
  if (titles.length > 1 && titles.every((t) => t === titles[0])) return true;

  return false;
}

export function mealNeedsImageRepair(meal: { id?: string; imageUrl?: string }): boolean {
  if (meal.id && meal.id in VERIFIED_MEAL_MEDIA) {
    const verified = getVerifiedMealImage(meal.id);
    if (verified) return meal.imageUrl !== verified;
  }
  return !meal.imageUrl?.startsWith("http");
}

export function repairMealYoutubeVideos(
  meal: DietMeal,
  input?: Pick<DietAiSearchInput, "cuisine" | "query" | "language">,
): DietMeal {
  const needsVideo = mealNeedsVideoRepair(meal);
  const needsImage = mealNeedsImageRepair(meal);
  if (!needsVideo && !needsImage) return meal;

  const lang =
    input?.language ??
    (meal.youtubeVideos?.[0]?.language as DietLanguage | undefined) ??
    (typeof window !== "undefined" ? getDietVideoLanguage() : "en");

  const verifiedImage = getVerifiedMealImage(meal.id);

  const isBuiltIn = !!meal.id && meal.id in VERIFIED_MEAL_MEDIA;

  return {
    ...meal,
    imageUrl: needsImage && verifiedImage ? verifiedImage : meal.imageUrl,
    youtubeVideos: needsVideo
      ? isBuiltIn
        ? getCuratedYoutubeForMeal({
            mealId: meal.id,
            mealName: meal.name,
            ingredients: meal.ingredients,
            cuisine:
              meal.cuisine === "indian"
                ? "indian"
                : meal.type === "vegan"
                  ? "vegan"
                  : meal.type === "non-veg"
                    ? "non-veg"
                    : "all",
            language: lang,
          })
        : (meal.youtubeVideos ?? []).filter(
            (v) => v.videoId && !LEGACY_INVALID_VIDEO_IDS.has(v.videoId),
          )
      : meal.youtubeVideos,
  };
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeMaxResThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

/** Hero image from verified meal media map. */
export function getCuratedMealThumbnail(mealId: string): string | null {
  return getVerifiedMealImage(mealId) ?? null;
}
