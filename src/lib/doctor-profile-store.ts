import { apkDoctor } from "@/lib/doctor-apk-data";
import {
  AWAY_REASONS,
  COVERAGE_NOTIFICATIONS,
  DEFAULT_SCHEDULE,
  DOCTOR_REFERRALS,
  type AwayReason,
  type DoctorReferral,
  type ScheduleSlot,
} from "@/lib/doctor-profile-workspace";

export const PROFILE_STORE_EVENT = "medora-doctor-profile-updated";

const STORAGE_KEY = "medora-doctor-profile-v1";

export type AvailabilityMode = "available" | "away" | "emergency";

export type NotificationCategory = "coverage" | "referral" | "results" | "system";

export type ProfileNotification = {
  id: string;
  title: string;
  body: string;
  relativeTime: string;
  unread: boolean;
  kind: "accepted" | "declined" | "request" | "ended" | "referral" | "results" | "system";
  category: NotificationCategory;
  actionTo?: string;
  actionParams?: Record<string, string>;
  group?: "today" | "week" | "older";
};

export type AwayState = {
  active: boolean;
  reason: AwayReason;
  message: string;
  pauseBookings: boolean;
  selectedPatients: string[];
  sentAt?: string;
};

export type ScheduleState = {
  room: string;
  defaultFee: number;
  slotSpacing: number;
  breakBetweenSlots: boolean;
  breakMinutes: number;
  workingDays: string[];
  slots: ScheduleSlot[];
  savedAt: string | null;
};

export type PersonalInfo = {
  name: string;
  email: string;
  specialty: string;
};

export type ProfileStoreState = {
  referrals: DoctorReferral[];
  notifications: ProfileNotification[];
  schedule: ScheduleState;
  away: AwayState;
  personal: PersonalInfo;
  availabilityMode: AvailabilityMode;
};

export const AWAY_MESSAGE_TEMPLATES: Record<AwayReason, string> = {
  emergency: `${apkDoctor.name} is on medical emergency today. Your appointment will be seen by a colleague at the same time. Please check your notification for the room number.`,
  "stepped-out": `${apkDoctor.name} stepped out briefly. A colleague may see you at your scheduled time if there is a short wait.`,
  leave: `${apkDoctor.name} is on leave today. Your appointment has been reassigned to a covering doctor. Please check your notification for details.`,
  unavailable: `${apkDoctor.name} is temporarily unavailable. Your visit may be rescheduled or seen by a colleague — we will notify you shortly.`,
};

const SEED_NOTIFICATIONS: ProfileNotification[] = [
  ...COVERAGE_NOTIFICATIONS.map((n) => ({
    ...n,
    category: "coverage" as const,
    actionTo: n.kind === "request" ? "/doctor/settings/emergency" : undefined,
    group: "older" as const,
  })),
  {
    id: "n-ref-1",
    title: "Incoming referral",
    body: "Priya Sharma — HbA1c 8.2% shared care request from Dr. Priya Sharma (GP).",
    relativeTime: "3 days ago",
    unread: true,
    kind: "referral",
    category: "referral",
    actionTo: "/doctor/settings/referrals/$referralId",
    actionParams: { referralId: "ref-priya-received" },
    group: "week",
  },
  {
    id: "n-res-1",
    title: "Critical result awaiting sign-off",
    body: "Lipid panel for Arjun Kapoor — abnormal values flagged.",
    relativeTime: "Today",
    unread: true,
    kind: "results",
    category: "results",
    actionTo: "/doctor/reports",
    group: "today",
  },
  {
    id: "n-sys-1",
    title: "Schedule published",
    body: "8 active slots · Room 3A are live for patient booking.",
    relativeTime: "Today",
    unread: false,
    kind: "system",
    category: "system",
    actionTo: "/doctor/schedule",
    group: "today",
  },
];

function defaultState(): ProfileStoreState {
  return {
    referrals: [...DOCTOR_REFERRALS],
    notifications: [...SEED_NOTIFICATIONS],
    schedule: { ...DEFAULT_SCHEDULE, savedAt: new Date().toISOString() },
    away: {
      active: false,
      reason: "emergency",
      message: AWAY_MESSAGE_TEMPLATES.emergency,
      pauseBookings: true,
      selectedPatients: [],
    },
    personal: {
      name: apkDoctor.name,
      email: apkDoctor.email,
      specialty: apkDoctor.specialty,
    },
    availabilityMode: "available",
  };
}

