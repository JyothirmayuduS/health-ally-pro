const CLINIC_PHONE = "+15550123456";
const CLINIC_SMS = "+15550123456";

/** Real tel/sms deep links for care team contact (no toast stubs). */
export function clinicPhoneHref() {
  return `tel:${CLINIC_PHONE}`;
}

export function clinicSmsHref(body?: string) {
  const q = body ? `?body=${encodeURIComponent(body)}` : "";
  return `sms:${CLINIC_SMS}${q}`;
}

export function doctorMessageHref(doctorName: string) {
  return {
    to: "/profile/messages" as const,
    search: { doctor: doctorName },
  };
}

export function videoVisitNotice(doctorName: string) {
  return `Video visits with ${doctorName} open in Medora Messages once your clinician starts the session.`;
}
