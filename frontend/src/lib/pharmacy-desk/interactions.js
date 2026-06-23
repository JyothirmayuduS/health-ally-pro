// Clinical check rule engine — mock rules driven by drug `interactionTags`,
// patient allergies / conditions / flags, and a tiny interaction matrix.

// Pairwise drug-drug interactions: severity = "major" | "moderate" | "minor"
const INTERACTION_MATRIX = [
  { tags: ["warfarin", "nsaid"],         severity: "major",
    message: "Warfarin + NSAID → significantly increased bleeding risk. Avoid or counsel + monitor INR." },
  { tags: ["warfarin", "paracetamol"],   severity: "minor",
    message: "High-dose Paracetamol may modestly increase INR with Warfarin — counsel." },
  { tags: ["ssri", "opioid"],            severity: "major",
    message: "SSRI + Tramadol/opioid with serotonergic activity → risk of serotonin syndrome." },
  { tags: ["ssri", "serotonergic"],      severity: "moderate",
    message: "Two serotonergic agents — monitor for serotonin syndrome." },
  { tags: ["ace-inhibitor", "potassium-sparing"], severity: "moderate",
    message: "ACE inhibitor + K-sparing → hyperkalemia risk." },
  { tags: ["statin", "cyp3a4-substrate"], severity: "minor",
    message: "Statin metabolism may be affected by CYP3A4 modulators — review." },
];

// Allergy mapping — allergy name (lowercase) → drug interactionTags it cross-reacts with
const ALLERGY_CROSS = [
  { allergy: "penicillin", tags: ["penicillin"],           message: "Patient is PENICILLIN-allergic." },
  { allergy: "sulfa",      tags: ["sulfonamide"],          message: "Patient is SULFA-allergic." },
  { allergy: "nsaid",      tags: ["nsaid"],                message: "Patient is NSAID-allergic." },
  { allergy: "nsaids",     tags: ["nsaid"],                message: "Patient is NSAID-allergic." },
  { allergy: "codeine",    tags: ["opioid"],               message: "Codeine allergy → caution with opioids." },
  { allergy: "aspirin",    tags: ["nsaid", "salicylate"],  message: "Aspirin allergy → caution with salicylates / NSAIDs." },
];

// Pregnancy category red flags
const PREGNANCY_FLAGS = {
  X: { severity: "major",    message: "Pregnancy category X — contraindicated in pregnancy." },
  D: { severity: "moderate", message: "Pregnancy category D — evidence of fetal risk." },
};