function load(): ProfileStoreState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as ProfileStoreState;
    return {
      ...defaultState(),
      ...parsed,
      schedule: { ...defaultState().schedule, ...parsed.schedule },
      away: { ...defaultState().away, ...parsed.away },
      personal: { ...defaultState().personal, ...parsed.personal },
    };
  } catch {
    return defaultState();
  }
}

let cache: ProfileStoreState = defaultState();

function persist(next: ProfileStoreState) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(PROFILE_STORE_EVENT));
  }
}

function emit(next: ProfileStoreState) {
  persist(next);
  return next;
}

export function getProfileStore(): ProfileStoreState {
  if (typeof window !== "undefined" && cache === defaultState()) {
    cache = load();
  }
  return cache;
}

export function subscribeProfileStore(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(PROFILE_STORE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_STORE_EVENT, handler);
}

export function referralsAwaitingCount() {
  return getProfileStore().referrals.filter((r) => r.status === "Pending").length;
}

export function unreadNotificationCount() {
  return getProfileStore().notifications.filter((n) => n.unread).length;
}

export function profileAttentionItems() {
  const store = getProfileStore();
  const items: { id: string; label: string; count: number; to: string; tone: "urgent" | "warn" | "info" }[] = [];

  const pendingRefs = store.referrals.filter((r) => r.status === "Pending").length;
  if (pendingRefs > 0) {
    items.push({
      id: "referrals",
      label: "Referrals awaiting action",
      count: pendingRefs,
      to: "/doctor/settings/referrals",
      tone: "warn",
    });
  }

  const unread = store.notifications.filter((n) => n.unread).length;
  if (unread > 0) {
    items.push({
      id: "notifications",
      label: "Unread notifications",
      count: unread,
      to: "/doctor/settings/notifications",
      tone: "urgent",
    });
  }

  const coverageReq = store.notifications.filter((n) => n.kind === "request" && n.unread).length;
  if (coverageReq > 0) {
    items.push({
      id: "coverage",
      label: "Coverage requests",
      count: coverageReq,
      to: "/doctor/settings/notifications",
      tone: "urgent",
    });
  }

  if (store.away.active) {
    items.push({
      id: "away",
      label: "Away mode active",
      count: 1,
      to: "/doctor/settings/emergency",
      tone: "warn",
    });
  }

  const dirtySchedule = store.schedule.savedAt === null;
  if (dirtySchedule) {
    items.push({
      id: "schedule",
      label: "Unsaved schedule changes",
      count: 1,
      to: "/doctor/settings/slots",
      tone: "info",
    });
  }

  return items;
}

export function getReferralById(id: string) {
  return getProfileStore().referrals.find((r) => r.id === id);
}

export function acceptReferral(id: string) {
  const store = getProfileStore();
  const referrals = store.referrals.map((r) => {
    if (r.id !== id) return r;
    return {
      ...r,
      status: "Accepted" as const,
      statusDetail: "Accepted · Patient & referring teams notified",
      history: [
        {
          id: `h-${Date.now()}`,
          title: "Referral accepted",
          actor: apkDoctor.name,
          detail: `Accepted ${r.patientName}`,
          relativeTime: "Just now",
          absoluteTime: new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          }),
          isLatest: true,
        },
        ...r.history.map((h) => ({ ...h, isLatest: false })),
      ],
    };
  });
  return emit({ ...store, referrals });
}

export function declineReferral(id: string) {
  const store = getProfileStore();
  const referrals = store.referrals.map((r) => {
    if (r.id !== id) return r;
    return {
      ...r,
      status: "Declined" as const,
      statusDetail: "Declined · Referring doctor notified",
      history: [
        {
          id: `h-${Date.now()}`,
          title: "Referral declined",
          actor: apkDoctor.name,
          relativeTime: "Just now",
          absoluteTime: new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          }),
          isLatest: true,
        },
        ...r.history.map((h) => ({ ...h, isLatest: false })),
      ],
    };
  });
  return emit({ ...store, referrals });
}

export function addReferral(input: {
  patientName: string;
  specialty: string;
  clinicalReason: string;
  facility: string;
  linkedDocument?: string;
}) {
  const store = getProfileStore();
  const id = `ref-${Date.now()}`;
  const now = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const referral: DoctorReferral = {
    id,
    patientName: input.patientName,
    facility: input.facility,
    direction: "sent",
    status: "Pending",
    specialty: input.specialty,
    fromDoctor: apkDoctor.name,
    clinicalReason: input.clinicalReason,
    linkedDocument: input.linkedDocument ?? "Clinical note",
    statusDetail: `Referral sent · To ${input.specialty} · ${input.facility}`,
    relativeTime: "Just now",
    absoluteTime: now,
    history: [
      {
        id: "h1",
        title: "Referral sent",
        actor: apkDoctor.name,
        detail: `To ${input.specialty} · ${input.facility}`,
        relativeTime: "Just now",
        absoluteTime: now,
        isLatest: true,
      },
    ],
  };
  return emit({ ...store, referrals: [referral, ...store.referrals] });
}

