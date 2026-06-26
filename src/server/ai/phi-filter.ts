export type PhiFilterResult = {
  text: string;
  redactedCount: number;
  hadPhi: boolean;
};

type PhiPattern = { label: string; regex: RegExp; replacement: string };

const PHI_PATTERNS: PhiPattern[] = [
  { label: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL_REDACTED]" },
  {
    label: "phone",
    regex: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b/g,
    replacement: "[PHONE_REDACTED]",
  },
  { label: "mrn", regex: /\b(?:MRN|P|UHID)[-\s]?[A-Z0-9]{3,12}\b/gi, replacement: "[MRN_REDACTED]" },
  { label: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN_REDACTED]" },
  { label: "aadhaar", regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: "[ID_REDACTED]" },
  {
    label: "dob",
    regex: /\b(?:DOB|born|birthday)[:\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi,
    replacement: "[DOB_REDACTED]",
  },
  {
    label: "date",
    regex: /\b\d{4}-\d{2}-\d{2}\b/g,
    replacement: "[DATE_REDACTED]",
  },
  {
    label: "address",
    regex: /\b\d{1,5}\s+[A-Za-z0-9\s,.]{5,60}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Nagar|Colony)\b/gi,
    replacement: "[ADDRESS_REDACTED]",
  },
];

/** Common patient names from mock data — redact when cloud PHI is disallowed */
const KNOWN_NAMES = [
  "Arjun Kapoor",
  "Sneha Rao",
  "Priya Sharma",
  "Mohammed Ali",
  "Lakshmi Devi",
  "Ravi Kumar",
  "Anita Desai",
  "Kavitha Nair",
  "Suresh Patel",
  "Rajesh Mehta",
  "Ananya Iyer",
];

function redactNames(text: string): { text: string; count: number } {
  let out = text;
  let count = 0;
  for (const name of KNOWN_NAMES) {
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = out.match(re);
    if (matches) {
      count += matches.length;
      out = out.replace(re, "[PATIENT_NAME]");
    }
  }
  return { text: out, count };
}

export function sanitizePhiForCloud(text: string): PhiFilterResult {
  let out = text;
  let redactedCount = 0;

  for (const { regex, replacement } of PHI_PATTERNS) {
    const matches = out.match(regex);
    if (matches) {
      redactedCount += matches.length;
      out = out.replace(regex, replacement);
    }
  }

  const names = redactNames(out);
  out = names.text;
  redactedCount += names.count;

  return {
    text: out,
    redactedCount,
    hadPhi: redactedCount > 0,
  };
}

export function hashPrompt(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return `ph_${Math.abs(h).toString(16)}`;
}
