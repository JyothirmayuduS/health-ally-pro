import { toast } from "sonner";

const PERM_KEY = "medora-patient-notif-perm";

export function patientNotificationsEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(PERM_KEY) === "granted";
}

export function setPatientNotificationsEnabled(granted: boolean) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PERM_KEY, granted ? "granted" : "denied");
  }
}

export async function requestPatientNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    setPatientNotificationsEnabled(true);
    return true;
  }
  if (Notification.permission === "granted") {
    setPatientNotificationsEnabled(true);
    return true;
  }
  if (Notification.permission === "denied") {
    setPatientNotificationsEnabled(false);
    return false;
  }
  const result = await Notification.requestPermission();
  const ok = result === "granted";
  setPatientNotificationsEnabled(ok);
  return ok;
}

export function notifyNewPrescription(input: {
  rxNumber: string;
  doctorName: string;
  diagnosis: string;
}) {
  toast.success("New prescription received", {
    description: `${input.rxNumber} from ${input.doctorName} — ${input.diagnosis}`,
    duration: 8000,
  });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const n = new Notification("New e-prescription", {
      body: `${input.doctorName} sent ${input.rxNumber}. ${input.diagnosis}`,
      tag: `rx-${input.rxNumber}`,
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/prescriptions/${encodeURIComponent(input.rxNumber)}`;
      n.close();
    };
  } catch {
    /* noop */
  }
}

export function notifyPatientMedicationDue(med: { name: string; dosage: string; timeLabel: string; instruction?: string }) {
  toast.message("Medication reminder", {
    description: `${med.name} ${med.dosage} — ${med.instruction ?? med.timeLabel}`,
    duration: 10000,
  });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification("Time for your medication", {
      body: `${med.name} ${med.dosage}`,
      tag: `med-${med.name}`,
    });
  } catch {
    /* noop */
  }
}