export function markNotificationRead(id: string) {
  const store = getProfileStore();
  return emit({
    ...store,
    notifications: store.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
  });
}

export function markAllNotificationsRead() {
  const store = getProfileStore();
  const previous = store.notifications.filter((n) => n.unread);
  emit({
    ...store,
    notifications: store.notifications.map((n) => ({ ...n, unread: false })),
  });
  return previous;
}

export function restoreNotificationsRead(ids: string[]) {
  const store = getProfileStore();
  const idSet = new Set(ids);
  return emit({
    ...store,
    notifications: store.notifications.map((n) => (idSet.has(n.id) ? { ...n, unread: true } : n)),
  });
}

export function respondToCoverageRequest(id: string, accept: boolean) {
  const store = getProfileStore();
  const notifications = store.notifications.map((n) => {
    if (n.id !== id) return n;
    return { ...n, unread: false };
  });
  notifications.unshift({
    id: `n-cov-${Date.now()}`,
    title: accept ? "Coverage accepted" : "Coverage declined",
    body: accept
      ? "You accepted the coverage request. Patients will be notified."
      : "You declined the coverage request. Requesting doctor notified.",
    relativeTime: "Just now",
    unread: false,
    kind: accept ? "accepted" : "declined",
    category: "coverage",
    group: "today",
  });
  return emit({ ...store, notifications });
}

export function updateSchedule(patch: Partial<ScheduleState>) {
  const store = getProfileStore();
  return emit({
    ...store,
    schedule: { ...store.schedule, ...patch, savedAt: null },
  });
}

export function saveSchedule() {
  const store = getProfileStore();
  return emit({
    ...store,
    schedule: { ...store.schedule, savedAt: new Date().toISOString() },
  });
}

export function resetScheduleToDefaults() {
  const store = getProfileStore();
  return emit({
    ...store,
    schedule: { ...DEFAULT_SCHEDULE, savedAt: new Date().toISOString() },
  });
}

export function isScheduleDirty() {
  return getProfileStore().schedule.savedAt === null;
}

export function slotsWithBookingConflict(slots: ScheduleSlot[]) {
  return slots.filter((s) => !s.enabled && s.bookedToday > 0);
}

export function updateAway(patch: Partial<AwayState>) {
  const store = getProfileStore();
  return emit({ ...store, away: { ...store.away, ...patch } });
}

export function activateAway(input: {
  reason: AwayReason;
  message: string;
  pauseBookings: boolean;
  patientIds: string[];
  doctorIds: string[];
}) {
  const store = getProfileStore();
  const reasonLabel = AWAY_REASONS.find((r) => r.id === input.reason)?.label ?? "Away";
  const notifications: ProfileNotification[] = [
    {
      id: `n-away-${Date.now()}`,
      title: "Coverage requests sent",
      body: `${input.doctorIds.length} colleague(s) asked to cover ${input.patientIds.length} patient(s) — ${reasonLabel}.`,
      relativeTime: "Just now",
      unread: true,
      kind: "request",
      category: "coverage",
      actionTo: "/doctor/settings/notifications",
      group: "today",
    },
    ...store.notifications,
  ];
  return emit({
    ...store,
    away: {
      active: true,
      reason: input.reason,
      message: input.message,
      pauseBookings: input.pauseBookings,
      selectedPatients: input.patientIds,
      sentAt: new Date().toISOString(),
    },
    availabilityMode: input.reason === "emergency" ? "emergency" : "away",
    notifications,
  });
}

export function clearAwayMode() {
  const store = getProfileStore();
  return emit({
    ...store,
    away: { ...store.away, active: false, sentAt: undefined },
    availabilityMode: "available",
  });
}

export function setAvailabilityMode(mode: AvailabilityMode) {
  const store = getProfileStore();
  if (mode === "available" && store.away.active) {
    return clearAwayMode();
  }
  return emit({ ...store, availabilityMode: mode });
}

export function savePersonalInfo(info: PersonalInfo) {
  const store = getProfileStore();
  return emit({ ...store, personal: info });
}

export function getAwayMessageForReason(reason: AwayReason) {
  return AWAY_MESSAGE_TEMPLATES[reason];
}
