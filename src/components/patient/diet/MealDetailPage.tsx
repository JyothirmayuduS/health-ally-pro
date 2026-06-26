import { Link } from "@tanstack/react-router";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock4,
  Cpu,
  Flame,
  Heart,
  Info,
  Lightbulb,
  Shield,
  ShieldCheck,
  Sparkles,
  Utensils,
  Zap,
  Youtube,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DietLanguage } from "@/lib/diet-ai-types";
import { DIET_LANGUAGE_LABELS } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import { getDietMeal, saveAiDietMeal } from "@/lib/diet-store";
import {
  DIET_LANGUAGE_EVENT,
  getDietVideoLanguage,
  setDietVideoLanguage,
} from "@/lib/diet-language-store";
import { fetchMealMedia, mealImageFallbackChain } from "@/lib/diet-meal-media-client";
import { DietLanguagePicker } from "@/components/patient/diet/DietLanguagePicker";
import { DietNutritionPanel } from "@/components/patient/diet/DietNutritionPanel";
import { DietYoutubeEmbed } from "@/components/patient/diet/DietYoutubeEmbed";
import { getMealNutrition } from "@/lib/diet-nutrition";
import { cn } from "@/lib/utils";

const HERO_HEIGHT = 320;
const BENEFIT_ICONS: Record<string, typeof Activity> = {
  Activity,
  Shield,
  Flame,
  Sparkles,
  Heart,
  Zap,
  Lightbulb,
  Droplets: Flame,
};

