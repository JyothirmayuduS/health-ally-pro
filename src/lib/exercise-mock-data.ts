import type { DietLanguage } from "@/lib/diet-ai-types";

export type ExerciseYoutubeVideo = {
  videoId: string;
  title: string;
  channel: string;
  viewCount?: string;
  durationLabel?: string;
  language: DietLanguage;
  thumbnailUrl?: string;
};

export type ExerciseIntensity = "gentle" | "moderate" | "active";
export type ExerciseCategory =
  | "mobility"
  | "cardio"
  | "strength"
  | "breathing"
  | "recovery";

export type ExerciseStepDetail = {
  instruction: string;
  durationSeconds: number;
  reps?: number;
  holdSeconds?: number;
};

export type ExerciseRoutine = {
  id: string;
  name: string;
  category: ExerciseCategory;
  intensity: ExerciseIntensity;
  durationMinutes: number;
  targetConditions: string[];
  syncedMeds: string[];
  bestTime: "morning" | "midday" | "evening" | "anytime";
  medGapNote?: string;
  clinicalRationale: string;
  steps: string[];
  stepDetails?: ExerciseStepDetail[];
  bodyEffects: { time: string; effect: string; description: string }[];
  cautions: string[];
  keywords: string[];
};

export const exerciseRoutines: ExerciseRoutine[] = [
  {
    id: "ex-walk-am",
    name: "Post-Meds Morning Walk",
    category: "cardio",
    intensity: "gentle",
    durationMinutes: 15,
    targetConditions: ["Hypothyroidism", "Fatigue", "Metabolic slowdown"],
    syncedMeds: ["Levothyroxine"],
    bestTime: "morning",
    medGapNote: "Start 60+ min after levothyroxine — never on empty-stomach exertion",
    clinicalRationale:
      "Light walking after your thyroid dose window raises circulation without spiking cortisol. Steady movement supports levothyroxine distribution and reduces morning stiffness common in hypothyroidism.",
    steps: [
      "Wait at least 60 minutes after levothyroxine before starting.",
      "Walk at a pace where you can hold a conversation.",
      "Swing arms naturally; keep shoulders relaxed.",
      "Finish with 2 minutes of slow breathing.",
    ],
    bodyEffects: [
      { time: "5 min", effect: "Circulation boost", description: "Heart rate gently rises, improving blood flow to muscles and thyroid tissue." },
      { time: "15 min", effect: "Energy priming", description: "Endorphin release counters hypothyroid fatigue without overtaxing adrenals." },
      { time: "2 h", effect: "Metabolic lift", description: "Post-walk thermogenesis supports afternoon energy stability." },
    ],
    cautions: ["Stop if palpitations occur — may signal dose mismatch", "Avoid high-intensity sprints on thyroid meds"],
    keywords: ["morning walk beginner", "thyroid safe walking", "gentle cardio explained"],
  },
  {
    id: "ex-neck",
    name: "Thyroid Neck & Shoulder Mobility",
    category: "mobility",
    intensity: "gentle",
    durationMinutes: 8,
    targetConditions: ["Hypothyroidism", "Neck stiffness", "Hashimoto's tension"],
    syncedMeds: ["Levothyroxine"],
    bestTime: "morning",
    medGapNote: "Safe any time — low impact on medication absorption",
    clinicalRationale:
      "Hypothyroid patients often carry tension in the neck and upper trapezius. Gentle range-of-motion work improves lymph flow around the thyroid region without compressing the gland.",
    steps: [
      "Sit tall; slow chin tucks — hold 3 seconds, repeat 5 times.",
      "Ear-to-shoulder stretches each side — 20 seconds.",
      "Shoulder rolls backward — 10 reps.",
      "Finish with relaxed diaphragmatic breathing.",
    ],
    bodyEffects: [
      { time: "2 min", effect: "Fascia release", description: "Tight anterior neck muscles begin to lengthen, reducing headache pressure." },
      { time: "8 min", effect: "Posture reset", description: "Scapular mobility improves — less forward-head strain on thyroid area." },
      { time: "24 h", effect: "Tension reduction", description: "Regular practice lowers baseline muscle tone linked to thyroid-related stiffness." },
    ],
    cautions: ["Never force neck rotation", "Skip if acute neck injury or vertigo"],
    keywords: ["neck stretch beginner explained", "thyroid neck exercises gentle", "shoulder mobility short"],
  },
  {
    id: "ex-breath",
    name: "Diaphragmatic Breathing Reset",
    category: "breathing",
    intensity: "gentle",
    durationMinutes: 5,
    targetConditions: ["Stress", "Anxiety", "Cortisol imbalance", "Hypothyroidism"],
    syncedMeds: ["Levothyroxine", "Magnesium Glycinate"],
    bestTime: "anytime",
    clinicalRationale:
      "Chronic stress elevates cortisol, which interferes with T4→T3 conversion. Slow belly breathing activates the parasympathetic nervous system — a zero-equipment recovery tool.",
    steps: [
      "Lie or sit comfortably; one hand on chest, one on belly.",
      "Inhale 4 seconds through nose — belly rises, chest stays still.",
      "Exhale 6 seconds through pursed lips.",
      "Repeat for 5 minutes; focus on long exhales.",
    ],
    bodyEffects: [
      { time: "1 min", effect: "Heart-rate drop", description: "Vagal tone increases; resting pulse often falls 3–8 bpm." },
      { time: "5 min", effect: "Cortisol dampening", description: "Parasympathetic shift supports hormone conversion pathways." },
      { time: "1 h", effect: "Mental clarity", description: "Reduced brain fog — common in hypothyroid and high-stress states." },
    ],
    cautions: ["If dizzy, return to normal breathing", "Not a substitute for emergency asthma care"],
    keywords: ["diaphragmatic breathing tutorial short", "belly breathing explained beginner", "stress relief breathing 5 min"],
  },
  {
    id: "ex-sunwalk",
    name: "Vitamin D Sun Walk",
    category: "cardio",
    intensity: "gentle",
    durationMinutes: 12,
    targetConditions: ["Vitamin D deficiency", "Bone health", "Immune support"],
    syncedMeds: ["Vitamin D3 (Cholecalciferol)"],
    bestTime: "midday",
    medGapNote: "Pair with morning D3 dose + midday light exposure for synergy",
    clinicalRationale:
      "Your D3 supplement works best alongside natural light and gentle movement. A midday walk supports cutaneous vitamin D synthesis and complements oral cholecalciferol.",
    steps: [
      "Walk outdoors in daylight — arms and lower legs exposed if safe.",
      "Maintain easy pace for 10–12 minutes.",
      "Stay hydrated; avoid peak heat in summer.",
      "Log sun exposure for your care team.",
    ],
    bodyEffects: [
      { time: "10 min", effect: "Light activation", description: "UVB exposure triggers skin vitamin D production alongside your supplement." },
      { time: "30 min", effect: "Mood lift", description: "Serotonin pathways activate — supports thyroid-related low mood." },
      { time: "4 wk", effect: "D status support", description: "Combined oral + lifestyle approach improves 25(OH)D trends." },
    ],
    cautions: ["Use SPF per dermatology advice", "Avoid overheating"],
    keywords: ["walking sunshine vitamin D explained", "outdoor walk beginner short", "vitamin d exercise easy"],
  },
  {
    id: "ex-evening-stretch",
    name: "Magnesium Evening Stretch",
    category: "recovery",
    intensity: "gentle",
    durationMinutes: 10,
    targetConditions: ["Sleep quality", "Muscle recovery", "Restless legs"],
    syncedMeds: ["Magnesium Glycinate"],
    bestTime: "evening",
    medGapNote: "Do 1–2 hours before magnesium dose for relaxed uptake",
    clinicalRationale:
      "Gentle evening stretching primes the nervous system for sleep — synergistic with your magnesium glycinate before bed. Targets calves, hips, and lower back where thyroid patients often feel achiness.",
    steps: [
      "Child's pose — 45 seconds.",
      "Seated hamstring stretch — 30 seconds each leg.",
      "Supine figure-4 glute stretch — 30 seconds each side.",
      "Legs-up-the-wall — 2 minutes.",
    ],
    bodyEffects: [
      { time: "5 min", effect: "Muscle unwind", description: "Golgi tendon organs release tension in tight posterior chain." },
      { time: "10 min", effect: "Sleep prep", description: "Parasympathetic dominance supports melatonin onset with your PM magnesium." },
      { time: "Overnight", effect: "Recovery sleep", description: "Deeper slow-wave sleep improves next-day energy and muscle repair." },
    ],
    cautions: ["Avoid deep forward folds if dizzy", "Keep stretches pain-free"],
    keywords: ["bedtime stretch routine short", "gentle yoga evening beginner", "sleep stretch explained"],
  },
  {
    id: "ex-low-impact",
    name: "Low-Impact Metabolic Cardio",
    category: "cardio",
    intensity: "moderate",
    durationMinutes: 12,
    targetConditions: ["Hypothyroidism", "Weight management", "Insulin sensitivity"],
    syncedMeds: ["Levothyroxine"],
    bestTime: "midday",
    medGapNote: "Schedule 4+ hours after thyroid dose if session is moderate",
    clinicalRationale:
      "Hypothyroid metabolism benefits from low-impact cardio that raises heart rate without joint stress. Marching, step-touches, and arm raises improve insulin sensitivity — relevant for Hashimoto's metabolic patterns.",
    steps: [
      "March in place — 2 minutes warm-up.",
      "Step-touch with arm reaches — 3 minutes.",
      "Low step jacks (no jump) — 2 minutes.",
      "Cool-down walk in place — 2 minutes.",
    ],
    bodyEffects: [
      { time: "8 min", effect: "Glucose uptake", description: "Muscle glucose transporters activate — supports metabolic health." },
      { time: "12 min", effect: "Calorie burn", description: "Sustainable burn without cortisol spike from high-intensity work." },
      { time: "48 h", effect: "BMR support", description: "Regular sessions help counter hypothyroid-related metabolic slowdown." },
    ],
    cautions: ["Monitor heart rate — stay below 70% max if on thyroid meds", "Stop if chest pain or severe breathlessness"],
    keywords: ["low impact cardio beginner explained", "no jump workout easy", "metabolic walking workout short"],
  },
  {
    id: "ex-ankle",
    name: "Ankle Pumps & Circulation",
    category: "mobility",
    intensity: "gentle",
    durationMinutes: 5,
    targetConditions: ["Sedentary recovery", "Leg swelling", "Fatigue"],
    syncedMeds: ["Levothyroxine", "Vitamin D3 (Cholecalciferol)"],
    bestTime: "anytime",
    clinicalRationale:
      "Desk-bound recovery starts with circulation. Ankle pumps activate the calf muscle pump — reducing fluid retention and supporting venous return, especially helpful when hypothyroid fatigue limits activity.",
    steps: [
      "Seated or lying — point toes away, then flex toward you.",
      "10 slow reps, rest 10 seconds.",
      "Repeat 3 sets.",
      "Add clockwise ankle circles — 5 each direction.",
    ],
    bodyEffects: [
      { time: "1 min", effect: "Venous return", description: "Calf pump pushes blood back toward the heart — less leg heaviness." },
      { time: "5 min", effect: "Warmth in feet", description: "Improved peripheral circulation — common complaint in hypothyroidism." },
      { time: "Daily", effect: "Edema prevention", description: "Micro-movement breaks prevent afternoon ankle swelling." },
    ],
    cautions: ["Gentle only if varicose veins present — consult clinician"],
    keywords: ["ankle pumps exercise explained", "circulation exercises seated short", "leg swelling exercises beginner"],
  },
  {
    id: "ex-core-gentle",
    name: "Gentle Core Activation",
    category: "strength",
    intensity: "gentle",
    durationMinutes: 8,
    targetConditions: ["Posture", "Lower back support", "Core weakness"],
    syncedMeds: ["Levothyroxine"],
    bestTime: "midday",
    medGapNote: "Avoid immediately after eating or within 60 min of thyroid dose",
    clinicalRationale:
      "A weak core compounds thyroid-related posture issues. Dead bugs and pelvic tilts build deep stabilizers without straining the neck — safer than crunches for hypothyroid patients.",
    steps: [
      "Supine pelvic tilt — 10 slow reps.",
      "Dead bug — 6 reps each side, controlled.",
      "Glute bridge — 10 reps, squeeze at top.",
      "Rest 30 seconds between sets.",
    ],
    bodyEffects: [
      { time: "4 min", effect: "Transverse activation", description: "Deep core engages — lumbar spine gains passive support." },
      { time: "8 min", effect: "Postural stability", description: "Reduced slouching decreases neck compression near thyroid." },
      { time: "2 wk", effect: "Back resilience", description: "Progressive core endurance lowers daily ache frequency." },
    ],
    cautions: ["No breath-holding — exhale on effort", "Skip if acute back injury"],
    keywords: ["dead bug exercise beginner explained", "gentle core workout short", "pelvic tilt tutorial easy"],
  },
  {
    id: "ex-balance",
    name: "Single-Leg Balance Training",
    category: "strength",
    intensity: "moderate",
    durationMinutes: 7,
    targetConditions: ["Fall prevention", "Proprioception", "Muscle weakness"],
    syncedMeds: ["Vitamin D3 (Cholecalciferol)", "Magnesium Glycinate"],
    bestTime: "midday",
    clinicalRationale:
      "Vitamin D and magnesium both support neuromuscular function. Balance drills reduce fall risk and strengthen stabilizer muscles — critical when hypothyroid fatigue affects coordination.",
    steps: [
      "Stand near a wall — single-leg stand 15 seconds each side.",
      "Progress to eyes-closed only if steady.",
      "Heel-to-toe walk — 10 steps forward.",
      "Repeat circuit twice.",
    ],
    bodyEffects: [
      { time: "3 min", effect: "Proprioceptor wake-up", description: "Ankle and hip stabilizers fire — joint position sense improves." },
      { time: "7 min", effect: "Leg strength", description: "Eccentric control builds without heavy loading." },
      { time: "4 wk", effect: "Fall-risk reduction", description: "Documented balance gains with consistent short sessions." },
    ],
    cautions: ["Use wall support", "Avoid if orthostatic hypotension"],
    keywords: ["balance exercises beginner explained short", "single leg stand tutorial", "fall prevention exercises easy"],
  },
  {
    id: "ex-relax",
    name: "Progressive Muscle Relaxation",
    category: "recovery",
    intensity: "gentle",
    durationMinutes: 10,
    targetConditions: ["Anxiety", "Sleep", "Muscle tension"],
    syncedMeds: ["Magnesium Glycinate", "Levothyroxine"],
    bestTime: "evening",
    clinicalRationale:
      "PMR systematically releases muscle tension — pairing excellently with evening magnesium. Reduces the stress-thyroid feedback loop that worsens conversion and sleep quality.",
    steps: [
      "Lie down comfortably in a quiet space.",
      "Tense feet 5 seconds, release 10 seconds — notice the difference.",
      "Move up: calves, thighs, glutes, abdomen, hands, arms, shoulders, face.",
      "End with 1 minute of quiet breathing.",
    ],
    bodyEffects: [
      { time: "5 min", effect: "Tension mapping", description: "Brain learns to distinguish held vs relaxed muscle states." },
      { time: "10 min", effect: "Full-body release", description: "Cortisol and muscle tone drop — ideal pre-sleep window." },
      { time: "Overnight", effect: "Sleep depth", description: "Improved sleep architecture supports thyroid hormone rhythm." },
    ],
    cautions: ["Avoid tensing injured areas", "Not for acute muscle spasm"],
    keywords: ["progressive muscle relaxation short guided", "PMR for beginners explained", "sleep relaxation 10 minutes"],
  },
];

export function getExerciseRoutine(id: string): ExerciseRoutine | undefined {
  return exerciseRoutines.find((r) => r.id === id);
}
