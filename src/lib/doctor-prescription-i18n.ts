import type { PatientLanguage, RxFrequency } from "./doctor-prescription-workflow";

export type RxLocale = PatientLanguage;

export type RxLabels = {
  date: string;
  time: string;
  patient: string;
  ageSex: string;
  uhid: string;
  validUntil: string;
  allergy: string;
  knownAllergy: string;
  allergyReviewedSafe: string;
  allergyConflict: string;
  diagnosis: string;
  notRecorded: string;
  rxGuideline: string;
  noMeds: string;
  dose: string;
  route: string;
  duration: string;
  timing: string;
  qty: string;
  refills: string;
  note: string;
  advice: string;
  toPharmacist: string;
  followUp: string;
  asAdvised: string;
  dispenseAt: string;
  footerLegal: string;
  regNo: string;
  patientCopyBanner: string;
  languageName: string;
};

const LABELS: Record<RxLocale, RxLabels> = {
  en: {
    date: "Date",
    time: "Time",
    patient: "Patient",
    ageSex: "Age / Sex",
    uhid: "UHID",
    validUntil: "Valid until",
    allergy: "Allergy",
    knownAllergy: "Known allergy",
    allergyReviewedSafe: "Rx reviewed — no conflict",
    allergyConflict: "Allergy conflict on this prescription",
    diagnosis: "Diagnosis",
    notRecorded: "Not recorded",
    rxGuideline: "Generic names in capitals · NMC guidelines",
    noMeds: "No medications prescribed.",
    dose: "Dose",
    route: "Route",
    duration: "Duration",
    timing: "Timing",
    qty: "Qty",
    refills: "Refills",
    note: "Note",
    advice: "Advice",
    toPharmacist: "To pharmacist",
    followUp: "Follow-up",
    asAdvised: "As advised",
    dispenseAt: "Dispense at",
    footerLegal:
      "Computer-generated e-prescription under Telemedicine Practice Guidelines (India). Valid with prescriber verification only. Schedule H / H1 / X — retain copy at pharmacy.",
    regNo: "Reg. No.",
    patientCopyBanner: "Patient copy — English",
    languageName: "English",
  },
  hi: {
    date: "दिनांक",
    time: "समय",
    patient: "रोगी",
    ageSex: "आयु / लिंग",
    uhid: "यूएचआईडी",
    validUntil: "वैध तिथि तक",
    allergy: "एलर्जी",
    knownAllergy: "ज्ञात एलर्जी",
    allergyReviewedSafe: "नुस्खा जाँचा — कोई संघर्ष नहीं",
    allergyConflict: "इस नुस्खे में एलर्जी संघर्ष",
    diagnosis: "निदान",
    notRecorded: "दर्ज नहीं",
    rxGuideline: "जेनेरिक नाम बड़े अक्षरों में · एनएमसी दिशानिर्देश",
    noMeds: "कोई दवा निर्धारित नहीं।",
    dose: "खुराक",
    route: "मार्ग",
    duration: "अवधि",
    timing: "समय",
    qty: "मात्रा",
    refills: "पुनःपूर्ति",
    note: "नोट",
    advice: "सलाह",
    toPharmacist: "फार्मासिस्ट के लिए",
    followUp: "फॉलो-अप",
    asAdvised: "सलाह अनुसार",
    dispenseAt: "वितरण स्थल",
    footerLegal:
      "टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स (भारत) के अंतर्गत कंप्यूटर जनित ई-नुस्खा। केवल प्रिस्क्राइबर सत्यापन के साथ मान्य। अनुसूची H / H1 / X — फार्मेसी पर प्रति रखें।",
    regNo: "पंजी. सं.",
    patientCopyBanner: "रोगी प्रति — हिंदी",
    languageName: "हिंदी",
  },
  te: {
    date: "తేదీ",
    time: "సమయం",
    patient: "రోగి",
    ageSex: "వయస్సు / లింగం",
    uhid: "యూహెచ్ఐడి",
    validUntil: "చెల్లుబాటు తేదీ",
    allergy: "అలెర్జీ",
    knownAllergy: "తెలిసిన అలెర్జీ",
    allergyReviewedSafe: "ఈ Rx తనిఖీ — ఘర్షణ లేదు",
    allergyConflict: "ఈ ప్రిస్క్రిప్షన్‌లో అలెర్జీ ఘర్షణ",
    diagnosis: "నిర్ధారణ",
    notRecorded: "నమోదు లేదు",
    rxGuideline: "జెనెరిక్ పేర్లు క్యాపిటల్స్‌లో · NMC మార్గదర్శకాలు",
    noMeds: "మందులు ఇవ్వలేదు.",
    dose: "మోతాదు",
    route: "మార్గం",
    duration: "వ్యవధి",
    timing: "సమయం",
    qty: "పరిమాణం",
    refills: "రీఫిల్స్",
    note: "గమనిక",
    advice: "సలహా",
    toPharmacist: "ఫార్మసిస్ట్ కు",
    followUp: "ఫాలో-అప్",
    asAdvised: "సలహా ప్రకారం",
    dispenseAt: "పంపిణీ చోట",
    footerLegal:
      "టెలిమెడిసిన్ ప్రాక్టీస్ గైడ్‌లైన్స్ (భారతదేశం) కింద కంప్యూటర్ ఈ-ప్రిస్క్రిప్షన్. ప్రిస్క్రైబర్ ధృవీకరణతో మాత్రమే చెల్లుబాటు. షెడ్యూల్ H / H1 / X — ఫార్మసీలో కాపీ ఉంచండి.",
    regNo: "నమో. సం.",
    patientCopyBanner: "రోగి కాపీ — తెలుగు",
    languageName: "తెలుగు",
  },
  ta: {
    date: "தேதி",
    time: "நேரம்",
    patient: "நோயாளி",
    ageSex: "வயது / பாலினம்",
    uhid: "யுஹெச்ஐடி",
    validUntil: "செல்லுபடியாகும் தேதி",
    allergy: "ஒவ்வாமை",
    knownAllergy: "அறியப்பட்ட ஒவ்வாமை",
    allergyReviewedSafe: "இந்த Rx பரிசோதனை — முரண்பாடு இல்லை",
    allergyConflict: "இந்த மருந்துச்சீட்டில் ஒவ்வாமை முரண்பாடு",
    diagnosis: "நோய் கண்டறிதல்",
    notRecorded: "பதிவு இல்லை",
    rxGuideline: "பொதுப் பெயர்கள் பேரெழுத்தில் · NMC வழிகாட்டுதல்கள்",
    noMeds: "மருந்துகள் எதுவும் இல்லை.",
    dose: "அளவு",
    route: "வழி",
    duration: "காலம்",
    timing: "நேரம்",
    qty: "அளவு",
    refills: "மீண்டும்",
    note: "குறிப்பு",
    advice: "ஆலோசனை",
    toPharmacist: "மருந்தாளருக்கு",
    followUp: "பின்தொடர்தல்",
    asAdvised: "ஆலோசனைப்படி",
    dispenseAt: "வழங்கும் இடம்",
    footerLegal:
      "டெலிமெடிசின் பயிற்சி வழிகாட்டுதல்கள் (இந்தியா) படி கணினி மின்-மருந்துச்சீட்டு. மருத்துவர் சரிபார்ப்புடன் மட்டுமே செல்லுபடியாகும். அட்டவணை H / H1 / X — மருந்தகத்தில் நகல் வைக்கவும்.",
    regNo: "பதிவு எண்",
    patientCopyBanner: "நோயாளி நகல் — தமிழ்",
    languageName: "தமிழ்",
  },
};