export function MealDetailPage({ mealId }: { mealId: string }) {
  const meal = getDietMeal(mealId);
  const heroRef = useRef<HTMLDivElement>(null);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [videoLanguage, setVideoLanguage] = useState<DietLanguage>(() => getDietVideoLanguage());
  const [videos, setVideos] = useState<DietYoutubeVideo[]>(() => meal?.youtubeVideos ?? []);
  const [videosLoading, setVideosLoading] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(() => meal?.imageUrl ?? null);
  const [heroFallbackIdx, setHeroFallbackIdx] = useState(0);

  useEffect(() => {
    const onLang = () => setVideoLanguage(getDietVideoLanguage());
    window.addEventListener(DIET_LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(DIET_LANGUAGE_EVENT, onLang);
  }, []);

  useEffect(() => {
    if (!meal) return;

    let cancelled = false;
    setHeroImage(meal.imageUrl ?? null);
    setHeroFallbackIdx(0);
    setVideos([]);
    setVideosLoading(true);

    const cuisine =
      meal.cuisine === "indian"
        ? "indian"
        : meal.type === "vegan"
          ? "vegan"
          : meal.type === "non-veg"
            ? "non-veg"
            : "all";

    fetchMealMedia({
      mealId: meal.id,
      mealName: meal.name,
      language: videoLanguage,
      cuisine,
      ingredients: meal.ingredients,
    }).then((media) => {
      if (cancelled) return;
      if (media.imageUrl) setHeroImage(media.imageUrl);
      setVideos(media.videos ?? []);
      setVideosLoading(false);
      saveAiDietMeal({
        ...meal,
        imageUrl: media.imageUrl ?? meal.imageUrl,
        youtubeVideos: media.videos?.length ? media.videos : meal.youtubeVideos,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mealId, meal?.id, meal?.name, meal?.cuisine, meal?.type, videoLanguage]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 1024) {
        setHeaderOpacity(0);
        return;
      }
      const y = window.scrollY;
      const opacity = Math.min(
        1,
        Math.max(0, (y - (HERO_HEIGHT - 100)) / 60),
      );
      setHeaderOpacity(opacity);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!meal) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Meal not found.</p>
        <Link to="/diet" className="mt-4 inline-block text-clay">
          Back to diet
        </Link>
      </div>
    );
  }

  const confidence = meal.aiIntelligence
    ? Math.round(meal.aiIntelligence.confidence * 100)
    : null;
  const nutrition = getMealNutrition(meal);

  return (
    <div className="relative w-full bg-[#F9F7F2]">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-[#EDEAE6]/70 bg-[#F9F7F2]/80 backdrop-blur-md transition-[border-color] duration-200 lg:hidden",
          headerOpacity > 0.05 ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{ opacity: headerOpacity }}
        aria-hidden={headerOpacity < 0.05}
      >
        <div className="flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            to="/diet"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            aria-label="Back to diet"
          >
            <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-ink">
            {meal.name}
          </h1>
          <span className="w-10 shrink-0" aria-hidden />
        </div>
      </header>

      {/* Full-width hero */}
      <div
        ref={heroRef}
        className="relative h-[220px] w-full overflow-hidden bg-gradient-to-br from-[#C4A484] via-[#A68B6B] to-[#8B7355] sm:h-[260px] lg:h-[300px]"
      >
        {heroImage ? (
          <img
            src={mealImageFallbackChain(heroImage)[heroFallbackIdx]}
            alt={meal.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              const chain = mealImageFallbackChain(heroImage);
              if (heroFallbackIdx < chain.length - 1) {
                setHeroFallbackIdx((i) => i + 1);
              } else {
                setHeroImage(null);
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Utensils className="h-14 w-14 text-white/30" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[#F9F7F2]" />
        <Link
          to="/diet"
          className="absolute left-5 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-2xl bg-black/30 backdrop-blur-sm lg:left-8"
          aria-label="Back to diet"
        >
          <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
        </Link>
        <span className="absolute right-5 top-[max(1rem,env(safe-area-inset-top))] rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-white backdrop-blur-sm lg:right-8">
          {meal.mealType.toUpperCase()}
        </span>
        <div className="absolute bottom-6 left-5 right-5 lg:left-8 lg:right-8">
          <h2 className="font-serif text-[28px] leading-tight text-white lg:text-[36px]">
            {meal.name}
          </h2>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-12 pt-6 lg:px-8 lg:pb-16 lg:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 lg:hidden">
              {confidence != null && meal.aiIntelligence ? (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-clay">
                  <Cpu className="h-3 w-3" strokeWidth={2} />
                  {confidence}% Clinical Confidence · {meal.aiIntelligence.model}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-lg bg-clay/15 px-2.5 py-1 text-[10px] font-bold uppercase text-clay">
              {meal.budget}
            </span>
          </div>

          <div className="hidden lg:block">
            {confidence != null && meal.aiIntelligence ? (
              <p className="mb-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-clay">
                <Cpu className="h-3 w-3" strokeWidth={2} />
                {confidence}% Clinical Confidence · {meal.aiIntelligence.model}
              </p>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-4 border-b border-[#EDEAE6] pb-6">
            <MetaChip icon={Flame} label={`${nutrition.calories} kcal / serving`} />
            <MetaChip icon={Clock} label={`${meal.prepTimeMinutes ?? 20} min`} />
            <MetaChip icon={Zap} label={`P ${nutrition.proteinG}g · C ${nutrition.carbsG}g · F ${nutrition.fatG}g`} accent />
          </div>

          <section className="mt-8">
            <h3 className="mb-4 font-serif text-lg text-ink">Nutrition per serving</h3>
            <DietNutritionPanel meal={meal} variant="full" />
          </section>

          <section className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Diet type", value: meal.type === "vegan" ? "Vegan" : "Non-vegetarian" },
                { label: "Lactose", value: meal.lactoseFree ? "Free" : "Contains dairy" },
                { label: "Budget tier", value: meal.budget },
                { label: "Meal slot", value: meal.mealType },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-[#EDEAE6] bg-white px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {meal.metabolicImpact?.length ? (
            <section className="mt-8">
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Metabolic Activation Timeline
              </p>
              <div className="relative ml-2.5 border-l-2 border-[#EDEAE6] pl-6">
                {meal.metabolicImpact.map((impact) => (
                  <div key={impact.time + impact.effect} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[31px] top-0 h-2 w-2 rounded-full bg-clay" />
                    <p className="text-sm">
                      <span className="font-bold text-clay">{impact.time}</span>{" "}
                      <span className="font-bold text-ink">{impact.effect}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {impact.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2.5">
              <Info className="h-[18px] w-[18px] text-clay" strokeWidth={1.75} />
              <h3 className="font-serif text-lg text-ink">Why this meal?</h3>
            </div>
            <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
              <p className="text-[15px] leading-relaxed text-ink-muted/90">
                {meal.clinicalRationale}
              </p>
            </div>
          </section>

          {meal.clinicalBenefits?.length ? (
            <section className="mt-8">
              <h3 className="mb-4 font-serif text-lg text-ink">
                Systemic Biological Optimization
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {meal.clinicalBenefits.map((benefit) => {
                  const Icon = BENEFIT_ICONS[benefit.icon] ?? Sparkles;
                  return (
                    <div
                      key={benefit.title}
                      className="rounded-[20px] border border-[#EDEAE6] bg-white p-4"
                    >
                      <span className="mb-2 grid h-8 w-8 place-items-center rounded-[10px] bg-clay/10">
                        <Icon className="h-4 w-4 text-clay" strokeWidth={1.75} />
                      </span>
                      <p className="text-[15px] font-bold text-ink">{benefit.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <h3 className="mb-4 font-serif text-lg text-ink">Essential Ingredients</h3>
            <div className="flex flex-wrap gap-2.5">
              {meal.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#EDEAE6] bg-white px-3 py-2.5 text-sm font-medium text-ink"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                  {ing}
                </span>
              ))}
            </div>
          </section>

          {meal.instructions?.length ? (
            <section className="mt-8">
              <h3 className="mb-5 font-serif text-lg text-ink">Preparation steps</h3>
              <ol className="space-y-6">
                {meal.instructions.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-[15px] leading-relaxed text-ink-muted">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Youtube className="h-[18px] w-[18px] text-red-600" strokeWidth={1.75} />
                <h3 className="font-serif text-lg text-ink">Video tutorials</h3>
              </div>
              {videosLoading ? (
                <span className="text-xs text-ink-muted">Loading {DIET_LANGUAGE_LABELS[videoLanguage]}…</span>
              ) : null}
            </div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Recipe language (YouTube)
            </p>
            <DietLanguagePicker
              value={videoLanguage}
              onChange={(lang) => {
                setVideoLanguage(lang);
                setDietVideoLanguage(lang);
              }}
              compact
              className="mb-4"
            />
            {videos.length ? (
              <div className="flex flex-col gap-4">
                {videos.map((video) => (
                  <DietYoutubeEmbed key={`${video.videoId}-${video.language}`} video={video} />
                ))}
              </div>
            ) : videosLoading ? (
              <p className="text-sm text-ink-muted">Finding top videos on YouTube…</p>
            ) : (
              <p className="text-sm text-ink-muted">No videos found for this language. Try another language.</p>
            )}
          </section>

          {meal.protocol ? (
            <section className="mt-8">
              <Link
                to="/diet/$mealId/clinical-rules"
                params={{ mealId: meal.id }}
                className="block overflow-hidden rounded-[28px] bg-gradient-to-br from-clay to-[#8D5D48] p-6 text-white transition-opacity hover:opacity-[0.98]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
                    <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-[17px] font-bold">Absorption Guard Protocol</p>
                </div>
                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-white/15 pb-5">
                  <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/90 px-3 py-2 text-[13px] font-bold text-clay">
                    <Clock4 className="h-4 w-4" strokeWidth={1.75} />
                    {meal.protocol.medGap} Gap
                  </span>
                  <span className="text-[13px] text-white/80">
                    Required after taking Levothyroxine
                  </span>
                </div>
                <ul className="space-y-3">
                  {meal.protocol.caution.map((c) => (
                    <li key={c} className="flex items-center gap-2.5 text-[13px]">
                      <span className="h-1 w-1 rounded-full bg-white/60" />
                      {c}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/30 bg-white/20 py-3 text-[13px] font-bold">
                  View clinical rules
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </section>
          ) : null}
      </div>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg",
          accent ? "bg-clay/10" : "bg-ink/5",
        )}
      >
        <Icon
          className={cn("h-3.5 w-3.5", accent ? "text-clay" : "text-ink-muted")}
          strokeWidth={1.75}
        />
      </span>
      {label}
    </span>
  );
}
