import { simplifyMealSearchName } from "@/lib/diet-meal-search";
import { primaryIngredientTokens } from "@/lib/diet-meal-fingerprint";

const WIKI_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MedoraHealth/1.0 (clinical diet app; food image lookup)";

type WikiResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: { url?: string; mime?: string }[];
      }
    >;
  };
};

async function wikiSearch(query: string): Promise<string | null> {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `filetype:bitmap ${query} food dish`);
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime");
  url.searchParams.set("iiurlwidth", "800");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as WikiResponse;
    const pages = json.query?.pages ?? {};

    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (info?.url && info.mime?.startsWith("image/")) {
        return info.url;
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Free food photo from Wikimedia Commons — no API key or quota. */
export async function searchWikimediaFoodImage(
  mealName: string,
  ingredients: string[],
): Promise<string | null> {
  const simplified = simplifyMealSearchName(mealName, ingredients);
  const queries = [
    simplified,
    `${simplified} cuisine`,
    primaryIngredientTokens(ingredients).slice(0, 2).join(" "),
  ].filter(Boolean);

  for (const q of queries) {
    const url = await wikiSearch(q);
    if (url) return url;
  }
  return null;
}