const ROUTE: Record<string, Partial<Record<RxLocale, string>>> = {
  Oral: { hi: "मुँह से", te: "నోటితో", ta: "வாய்வழி" },
  IV: { hi: "नस में", te: "సూది ద్వారా", ta: "நரம்பு வழி" },
  IM: { hi: "मांसपेशी में", te: "కండరంలో", ta: "தசை வழி" },
  SC: { hi: "त्वचा के नीचे", te: "చర్మం కింద", ta: "தோலுக்கடியில்" },
  Topical: { hi: "बाहरी", te: "బాహ్య", ta: "வெளிப்புற" },
  Inhaled: { hi: "साँस से", te: "శ్వాస ద్వారా", ta: "சுவாச வழி" },
  Sublingual: { hi: "जीभ के नीचे", te: "నాలిక కింద", ta: "நாவின் கீழ்" },
  Rectal: { hi: "मलद्वार", te: "గుద ద్వారా", ta: "மலக்குடல் வழி" },
  Nasal: { hi: "नाक से", te: "ముక్కు ద్వారా", ta: "மூக்கு வழி" },
  Ophthalmic: { hi: "आँख में", te: "కంటిలో", ta: "கண் வழி" },
};

const TIMING: Record<string, Partial<Record<RxLocale, string>>> = {
  "Before meals": { hi: "भोजन से पहले", te: "భోజనానికి ముందు", ta: "உணவுக்கு முன்" },
  "After meals": { hi: "भोजन के बाद", te: "భోజనానికి తర్వాత", ta: "உணவுக்குப் பின்" },
  "With food": { hi: "भोजन के साथ", te: "ఆహారంతో", ta: "உணவுடன்" },
  "Empty stomach": { hi: "खाली पेट", te: "ఖాళీ కడుపుతో", ta: "வெறும் வயிற்றில்" },
  "With water": { hi: "पानी के साथ", te: "నీటితో", ta: "தண்ணீருடன்" },
  "At bedtime": { hi: "सोते समय", te: "నిద్రకు ముందు", ta: "படுக்கும் நேரம்" },
  "In the morning": { hi: "सुबह", te: "ఉదయం", ta: "காலையில்" },
  "With milk": { hi: "दूध के साथ", te: "పాలతో", ta: "பாலுடன்" },
  "Avoid dairy": { hi: "डेयरी से बचें", te: "పాల ఉత్పత్తులు తప్పించండి", ta: "பால் பொருட்களைத் தவிர்க்கவும்" },
};

