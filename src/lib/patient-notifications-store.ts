const STORAGE_KEY = "medora-patient-notifications-v1";

export type NotificationType = "appointment" | "report" | "medication" | "general";

export type PatientNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  type: NotificationType;
  to: string;
  params?: Record<string, string>;
};

const DEFAULT_NOTIFICATIONS: PatientNotification[] = [
  {
    id: "n1",
    title: "Appointment reminder",
    body: "Visit with Dr. Saanvi Reddy tomorrow at 10:00 AM",
    at: "2h ago",
    unread: true,
    type: "appointment",
    to: "/book",
  },
  {
    id: "n2",
    title: "Report shared",
    body: "Comprehensive Metabolic Panel access granted to Dr. Rajesh Mehta",
    at: "Yesterday",
    unread: true,
    type: "report",
    to: "/reports/$reportId",
    params: { reportId: "r1" },
  },
  {
    id: "n3",
    title: "Medication reminder",
    body: "Time to take Levothyroxine — 50mcg",
    at: "Yesterday",
    unread: false,
    type: "medication",
    to: "/medications",
  },
];

function load(): PatientNotification[] {
  if (typeof localStorage === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    return JSON.parse(raw) as PatientNotification[];
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

function save(list: PatientNotification[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medora-notifications-changed"));
  }
}

export function listPatientNotifications(): PatientNotification[] {
  return load();
}

export function unreadNotificationCount(): number {
  return load().filter((n) => n.unread).length;
}

export function markNotificationRead(id: string) {
  const next = load().map((n) => (n.id === id ? { ...n, unread: false } : n));
  save(next);
}

export function markAllNotificationsRead() {
  const next = load().map((n) => ({ ...n, unread: false }));
  save(next);
}

export function pushPatientNotification(
  input: Omit<PatientNotification, "id" | "unread"> & { id?: string },
) {
  const notification: PatientNotification = {
    id: input.id ?? `n-${Date.now()}`,
    unread: true,
    ...input,
  };
  save([notification, ...load()]);
}
