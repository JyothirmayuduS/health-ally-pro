import type { DietNutritionPerServing } from "@/lib/diet-nutrition";

export type DietYoutubeVideo = {
  videoId: string;
  title: string;
  channel: string;
  viewCount?: string;
  likeCount?: string;
  language: string;
  thumbnailUrl?: string;
};

export type DietMeal = {
  id: string;
  name: string;
  ingredients: string[];
  nutrients: string[]; // e.g., ["Selenium", "Iodine"]
  type: "vegan" | "non-veg";
  lactoseFree: boolean;
  budget: "essential" | "balanced" | "elite";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  servings?: number;
  nutritionPerServing?: DietNutritionPerServing;
  cuisine?: "indian" | "continental" | "mediterranean";
  prepTimeMinutes?: number;
  youtubeVideos?: DietYoutubeVideo[];
  clinicalRationale?: string;
  instructions?: string[];
  clinicalTips?: string[];
  protocol?: {
    medGap: string;
    caution: string[];
  };
  metabolicImpact?: {
    time: string;
    effect: string;
    description: string;
  }[];
  clinicalBenefits?: {
    title: string;
    description: string;
    icon: string;
  }[];
  aiIntelligence?: {
    confidence: number;
    model: string;
    dataset: string;
  };
  imageUrl?: string;
};