const FREQ_LATIN: Record<RxFrequency, Partial<Record<RxLocale, string>>> = {
  OD: { hi: "दिन में एक बार", te: "రోజుకు ఒకసారి", ta: "நாளொன்றுக்கு ஒருமுறை" },
  BD: { hi: "दिन में दो बार", te: "రోజుకు రెండుసార్లు", ta: "நாளொன்றுக்கு இருமுறை" },
  TDS: { hi: "दिन में तीन बार", te: "రోజుకు మూడుసార్లు", ta: "நாளொன்றுக்கு மூன்று முறை" },
  QID: { hi: "दिन में चार बार", te: "రోజుకు నాలుగుసార్లు", ta: "நாளொன்றுக்கு நான்கு முறை" },
  HS: { hi: "सोते समय", te: "నిద్రకు ముందు", ta: "படுக்கும் நேரம்" },
  SOS: { hi: "जरूरत पर", te: "అవసరమైతే", ta: "தேவைப்படும் போது" },
  Q6H: { hi: "हर 6 घंटे", te: "ప్రతి 6 గంటలకు", ta: "ஒவ்வொரு 6 மணி நேரத்திற்கும்" },
  Q8H: { hi: "हर 8 घंटे", te: "ప్రతి 8 గంటలకు", ta: "ஒவ்வொரு 8 மணி நேரத்திற்கும்" },
  Weekly: { hi: "सप्ताह में एक बार", te: "వారానికి ఒకసారి", ta: "வாரத்திற்கு ஒருமுறை" },
  Custom: { hi: "जैसा निर्देशित", te: "సూచించిన విధంగా", ta: "ஆலோசனைப்படி" },
};

const PHRASES: Record<string, Partial<Record<RxLocale, string>>> = {
  "No refills": { hi: "पुनःपूर्ति नहीं", te: "రీఫిల్ లేదు", ta: "மீண்டும் இல்லை" },
  "Generic substitution permitted": {
    hi: "जेनेरिक विकल्प की अनुमति",
    te: "జెనెరిక్ మార్పిడి అనుమతి",
    ta: "பொதுப் பெயர் மாற்றம் அனுமதி",
  },
  "Dispense as written (DAW)": {
    hi: "लिखे अनुसार ही दें (DAW)",
    te: "రాసిన విధంగా ఇవ్వండి (DAW)",
    ta: "எழுதியபடி வழங்கவும் (DAW)",
  },
  "Take with food": { hi: "भोजन के साथ लें", te: "ఆహారంతో తీసుకోండి", ta: "உணவுடன் எடுக்கவும்" },
  "Avoid alcohol": { hi: "शराब से बचें", te: "మద్యం తప్పించండి", ta: "மது தவிர்க்கவும்" },
  "Do not drive": { hi: "गाड़ी न चलाएँ", te: "వాహనం నడపవద్దు", ta: "வாகனம் ஓட்ட வேண்டாம்" },
  "Keep refrigerated": { hi: "फ्रिज में रखें", te: "శీతలీకరించి ఉంచండి", ta: "குளிர்சாதனப்பெட்டியில் வைக்கவும்" },
  "Finish full course": { hi: "पूरा कोर्स पूरा करें", te: "పూర్తి కోర్స్ పూర్తి చేయండి", ta: "முழு காலத்தையும் முடிக்கவும்" },
  "Monitor blood sugar": { hi: "ब्लड शुगर जाँचें", te: "బ్లడ్ షుగర్ పర్యవేక్షించండి", ta: "இரத்த சர்க்கரை கண்காணிக்கவும்" },
  "Check BP daily": { hi: "रोज़ BP जाँचें", te: "ప్రతిరోజు బీపీ చూడండి", ta: "தினமும் இரத்த அழுத்தம் பார்க்கவும்" },
  "Return if worsens": { hi: "बिगड़ने पर वापस आएँ", te: "మరింత అయితే తిరిగి రండి", ta: "மோசமானால் மீண்டும் வாருங்கள்" },
  Rest: { hi: "आराम करें", te: "విశ్రాంతి తీసుకోండి", ta: "ஓய்வு எடுங்கள்" },
  Hydration: { hi: "पर्याप्त पानी पिएँ", te: "తగినంత నీరు తాగండి", ta: "போதுமான நீர் குடிக்கவும்" },
  "Upper respiratory tract infection": {
    hi: "ऊपरी श्वसन तंत्र संक्रमण",
    te: "ఎగువ శ్వాసకోశ ఇన్ఫెక్షన్",
    ta: "மேல் சுவாசப் பாதை தொற்று",
  },
  "Acute illness — symptomatic": {
    hi: "तीव्र बीमारी — लक्षणात्मक उपचार",
    te: "తీవ్ర అనారోగ్యం — లక్షణాధారిత",
    ta: "கடுமையான நோய் — அறிகுறி சிகிச்சை",
  },
};

