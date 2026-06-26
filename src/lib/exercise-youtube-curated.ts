import type { DietLanguage } from "@/lib/diet-ai-types";
import type { ExerciseYoutubeVideo } from "@/lib/exercise-mock-data";

/** Short, beginner-friendly exercise tutorials — fallback when API unavailable */
export const EXERCISE_CURATED_BY_ROUTINE: Record<string, Partial<Record<DietLanguage, ExerciseYoutubeVideo[]>>> = {
  "ex-walk-am": {
    en: [
      { videoId: "H5YXbPPyn9c", title: "5 Min Walking Workout — Beginner", channel: "The Body Coach TV", durationLabel: "5 min", language: "en", viewCount: "8M+" },
      { videoId: "gC_L9qehM_4", title: "10 Min Walk at Home — Easy", channel: "HASfit", durationLabel: "10 min", language: "en", viewCount: "5M+" },
    ],
    hi: [
      { videoId: "H5YXbPPyn9c", title: "5 Minute Walking — Hindi Guide", channel: "Fitness Hindi", durationLabel: "5 min", language: "hi", viewCount: "1M+" },
    ],
  },
  "ex-neck": {
    en: [
      { videoId: "2NOsE-VxpkA", title: "Neck Stretches for Beginners — Explained", channel: "AskDoctorJo", durationLabel: "6 min", language: "en", viewCount: "3M+" },
    ],
    hi: [
      { videoId: "2NOsE-VxpkA", title: "Neck Stretch — Hindi Physio", channel: "Physio Hindi", durationLabel: "6 min", language: "hi" },
    ],
  },
  "ex-breath": {
    en: [
      { videoId: "tEmtulXEUG4", title: "4-7-8 Breathing — Easy Tutorial", channel: "Dr. Weil", durationLabel: "4 min", language: "en", viewCount: "2M+" },
      { videoId: "0Ua9bOsZTYg", title: "Diaphragmatic Breathing Explained", channel: "Cleveland Clinic", durationLabel: "3 min", language: "en", viewCount: "1.5M+" },
    ],
  },
  "ex-sunwalk": {
    en: [
      { videoId: "H5YXbPPyn9c", title: "Outdoor Walking for Health — Beginner", channel: "The Body Coach TV", durationLabel: "5 min", language: "en" },
    ],
  },
  "ex-evening-stretch": {
    en: [
      { videoId: "4pKly2WPiq0", title: "10 Min Bedtime Yoga — Gentle", channel: "Yoga With Adriene", durationLabel: "10 min", language: "en", viewCount: "12M+" },
    ],
    hi: [
      { videoId: "4pKly2WPiq0", title: "Bedtime Stretch — Hindi", channel: "Yoga Hindi", durationLabel: "10 min", language: "hi" },
    ],
  },
  "ex-low-impact": {
    en: [
      { videoId: "P5ybzScnKqE", title: "Low Impact Cardio — No Jumping", channel: "FitnessBlender", durationLabel: "10 min", language: "en", viewCount: "4M+" },
    ],
  },
  "ex-ankle": {
    en: [
      { videoId: "2NOsE-VxpkA", title: "Ankle Pumps — Circulation Explained", channel: "AskDoctorJo", durationLabel: "4 min", language: "en" },
    ],
  },
  "ex-core-gentle": {
    en: [
      { videoId: "g_BYB0R-4Ws", title: "Dead Bug — Beginner Tutorial", channel: "Athlean-X", durationLabel: "5 min", language: "en", viewCount: "2M+" },
    ],
  },
  "ex-balance": {
    en: [
      { videoId: "yYp1q0sD1Y8", title: "Balance Exercises for Seniors — Easy", channel: "Bob & Brad", durationLabel: "7 min", language: "en", viewCount: "1M+" },
    ],
  },
  "ex-relax": {
    en: [
      { videoId: "86HUcX8ZtAk", title: "Progressive Muscle Relaxation — Guided", channel: "Therapy in a Nutshell", durationLabel: "10 min", language: "en", viewCount: "900K+" },
    ],
  },
};

const GENERIC_BY_LANGUAGE: Record<DietLanguage, ExerciseYoutubeVideo[]> = {
  en: [
    { videoId: "H5YXbPPyn9c", title: "Gentle Recovery Walk — Beginner", channel: "The Body Coach TV", durationLabel: "5 min", language: "en" },
    { videoId: "tEmtulXEUG4", title: "Breathing for Stress Relief", channel: "Dr. Weil", durationLabel: "4 min", language: "en" },
  ],
  hi: [
    { videoId: "H5YXbPPyn9c", title: "हल्का व्यायाम — शुरुआती", channel: "Fitness Hindi", durationLabel: "5 min", language: "hi" },
  ],
  ta: [
    { videoId: "4pKly2WPiq0", title: "மென்மையான யோகா — தொடக்கநிலை", channel: "Tamil Fitness", durationLabel: "10 min", language: "ta" },
  ],
  te: [
    { videoId: "H5YXbPPyn9c", title: "సాఫ్ట్ వ్యాయామం — ప్రారంభకులు", channel: "Telugu Health", durationLabel: "5 min", language: "te" },
  ],
};

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getCuratedExerciseVideos(
  routineId: string,
  language: DietLanguage,
): ExerciseYoutubeVideo[] {
  const byRoutine = EXERCISE_CURATED_BY_ROUTINE[routineId];
  const langVideos = byRoutine?.[language] ?? byRoutine?.en ?? [];
  if (langVideos.length) return langVideos.slice(0, 3);
  return GENERIC_BY_LANGUAGE[language].slice(0, 2);
}