export const dietMeals: DietMeal[] = [
  // --- ESSENTIAL (BUDGET) ---
  {
    id: "eb1",
    name: "Iodized Overnight Oats",
    ingredients: ["Oats", "Water", "Flaxseed", "Pinch of Iodized Salt"],
    nutrients: ["Iodine", "Fiber"],
    type: "vegan",
    lactoseFree: true,
    budget: "essential",
    mealType: "breakfast",
    calories: 320,
    clinicalRationale: "A baseline metabolic starter. Iodized salt provides the primary substrate for thyroxine synthesis, while soluble fiber ensures a stable insulin response.",
    instructions: [
      "Mix organic oats with water and flaxseeds.",
      "Add a precise pinch of iodized salt (crucial for T4 substrate).",
      "Refrigerate overnight for enzyme activation."
    ],
    protocol: { medGap: "60 mins", caution: ["High fiber can delay medication absorption"] },
    metabolicImpact: [
      { time: "30m", effect: "Iodine Loading", description: "Substrate availability increases for thyroid follicular cells." },
      { time: "2h", effect: "Satiety Peak", description: "Beta-glucans from oats stabilize glucose and sustain energy levels." }
    ],
    clinicalBenefits: [
      { title: "Hormone Base", description: "Provides essential iodine for T4 production.", icon: "Activity" },
      { title: "Metabolic Steady", description: "Slow-release carbs for thyroid stability.", icon: "Flame" }
    ],
    aiIntelligence: { confidence: 0.92, model: "MedOra-NLP-v4", dataset: "Global Nutrition Sync" }
  },
  {
    id: "eb2",
    name: "Sardine & Brown Rice Bowl",
    ingredients: ["Canned Sardines", "Brown Rice", "Steamed Cabbage"],
    nutrients: ["Iodine", "Omega-3", "Vitamin D"],
    type: "non-veg",
    lactoseFree: true,
    budget: "essential",
    mealType: "lunch",
    calories: 450,
    clinicalRationale: "Sardines are a nutrient powerhouse. High levels of Omega-3 reduce thyroidal inflammation, while Vitamin D supports immune modulation.",
    instructions: [
      "Steam cabbage until soft to reduce goitrogenic activity.",
      "Serve with whole brown rice and high-quality canned sardines."
    ],
    protocol: { medGap: "2 hours", caution: ["Fiber and high protein sync"] },
    metabolicImpact: [
      { time: "1h", effect: "Inflammation Drop", description: "EPA/DHA starts modulating systemic inflammatory markers." },
      { time: "3h", effect: "Cellular Recovery", description: "Vitamin D3 begins genomic signaling for immune health." }
    ],
    clinicalBenefits: [
      { title: "Anti-Inflammatory", description: "Omega-3 reduces systemic stress.", icon: "Shield" },
      { title: "Immune Support", description: "High D3 for T-cell regulation.", icon: "Heart" }
    ],
    aiIntelligence: { confidence: 0.95, model: "MedOra-DL-Core", dataset: "Marine Nutrition Lab" }
  },
  {
    id: "eb3",
    name: "Lentil & Carrot Stew",
    ingredients: ["Red Lentils", "Carrots", "Turmeric"],
    nutrients: ["Zinc", "Antioxidants"],
    type: "vegan",
    lactoseFree: true,
    budget: "essential",
    mealType: "dinner",
    calories: 380,
    clinicalRationale: "Zinc-dense lentils support the conversion of T4 to the active T3 hormone. Turmeric provides potent antioxidant protection for thyroid tissue.",
    instructions: [
      "Sauté carrots and turmeric to activate curcuminoids.",
      "Simmer lentils until fully broken down for maximum digestibility."
    ],
    protocol: { medGap: "4 hours", caution: ["Iron/Zinc overlap with meds"] },
    metabolicImpact: [
      { time: "1.5h", effect: "Enzyme Trigger", description: "Zinc availability activates peripheral deiodinase enzymes." },
      { time: "4h", effect: "Antioxidant Flush", description: "Curcuminoids reach peak serum concentration for tissue protection." }
    ],
    clinicalBenefits: [
      { title: "Active T3 Boost", description: "Zinc-driven hormone conversion.", icon: "Sparkles" },
      { title: "Tissue Protection", description: "Turmeric-mediated antioxidant defense.", icon: "Shield" }
    ],
    aiIntelligence: { confidence: 0.94, model: "MedOra-NLP-v4", dataset: "Botanical Clinical Hub" }
  },

  // --- BALANCED (OPTIMAL) ---
  {
    id: "ba1",
    name: "Avocado & Egg Toast",
    ingredients: ["Poached Egg", "Avocado", "Sourdough", "Sea Salt"],
    nutrients: ["Healthy Fats", "Vitamin A"],
    type: "non-veg",
    lactoseFree: true,
    budget: "balanced",
    mealType: "breakfast",
    calories: 410,
    clinicalRationale: "Monounsaturated fats from avocado are essential for steroid hormone transport. Eggs provide choline for cognitive health, often impaired in thyroid conditions.",
    instructions: [
      "Poach eggs to preserve delicate amino acids.",
      "Mash ripe avocado on fermented sourdough to support gut health."
    ],
    protocol: { medGap: "60 mins", caution: ["Fiber interaction with Levothyroxine"] },
    metabolicImpact: [
      { time: "30m", effect: "Lipid Priming", description: "Healthy fats initiate bile release, optimizing fat-soluble vitamin uptake." },
      { time: "2h", effect: "Cognitive Load", description: "Choline crosses the blood-brain barrier for neurotransmitter support." }
    ],
    clinicalBenefits: [
      { title: "Hormone Transport", description: "Lipids for efficient hormone delivery.", icon: "Activity" },
      { title: "Neural Support", description: "Choline-mediated brain health optimization.", icon: "Cpu" }
    ],
    aiIntelligence: { confidence: 0.96, model: "MedOra-DL-Core", dataset: "Neuro-Endocrine Sync" }
  },
  {
    id: "ba2",
    name: "Roasted Chicken & Quinoa",
    ingredients: ["Chicken Breast", "Quinoa", "Spinach", "Lemon"],
    nutrients: ["Protein", "Magnesium"],
    type: "non-veg",
    lactoseFree: true,
    budget: "balanced",
    mealType: "lunch",
    calories: 520,
    clinicalRationale: "A complete amino acid profile from chicken supports tissue repair. Magnesium from spinach and quinoa aids muscle relaxation and stress management.",
    instructions: [
      "Roast chicken with lemon to increase iron bioavailability from spinach.",
      "Fluff quinoa to ensure a light, low-glycemic carbohydrate base."
    ],
    protocol: { medGap: "2 hours", caution: ["Protein interference with absorption"] },
    metabolicImpact: [
      { time: "1h", effect: "Amino Surge", description: "Essential amino acids reach serum peak for protein synthesis." },
      { time: "4h", effect: "Muscular Ease", description: "Magnesium levels stabilize for optimized neuromuscular signaling." }
    ],
    clinicalBenefits: [
      { title: "Muscle Synthesis", description: "Complete protein for metabolic tissue.", icon: "Activity" },
      { title: "Stress Recovery", description: "Magnesium-mediated cortisol balance.", icon: "Heart" }
    ],
    aiIntelligence: { confidence: 0.94, model: "MedOra-NLP-v4", dataset: "Muscle & Metabolic Hub" }
  },
  {
    id: "ba3",
    name: "Kelp Noodle Miso Soup",
    ingredients: ["Kelp Noodles", "Tofu", "Miso", "Green Onion"],
    nutrients: ["Iodine", "Probiotics"],
    type: "vegan",
    lactoseFree: true,
    budget: "balanced",
    mealType: "dinner",
    calories: 280,
    clinicalRationale: "Kelp is nature's richest source of iodine. Miso fermentation provides live probiotics to rebuild the gut lining, essential for autoimmune management.",
    instructions: [
      "Dissolve miso at low temperature to preserve live probiotics.",
      "Rinse kelp noodles thoroughly to optimize texture and nutrient release."
    ],
    protocol: { medGap: "4 hours", caution: ["Soy (Tofu) interaction with medications"] },
    metabolicImpact: [
      { time: "30m", effect: "Probiotic Flush", description: "Live enzymes begin gut microbiome interaction." },
      { time: "3h", effect: "Iodine Saturation", description: "Bioavailable iodine enters the thyroglobulin synthesis pathway." }
    ],
    clinicalBenefits: [
      { title: "Microbiome Reset", description: "Fermented probiotics for gut health.", icon: "Shield" },
      { title: "Thyroid Substrate", description: "Marine-derived iodine for hormone synthesis.", icon: "Lightbulb" }
    ],
    aiIntelligence: { confidence: 0.97, model: "MedOra-DL-Core", dataset: "Global Fermentation Data" }
  },

  // --- ELITE (PREMIUM) ---
  {
    id: "el1",
    name: "Wild Salmon & Asparagus",
    ingredients: ["Wild-caught Salmon", "Organic Asparagus", "Microgreens"],
    nutrients: ["High-D3", "Selenium", "Zinc"],
    type: "non-veg",
    lactoseFree: true,
    budget: "elite",
    mealType: "lunch",
    calories: 580,
    clinicalRationale: "A micronutrient powerhouse. High Selenium content is clinical-grade for TPO antibody reduction, while Zinc and D3 synchronize for peak immune modulation.",
    instructions: [
      "Pan-sear salmon on low heat to preserve Omega-3 integrity.",
      "Steam organic asparagus lightly to maintain fiber and folate levels."
    ],
    protocol: { medGap: "2 hours", caution: ["High micronutrient density requires clear window"] },
    metabolicImpact: [
      { time: "1h", effect: "Selenium Saturation", description: "Selenium-dependent enzyme GPx activates, reducing thyroid oxidative stress." },
      { time: "4h", effect: "Vascular Optimization", description: "High-dose Omega-3 modulates blood rheology and systemic inflammation." }
    ],
    clinicalBenefits: [
      { title: "Antibody Reduction", description: "Selenium-mediated TPO support.", icon: "Sparkles" },
      { title: "DNA Protection", description: "Zinc-driven genomic stability.", icon: "Shield" }
    ],
    aiIntelligence: { confidence: 0.99, model: "MedOra-DL-Core", dataset: "Precision Bio-Mining v4" }
  },
  {
    id: "el2",
    name: "Brazil Nut & Berry Parfait",
    ingredients: ["Cashew Yogurt", "Organic Blueberries", "Brazil Nuts"],
    nutrients: ["High-Selenium", "Antioxidants"],
    type: "vegan",
    lactoseFree: true,
    budget: "elite",
    mealType: "breakfast",
    calories: 350,
    clinicalRationale: "Specifically designed for Selenium loading. Two Brazil nuts provide the exact clinical dosage required for Selenium-dependent deiodinases.",
    instructions: [
      "Crush organic Brazil nuts into cashew yogurt for improved fat solubilization.",
      "Top with wild blueberries for high-ORAC antioxidant loading."
    ],
    protocol: { medGap: "60 mins", caution: ["Fiber from berries can delay medications"] },
    metabolicImpact: [
      { time: "30m", effect: "Antioxidant Surge", description: "Anthocyanins from berries enter the cardiovascular system." },
      { time: "3h", effect: "Enzyme Priming", description: "Selenium levels peak, activating deiodinase for T4 -> T3 conversion." }
    ],
    clinicalBenefits: [
      { title: "Hormone Conversion", description: "Selenium for active T3 synthesis.", icon: "Flame" },
      { title: "Brain Health", description: "Wild berry polyphenols for cognitive fire.", icon: "Cpu" }
    ],
    aiIntelligence: { confidence: 0.98, model: "MedOra-NLP-v4", dataset: "Global Nutri-Sync" }
  },
  {
    id: "el3",
    name: "Pan-Seared Scallops",
    ingredients: ["Scallops", "Organic Pea Puree", "Saffron"],
    nutrients: ["Zinc", "B12"],
    type: "non-veg",
    lactoseFree: true,
    budget: "elite",
    mealType: "dinner",
    calories: 420,
    clinicalRationale: "Scallops are high in Vitamin B12 and Zinc, which are essential for managing autoimmune thyroid symptoms and nerve health.",
    instructions: [
      "Pat scallops dry completely before searing.",
      "Sear in a hot pan for 2 minutes per side until golden.",
      "Serve over a vibrant pea and saffron puree."
    ],
    protocol: { medGap: "4 hours", caution: ["Zinc competes with thyroid medication absorption"] },
    metabolicImpact: [
      { time: "1h", effect: "Neural Activation", description: "B12 absorption supports myelin sheath integrity and energy." },
      { time: "4h", effect: "Immune Response", description: "Zinc availability optimizes T-lymphocyte function." }
    ],
    clinicalBenefits: [
      { title: "Energy Synthesis", description: "B12-mediated mitochondrial support.", icon: "Zap" },
      { title: "Immune Balance", description: "Zinc for autoimmune clinical stability.", icon: "Shield" }
    ],
    aiIntelligence: { confidence: 0.97, model: "MedOra-DL-Core", dataset: "Elite Clinical Marine Hub" }
  },
  // --- INDIAN WHOLE MEALS ---
  {
    id: "in1",
    name: "Thyroid-Sync Bajra Khichdi",
    ingredients: ["Pearl Millet (Bajra)", "Yellow Moong Dal", "Turmeric", "Ghee", "Curry Leaves"],
    nutrients: ["Selenium", "Zinc", "Protein"],
    type: "non-veg", // Ghee included
    lactoseFree: false,
    budget: "essential",
    mealType: "lunch",
    calories: 380,
    clinicalRationale: "Pearl millet (Bajra) is a magnesium-rich grain that supports metabolic function. Paired with Moong Dal, it provides a complete amino acid profile for hormone synthesis.",
    instructions: [
      "Soak Bajra for 4 hours to reduce phytic acid and improve mineral absorption.",
      "Pressure cook with Moong dal and turmeric until soft.",
      "Temper with ghee, cumin, and fresh curry leaves for metabolic activation."
    ],
    clinicalTips: ["Never eat raw pearl millet; thorough cooking neutralizes goitrogenic concerns.", "The 4-Hour Rule: Consume this high-fiber meal 4 hours away from Levothyroxine."],
    imageUrl: "bajra_khichdi_clinical_1776603015994.png",
    metabolicImpact: [
      { time: "45m", effect: "Serotonin Prime", description: "Complex carbohydrates trigger natural serotonin synthesis, improving morning mood and cortisol balance." },
      { time: "3h", effect: "Metabolic Synthesis", description: "Selenium from Bajra activates the deiodinase enzyme, aiding T4 conversion." }
    ],
    clinicalBenefits: [
      { title: "Metabolic Rate", description: "Supports resting energy expenditure.", icon: "Flame" },
      { title: "Thyroid Support", description: "Direct Selenium loading for thyroid tissue.", icon: "Sparkles" }
    ],
    aiIntelligence: {
      confidence: 0.94,
      model: "MedOra-DL-Core",
      dataset: "NutriaData v6"
    }
  },
  {
    id: "in2",
    name: "Ragi Finger Millet Dosa",
    ingredients: ["Ragi Flour", "Urad Dal", "Fenugreek Seeds"],
    nutrients: ["Calcium", "Iron", "Iodine"],
    type: "vegan",
    lactoseFree: true,
    budget: "balanced",
    mealType: "breakfast",
    calories: 310,
    clinicalRationale: "Ragi is exceptionally high in calcium and iron. Fermentation improves gut health, which is essential for thyroid medication absorption.",
    instructions: [
      "Prepare a fermented batter of Ragi and Urad dal.",
      "Spread thin on a cast iron griddle.",
      "Serve with fresh coconut chutney for healthy saturated fats."
    ],
    clinicalTips: ["Fermentation increases the bioavailability of Vitamin B12.", "Pair with coconut chutney to help Vitamin D absorption."],
    imageUrl: "ragi_dosa_clinical_1776603048585.png",
    protocol: { medGap: "60 mins", caution: ["Avoid with Calcium supplements", "Increase water intake"] },
    metabolicImpact: [
      { time: "30m", effect: "Enzyme Priming", description: "Fermented ragi initiates gut probiotic activity, preparing the metabolic pathway for nutrient uptake." },
      { time: "2h", effect: "Glycemic Stability", description: "Complex fibers ensure a slow glucose release, preventing the mid-morning energy crash common in thyroid patients." },
      { time: "4h", effect: "Hormone Transport", description: "Iron and Magnesium from ragi support peripheral T4 to T3 conversion." }
    ],
    clinicalBenefits: [
      { title: "Bone Density", description: "High calcium content supports skeletal health.", icon: "Activity" },
      { title: "Iron Loading", description: "Plant-based iron for RBC synthesis.", icon: "Droplets" },
      { title: "Gut Health", description: "Prebiotic fermentation for microbiome health.", icon: "Shield" }
    ],
    aiIntelligence: {
      confidence: 0.98,
      model: "MedOra-NLP-v4",
      dataset: "Clinical Nutrition Hub"
    }
  },  {
    id: "eb4",
    name: "Quinoa & Moong Sprout Salad",
    ingredients: ["Sprouted Moong", "Quinoa", "Cucumber", "Lemon"],
    nutrients: ["Protein", "Fiber", "Vitamin C"],
    type: "vegan",
    lactoseFree: true,
    budget: "essential",
    mealType: "lunch",
    calories: 320,
    clinicalRationale: "Sprouts provide high digestibility and enzyme activity. Quinoa is a complete protein, crucial for maintaining muscle mass in hypothyroid patients.",
    instructions: [
      "Soak and sprout moong beans for 2 days to maximize enzyme potential.",
      "Toss with cooked quinoa and fresh lemon for a low-toxin, high-energy salad."
    ],
    protocol: { medGap: "4 hours", caution: ["High fiber may delay med absorption"] },
    metabolicImpact: [
      { time: "45m", effect: "Enzyme Priming", description: "Sprouted enzymes facilitate rapid nutrient absorption with minimal gastric load." },
      { time: "3h", effect: "Muscle Repair", description: "Quinoa aminos reach skeletal tissue for recovery signaling." }
    ],
    clinicalBenefits: [
      { title: "Digestive Ease", description: "Low-lectin, high-enzyme sprouts.", icon: "Shield" },
      { title: "Protein Loading", description: "Complete aminos for metabolic health.", icon: "Activity" }
    ],
    aiIntelligence: { confidence: 0.93, model: "MedOra-NLP-v4", dataset: "Global Sprout Analytics" }
  },
  {
    id: "ba4",
    name: "Tandoori Paneer Skewers",
    ingredients: ["Paneer", "Bell Peppers", "Yogurt Marination", "Turmeric"],
    nutrients: ["Protein", "Calcium", "Zinc"],
    type: "non-veg",
    lactoseFree: false,
    budget: "balanced",
    mealType: "dinner",
    calories: 420,
    clinicalRationale: "Paneer is an excellent protein source. Zinc from seeds and dairy supports T4 to T3 conversion.",
    instructions: [
      "Marinate paneer in turmeric-yogurt for anti-inflammatory activation.",
      "Grill on high heat briefly to sear in micronutrients."
    ],
    protocol: { medGap: "4 hours", caution: ["Calcium competes with Levothyroxine"] },
    metabolicImpact: [
      { time: "1h", effect: "Zinc Loading", description: "Zinc-mediated deiodinase activation begins in the liver." },
      { time: "4h", effect: "Tissue Stability", description: "Calcium and protein provide baseline cellular repair signals." }
    ],
    clinicalBenefits: [
      { title: "T3 Activation", description: "Zinc for active hormone synthesis.", icon: "Sparkles" },
      { title: "Skeletal Health", description: "High-bioavailability calcium source.", icon: "Activity" }
    ],
    aiIntelligence: { confidence: 0.95, model: "MedOra-DL-Core", dataset: "Dairy-Clinics v2" }
  },
  {
    id: "el4",
    name: "Macadamia Crust Sea Bass",
    ingredients: ["Sea Bass", "Macadamia Nuts", "Zucchini Ribbon"],
    nutrients: ["Healthy Fats", "Selenium", "Iodine"],
    type: "non-veg",
    lactoseFree: true,
    budget: "elite",
    mealType: "dinner",
    calories: 540,
    clinicalRationale: "Macadamia nuts are dense in monounsaturated fats. Sea bass is a clean source of iodine for thyroid hormone production.",
    instructions: [
      "Crush macadamia nuts into a coarse crust to ensure fat stability during cooking.",
      "Sear sea bass skin-side down first to optimize Omega-3 retention."
    ],
    protocol: { medGap: "2 hours", caution: ["Rich fats slow digestion"] },
    metabolicImpact: [
      { time: "1h", effect: "Lipid Delivery", description: "Macadamia oils facilitate hormone transport across cellular membranes." },
      { time: "3h", effect: "Iodine Saturation", description: "Clean marine iodine enters the thryoglobulin synthesis cycle." }
    ],
    clinicalBenefits: [
      { title: "Hormone Transport", description: "Dense lipids for cellular entry.", icon: "Activity" },
      { title: "Synthesis Hub", description: "Iodine/Selenium synergy for T4 creation.", icon: "Flame" }
    ],
    aiIntelligence: { confidence: 0.98, model: "MedOra-NLP-v4", dataset: "Marine Precision v5" }
  },
  {
    id: "in3",
    name: "Lactose-Free Methi Thepla",
    ingredients: ["Fenugreek Leaves", "Whole Wheat Flour", "Olive Oil"],
    nutrients: ["Fiber", "Iron"],
    type: "vegan",
    lactoseFree: true,
    budget: "essential",
    mealType: "breakfast",
    calories: 280,
    clinicalRationale: "Fenugreek helps in blood sugar regulation, which is often linked with metabolic thyroid conditions.",
    instructions: [
      "Knead fresh fenugreek into whole wheat dough with olive oil.",
      "Cook on a griddle until golden and crisp."
    ],
    protocol: { medGap: "60 mins", caution: ["High fiber interaction"] },
    metabolicImpact: [
      { time: "30m", effect: "Glucose Dampening", description: "Fenugreek fiber slows gastric emptying and sugar absorption." },
      { time: "2h", effect: "Iron Priming", description: "Plant-based iron enters the hematological transport system." }
    ],
    clinicalBenefits: [
      { title: "Glycemic Clamp", description: "Stabilizes blood sugar excursions.", icon: "Activity" },
      { title: "Iron Recovery", description: "Foliage-derived iron for vitality.", icon: "Droplets" }
    ],
    aiIntelligence: { confidence: 0.92, model: "MedOra-DL-Core", dataset: "Botanical Hub v3" }
  },
  {
    id: "in4",
    name: "Dal Palak with Brown Rice",
    ingredients: ["Spinach", "Lentils", "Brown Rice", "Garlic"],
    nutrients: ["Iron", "Magnesium"],
    type: "vegan",
    lactoseFree: true,
    budget: "balanced",
    mealType: "lunch",
    calories: 460,
    clinicalRationale: "Magnesium-rich spinach supports muscle and nerve health. Brown rice provides slow-release energy.",
    instructions: [
      "Blanch spinach briefly to reduce oxalates while preserving magnesium.",
      "Simmer lentils with garlic for systemic anti-inflammatory benefits."
    ],
    protocol: { medGap: "4 hours", caution: ["Iron competes with med absorption"] },
    metabolicImpact: [
      { time: "1h", effect: "Muscular Prime", description: "Magnesium begins neutralizing physiological stress markers." },
      { time: "4h", effect: "Hematological Flow", description: "Iron loading supports oxygen transport to metabolic tissues." }
    ],
    clinicalBenefits: [
      { title: "Cortisol Management", description: "Magnesium-mediated stress reduction.", icon: "Heart" },
      { title: "Vitality Loading", description: "Iron-rich spinach for energy.", icon: "Flash" }
    ],
    aiIntelligence: { confidence: 0.94, model: "MedOra-NLP-v4", dataset: "Clinical Grain Sync" }
  }
];
export const ABSORPTION_GUARD_PLAN = {
  medGap: "60 mins",
  barriers: [
    "Iron supplements competing with Levothyroxine absorption",
    "Calcium-rich foods or supplements within 4 hours",
    "Soy (tofu, soy milk) interaction with medications",
  ],
  optimization:
    "To ensure nutrients like Selenium and Iodine in your meals reach your thyroid follicular cells efficiently, avoid concurrent intake of calcium or iron supplements, which compete for transport pathways.",
};

export function getNextMealPreview() {
  return (
    dietMeals.find((m) => m.mealType === "lunch" && m.name === "Roasted Chicken & Quinoa") ??
    dietMeals.find((m) => m.mealType === "lunch")
  );
}

export function getDietMeal(id: string) {
  return dietMeals.find((m) => m.id === id);
}
