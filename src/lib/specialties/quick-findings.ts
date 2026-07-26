/**
 * Tap-to-fill phrases for specialty exam fields.
 * Doctors chart by exception — normal is one tap, abnormal is one tap + edit.
 */
import type { SpecialtyField } from "./types";

type FindingSet = {
  /** First entry is the "normal" phrase used by Mark all normal. */
  normal: string;
  others: string[];
};

/** Matched against field id first, then label keywords. */
const FINDINGS: { match: RegExp; set: FindingSet }[] = [
  {
    match: /^(general|gen_exam)$|general exam/,
    set: {
      normal: "Conscious, oriented, afebrile. No pallor, icterus, cyanosis, clubbing or edema.",
      others: [
        "Pallor present",
        "Febrile, looks toxic",
        "Dehydrated",
        "Pedal edema present",
        "Icterus present",
      ],
    },
  },
  {
    match: /^cvs$|cardiovascular/,
    set: {
      normal: "S1 S2 heard, no murmurs. Pulse regular, normal volume.",
      others: ["Tachycardia", "Systolic murmur present", "Raised JVP", "Irregularly irregular pulse"],
    },
  },
  {
    match: /^rs$|respirat|chest exam/,
    set: {
      normal: "Bilateral air entry equal, vesicular breath sounds. No added sounds.",
      others: ["Bilateral crepitations", "Rhonchi present", "Reduced air entry right", "Reduced air entry left"],
    },
  },
  {
    match: /^abd$|abdomen/,
    set: {
      normal: "Soft, non-tender. No organomegaly. Bowel sounds present.",
      others: ["Tenderness present", "Hepatomegaly", "Splenomegaly", "Guarding / rigidity", "Distended"],
    },
  },
  {
    match: /^cns$|neuro|central nervous/,
    set: {
      normal: "Conscious, oriented. No focal neurological deficit. Power 5/5 all limbs.",
      others: ["Focal deficit present", "GCS reduced", "Reflexes exaggerated", "Altered sensorium"],
    },
  },
  {
    match: /provisional|diagnosis|impression/,
    set: {
      normal: "Clinically stable — for routine follow-up.",
      others: [
        "Viral fever",
        "Acute gastroenteritis",
        "Uncontrolled type 2 diabetes",
        "Essential hypertension",
        "Lower respiratory tract infection",
        "Iron deficiency anemia",
      ],
    },
  },
  {
    match: /rom|range of motion/,
    set: {
      normal: "Full range of motion, pain-free.",
      others: ["Restricted flexion", "Restricted extension", "Painful arc present"],
    },
  },
  {
    match: /strength|power/,
    set: {
      normal: "Power 5/5 in all groups.",
      others: ["Power 4/5", "Power 3/5", "Antigravity only"],
    },
  },
  {
    match: /plan_notes|therapy plan|^plan$/,
    set: {
      normal: "Continue current management. Review in 2 weeks.",
      others: ["Start physiotherapy", "Refer to specialist", "Admit for observation", "Review with reports"],
    },
  },
  {
    match: /functional|goal/,
    set: {
      normal: "Independent in activities of daily living.",
      others: ["Needs assistance for ambulation", "Return to work", "Pain-free walking 500 m"],
    },
  },
  {
    match: /complaint|chief/,
    set: {
      normal: "No new complaints since last visit.",
      others: [
        "Fever x 3 days",
        "Cough with expectoration",
        "Breathlessness on exertion",
        "Chest pain",
        "Abdominal pain",
        "Generalised weakness",
        "Headache",
        "Follow-up for chronic disease",
      ],
    },
  },
  {
    match: /^hpi$|present illness/,
    set: {
      normal: "Symptoms stable. Compliant with current therapy. No red-flag symptoms.",
      others: [
        "Acute onset",
        "Insidious onset over weeks",
        "Associated fever",
        "Associated cough / SOB",
        "No chest pain / syncope",
        "No vomiting / diarrhea",
        "Taking home meds regularly",
      ],
    },
  },
];

function setFor(field: SpecialtyField): FindingSet | undefined {
  const id = field.id.toLowerCase();
  const label = field.label.toLowerCase();
  return FINDINGS.find((f) => f.match.test(id) || f.match.test(label))?.set;
}

/** Chips shown above a textarea — normal first. */
export function quickFindingsFor(field: SpecialtyField): string[] {
  const set = setFor(field);
  if (!set) return [];
  return [set.normal, ...set.others];
}

/** The phrase used when the doctor taps Mark all normal. */
export function normalFindingFor(field: SpecialtyField): string | undefined {
  return setFor(field)?.normal;
}
