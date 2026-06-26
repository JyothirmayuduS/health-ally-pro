import type { DietLanguage } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";

export type VerifiedMealMedia = {
  /** High-quality food photo (TheMealDB or verified YouTube still) */
  imageUrl: string;
  videos: DietYoutubeVideo[];
};

function vid(
  videoId: string,
  title: string,
  channel: string,
  language: DietLanguage = "en",
): DietYoutubeVideo {
  return {
    videoId,
    title,
    channel,
    language,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

function ytImage(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Manually verified meal → media map (oEmbed-checked YouTube IDs + TheMealDB photos).
 * Primary source of truth — used before live API search.
 */
export const VERIFIED_MEAL_MEDIA: Record<string, VerifiedMealMedia> = {
  eb1: {
    imageUrl: ytImage("cqdtrqTUolQ"),
    videos: [
      vid("cqdtrqTUolQ", "Overnight Oats Recipe", "Hebbars Kitchen"),
      vid("8Ohp-Pfck4M", "Masala Oats Recipe", "Hebbars Kitchen"),
    ],
  },
  eb2: {
    imageUrl: "https://www.themealdb.com/images/media/meals/ysxwuq1487323065.jpg",
    videos: [
      vid("UVgJn2iD3u8", "Chettinad Fish Fry — Seer Fish", "Kannamma Cooks"),
    ],
  },
  eb3: {
    imageUrl: "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
    videos: [
      vid("qrEkBv_aV2Q", "Hearty Carrot and Lentil Soup", "The Cooking Foodie"),
      vid("0nqUMCsGcFk", "Moong Dal Tadka", "Hebbars Kitchen"),
    ],
  },
  eb4: {
    imageUrl: ytImage("DVewyy0FHWk"),
    videos: [vid("DVewyy0FHWk", "Quinoa Kosambari Salad", "Swaadista")],
  },
  ba1: {
    imageUrl: ytImage("A1Bi_pR9OHg"),
    videos: [vid("A1Bi_pR9OHg", "The Best Avocado Egg Toast", "Sam The Cooking Guy")],
  },
  ba2: {
    imageUrl: "https://www.themealdb.com/images/media/meals/k29viq1585565980.jpg",
    videos: [
      vid("aW-evl4zS8A", "High-Protein Chicken Fried Quinoa", "Carolistermomandchef"),
      vid("znkJqq6qNSE", "Ultimate Chicken Quinoa Bowl", "Pinch and Swirl"),
    ],
  },
  ba3: {
    imageUrl: ytImage("v4aXJsfl_Ss"),
    videos: [vid("v4aXJsfl_Ss", "Authentic Japanese Miso Soup", "Sudachi Recipes")],
  },
  ba4: {
    imageUrl: "https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg",
    videos: [vid("BwIJHI4KdIE", "Paneer Tikka on Tawa", "Hebbars Kitchen")],
  },
  el1: {
    imageUrl: ytImage("rR9wq5uN_q8"),
    videos: [vid("rR9wq5uN_q8", "Flavorful Salmon And Sides", "The F Word")],
  },
  el2: {
    imageUrl: ytImage("hNerHWJnsRg"),
    videos: [vid("hNerHWJnsRg", "Summer Berry Parfait", "Allrecipes")],
  },
  el3: {
    imageUrl: ytImage("_vxST8WqFwk"),
    videos: [vid("_vxST8WqFwk", "Pan Seared Scallops with Lemon Garlic Butter", "Downshiftology")],
  },
  el4: {
    imageUrl: "https://www.themealdb.com/images/media/meals/tqd7s21763780609.jpg",
    videos: [
      vid("xzDYKZl50FQ", "Crispy Sea Bass with Ginger & Chilli", "BBC Good Food"),
    ],
  },
  in1: {
    imageUrl: ytImage("zS-gKmilBDY"),
    videos: [vid("zS-gKmilBDY", "Bajra Khichdi", "Nisha Madhulika", "hi")],
  },
  in2: {
    imageUrl: ytImage("yxUBbslZ8UY"),
    videos: [vid("yxUBbslZ8UY", "Instant Ragi Dosa", "Hebbars Kitchen")],
  },
  in3: {
    imageUrl: ytImage("C-tYTtw-YpU"),
    videos: [vid("C-tYTtw-YpU", "Methi Ka Paratha", "Samreen Sabah", "hi")],
  },
  in4: {
    imageUrl: "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
    videos: [vid("HZ67I0Ry3wI", "Dal Palak — Restaurant Style", "Hebbars Kitchen")],
  },
};

const VERIFIED_VIDEO_IDS = new Set(
  Object.values(VERIFIED_MEAL_MEDIA).flatMap((m) => m.videos.map((v) => v.videoId)),
);

export function getVerifiedMealMedia(mealId: string): VerifiedMealMedia | undefined {
  return VERIFIED_MEAL_MEDIA[mealId];
}

export function getVerifiedMealImage(mealId: string): string | undefined {
  return VERIFIED_MEAL_MEDIA[mealId]?.imageUrl;
}

export function getVerifiedMealVideos(
  mealId: string,
  language: DietLanguage = "en",
): DietYoutubeVideo[] {
  const media = VERIFIED_MEAL_MEDIA[mealId];
  if (!media?.videos.length) return [];

  const langMatch = media.videos.filter((v) => v.language === language);
  const picks = langMatch.length ? langMatch : media.videos;
  return picks.map((v) => ({ ...v, language }));
}

export function isVerifiedVideoId(videoId: string): boolean {
  return VERIFIED_VIDEO_IDS.has(videoId);
}

export function mealVideosMatchVerified(
  mealId: string,
  videos: DietYoutubeVideo[] | undefined,
): boolean {
  const expected = getVerifiedMealVideos(mealId);
  if (!expected.length) return false;
  if (!videos?.length) return false;
  return expected[0].videoId === videos[0].videoId;
}