export function resolveRxLocale(printInPatientLanguage: boolean, language: PatientLanguage): RxLocale {
  if (!printInPatientLanguage) return "en";
  return language;
}

export function getRxLabels(locale: RxLocale): RxLabels {
  return LABELS[locale] ?? LABELS.en;
}

export function tPhrase(text: string, locale: RxLocale): string {
  if (!text || locale === "en") return text;
  const direct = PHRASES[text]?.[locale];
  if (direct) return direct;
  const lower = text.toLowerCase();
  for (const [key, map] of Object.entries(PHRASES)) {
    if (key.toLowerCase() === lower && map[locale]) return map[locale]!;
  }
  return text;
}

export function tRoute(route: string, locale: RxLocale): string {
  if (locale === "en") return route;
  return ROUTE[route]?.[locale] ?? route;
}

export function tTimingList(timing: string, locale: RxLocale): string {
  if (locale === "en" || timing === "—") return timing;
  return timing
    .split(", ")
    .map((part) => TIMING[part.trim()]?.[locale] ?? part.trim())
    .join(", ");
}

export function tFreqLatin(freq: RxFrequency, locale: RxLocale): string {
  if (locale === "en") return "";
  return FREQ_LATIN[freq]?.[locale] ?? "";
}

export function tDuration(days: number, locale: RxLocale): string {
  if (locale === "en") {
    return days >= 90 ? `${Math.round(days / 30)} month(s)` : `${days} day(s)`;
  }
  if (days >= 90) {
    const m = Math.round(days / 30);
    const map: Record<RxLocale, string> = {
      en: `${m} month(s)`,
      hi: `${m} महीने`,
      te: `${m} నెలలు`,
      ta: `${m} மாதம்`,
    };
    return map[locale];
  }
  const map: Record<RxLocale, string> = {
    en: `${days} day(s)`,
    hi: `${days} दिन`,
    te: `${days} రోజులు`,
    ta: `${days} நாட்கள்`,
  };
  return map[locale];
}

export function tRefills(refillsAllowed: number, locale: RxLocale): string {
  if (locale === "en") {
    return refillsAllowed === 0 ? "No refills" : `${refillsAllowed} refill(s) permitted`;
  }
  if (refillsAllowed === 0) return tPhrase("No refills", locale);
  const map: Record<RxLocale, string> = {
    en: `${refillsAllowed} refill(s) permitted`,
    hi: `${refillsAllowed} पुनःपूर्ति की अनुमति`,
    te: `${refillsAllowed} రీఫిల్‌లు అనుమతి`,
    ta: `${refillsAllowed} மீண்டும் அனுமதி`,
  };
  return map[locale];
}

export function tSubstitution(allowGeneric: boolean, locale: RxLocale): string {
  const key = allowGeneric ? "Generic substitution permitted" : "Dispense as written (DAW)";
  return tPhrase(key, locale);
}

export function tPatientInstructions(text: string, locale: RxLocale): string {
  if (!text || locale === "en") return text;
  return text
    .split(/(?:\s*·\s*|\.\s+)/)
    .map((part) => tPhrase(part.trim(), locale))
    .filter(Boolean)
    .join(" · ");
}

export function tSex(gender: "M" | "F", locale: RxLocale): string {
  if (locale === "en") return gender;
  if (gender === "M") {
    return { hi: "पु", te: "పు", ta: "ஆ" }[locale] ?? gender;
  }
  return { hi: "म", te: "స్త", ta: "ப" }[locale] ?? gender;
}

export const LANGUAGE_OPTIONS: { id: PatientLanguage; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिंदी" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
  { id: "ta", label: "Tamil", native: "தமிழ்" },
];