// Run clinical checks for a prescription against a patient and the drug catalog.
// Returns an array of structured findings; the UI groups by severity.
export function runClinicalChecks({ prescription, patient, inventory }) {
  if (!prescription || !patient) return [];
  const findings = [];

  // Build a quick map of drugs in this Rx
  const drugs = (prescription.items || []).map((it) => ({
    item: it,
    drug: inventory.find((d) => d.id === it.drugId) || null,
  }));

  // 1. ALLERGY checks
  (patient.allergies || []).forEach((al) => {
    const lower = (al || "").toLowerCase();
    const word = lower.split(/\s+/)[0];
    const match = ALLERGY_CROSS.find((a) => lower.includes(a.allergy));
    drugs.forEach(({ item, drug }) => {
      if (!drug) return;
      // direct name match (e.g. "Amoxicillin" → penicillin family)
      const tags = drug.interactionTags || [];
      const directHit =
        (match && tags.some((t) => match.tags.includes(t))) ||
        (drug.name || "").toLowerCase().includes(word);
      if (directHit) {
        findings.push({
          type: "allergy",
          severity: "major",
          drug: drug.name,
          message: `${(match && match.message) || `Allergy match: ${al}`} · do not dispense ${drug.name} without prescriber override.`,
        });
      }
    });
  });

  // 2. DRUG–DRUG interactions across all line items
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const a = drugs[i].drug, b = drugs[j].drug;
      if (!a || !b) continue;
      const ta = a.interactionTags || [], tb = b.interactionTags || [];
      INTERACTION_MATRIX.forEach((rule) => {
        const hasA = rule.tags.some((t) => ta.includes(t));
        const hasB = rule.tags.some((t) => tb.includes(t));
        // both rule tags satisfied across the two drugs (in any order)
        const matched = rule.tags.length === 2 &&
          ((ta.includes(rule.tags[0]) && tb.includes(rule.tags[1])) ||
           (ta.includes(rule.tags[1]) && tb.includes(rule.tags[0])));
        if (matched || (hasA && hasB && rule.tags.length > 2)) {
          findings.push({
            type: "interaction",
            severity: rule.severity,
            drugs: [a.name, b.name],
            message: `${a.name} + ${b.name}: ${rule.message}`,
          });
        }
      });
    }
  }

  // 2b. Cross-condition interactions (e.g. patient on Warfarin therapy + NSAID Rx)
  const condText = (patient.conditions || []).map((c) => c.toLowerCase()).join(" ");
  drugs.forEach(({ drug }) => {
    if (!drug) return;
    INTERACTION_MATRIX.forEach((rule) => {
      // if rule mentions "warfarin" and patient is on warfarin therapy, flag any drug having the other tag
      if (rule.tags.includes("warfarin") && condText.includes("warfarin")) {
        const other = rule.tags.find((t) => t !== "warfarin");
        if (other && (drug.interactionTags || []).includes(other)) {
          findings.push({
            type: "interaction",
            severity: rule.severity,
            drugs: ["Warfarin (active)", drug.name],
            message: `${drug.name} + active Warfarin therapy: ${rule.message}`,
          });
        }
      }
    });
  });

  // 3. DUPLICATE THERAPY — same generic prescribed twice
  const seen = new Map();
  drugs.forEach(({ drug }) => {
    if (!drug) return;
    const key = (drug.generic || drug.name).toLowerCase();
    if (seen.has(key)) {
      findings.push({
        type: "duplicate",
        severity: "moderate",
        drug: drug.name,
        message: `Duplicate therapy — ${drug.generic || drug.name} appears more than once on this Rx.`,
      });
    }
    seen.set(key, true);
  });

  // 4. PREGNANCY category check
  if ((patient.flags || []).includes("pregnancy")) {
    drugs.forEach(({ drug }) => {
      if (!drug) return;
      const cat = (drug.pregnancyCategory || "").toUpperCase().replace(/\/.*/, "");
      const flag = PREGNANCY_FLAGS[cat];
      if (flag) {
        findings.push({
          type: "pregnancy",
          severity: flag.severity,
          drug: drug.name,
          message: `${drug.name} (Cat ${drug.pregnancyCategory}): ${flag.message}`,
        });
      }
    });
  }

  // 5. PEDIATRIC dose check — naive: patients < 12 should not get NSAID/Tramadol
  const ageYears = patient.dob ? (Date.now() - new Date(patient.dob).getTime()) / (365.25 * 86_400_000) : 99;
  if (ageYears < 18) {
    drugs.forEach(({ drug }) => {
      if (!drug) return;
      const tags = drug.interactionTags || [];
      if (tags.includes("opioid") && ageYears < 16) {
        findings.push({
          type: "dose",
          severity: "moderate",
          drug: drug.name,
          message: `Pediatric (~${Math.round(ageYears)}y): avoid ${drug.name} (opioid) in patients <16y.`,
        });
      }
    });
  }

  // 6. HIGH-ALERT drugs always surface as info
  drugs.forEach(({ drug }) => {
    if (drug && (drug.flags || []).includes("high-alert")) {
      findings.push({
        type: "high-alert",
        severity: "info",
        drug: drug.name,
        message: `${drug.name} is a HIGH-ALERT medication — require independent double-check.`,
      });
    }
  });

  // 7. CONTROLLED substance — info banner
  drugs.forEach(({ drug }) => {
    if (drug && drug.controlled) {
      findings.push({
        type: "controlled",
        severity: "info",
        drug: drug.name,
        message: `${drug.name} is controlled (Schedule ${drug.controlled}) — log + witness signature required.`,
      });
    }
  });

  return findings;
}

export const SEVERITY_META = {
  major:    { label: "Major",    tone: "rose"   },
  moderate: { label: "Moderate", tone: "amber"  },
  minor:    { label: "Minor",    tone: "amber"  },
  info:     { label: "Info",     tone: "sky"    },
};
