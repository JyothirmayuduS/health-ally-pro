/** Shared legal copy for public routes — replace contact emails before go-live */

export const LEGAL_LAST_UPDATED = "22 July 2026";
export const LEGAL_ENTITY = "Medora Health Technologies";
export const LEGAL_CONTACT = "legal@medora.health";
export const SALES_CONTACT = "sales@medora.health";
export const SECURITY_CONTACT = "security@medora.health";

export function salesMailto(subject: string, body?: string) {
  const q = new URLSearchParams({ subject });
  if (body) q.set("body", body);
  return `mailto:${SALES_CONTACT}?${q.toString()}`;
}

export const MEDICAL_DISCLAIMER = `
Medora is a hospital workflow and clinical documentation platform. It does not provide
medical advice, does not diagnose or treat disease, and is not a substitute for the
professional judgment of licensed clinicians. In a medical emergency, call your local
emergency number immediately. Do not delay seeking care because of information shown
in the Software.

Drug suggestions, AI assistants, order sets, and specialty templates are decision-support
aids only. Always verify against current formularies, allergies, labs, and local protocols
before acting.
`.trim();

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Agreement",
    body: `By accessing or using Medora ("Software"), you agree to these Terms on behalf of yourself
and, if applicable, the hospital or clinic that employs you ("Organization"). If you do not
agree, do not use the Software.`,
  },
  {
    title: "2. License & accounts",
    body: `Use of production features requires a valid commercial license and authorized user account.
Evaluation builds may be limited, watermarked, and must not be used for live patient care.
You are responsible for safeguarding credentials and for all activity under your account.`,
  },
  {
    title: "3. Acceptable use",
    body: `You may use the Software only for lawful healthcare operations. You must not attempt to
bypass access controls, probe other tenants' data, reverse engineer the Software except
as allowed by law, or use the Software to harm patients or violate professional ethics.`,
  },
  {
    title: "4. Clinical responsibility",
    body: `Organization clinicians remain solely responsible for diagnoses, prescriptions, procedures,
and documentation accuracy. ${LEGAL_ENTITY} does not practice medicine.`,
  },
  {
    title: "5. Data",
    body: `Organization owns its patient and operational data. ${LEGAL_ENTITY} processes data to provide
the Service under a separate Data Processing Agreement / BAA where required. Evaluation
environments may use synthetic or de-identified demo data.`,
  },
  {
    title: "6. Fees & suspension",
    body: `Fees are as stated in the order form. Failure to pay may result in suspension after notice.
Evaluation access may be revoked at any time.`,
  },
  {
    title: "7. Disclaimer & liability",
    body: `Except as required by law or a signed agreement, the Software is provided "as is".
To the maximum extent permitted by law, ${LEGAL_ENTITY}'s aggregate liability is limited
to fees paid by Organization for the Software in the twelve (12) months before the claim.`,
  },
  {
    title: "8. Contact",
    body: `Questions: ${LEGAL_CONTACT}. Sales: ${SALES_CONTACT}. Last updated: ${LEGAL_LAST_UPDATED}.`,
  },
];

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Who we are",
    body: `${LEGAL_ENTITY} provides Medora. For hospital deployments, the hospital is typically the
data controller; we act as a processor under contract.`,
  },
  {
    title: "2. Data we process",
    body: `Depending on configuration: account identity, role, audit logs, clinical documentation,
appointments, lab/pharmacy orders, billing metadata, and technical logs. We do not sell PHI.`,
  },
  {
    title: "3. Purposes",
    body: `Provide the Service, secure the platform, support licensed customers, improve reliability,
and comply with law. AI features, if enabled, are subject to PHI redaction and BAA settings.`,
  },
  {
    title: "4. Retention & security",
    body: `Retention follows Organization policy and contract. We use encryption in transit, access
controls, and audit logging. No method of transmission is 100% secure; report issues to ${LEGAL_CONTACT}.`,
  },
  {
    title: "5. Subprocessors",
    body: `Hosting, database, email, and optional AI providers may process data under written terms.
A current subprocessors list is available to licensed customers on request.`,
  },
  {
    title: "6. Your rights",
    body: `Patients should contact their hospital for access/correction requests. Hospital admins may
export or delete tenant data per contract. Last updated: ${LEGAL_LAST_UPDATED}.`,
  },
];
