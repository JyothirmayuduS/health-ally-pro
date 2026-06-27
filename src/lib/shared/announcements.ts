/** Shared hospital-wide announcements store (localStorage). */

export type AnnouncementPriority = "normal" | "urgent" | "emergency";
export type AnnouncementTarget = "all" | "reception" | "lab" | "pharmacy" | "ipd";
export type AnnouncementStatus = "active" | "expired" | "draft";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  targetModules: AnnouncementTarget[];
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: AnnouncementStatus;
}

const KEY = "medora-announcements-v1";

const SEED: Announcement[] = [
  {
    id: "ANN-001",
    title: "Cafeteria closed for renovation this week",
    body: "The ground floor cafeteria will remain closed from Monday through Friday for renovation. Please use the canteen on the 2nd floor. Inconvenience is regretted.",
    priority: "normal",
    targetModules: ["all"],
    createdBy: "Admin User",
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 86400_000).toISOString(),
    status: "active",
  },
  {
    id: "ANN-002",
    title: "Reagent shipment delayed — conserve CBC reagent",
    body: "The scheduled reagent shipment from Roche Diagnostics has been delayed by 48 hours. Lab team: please prioritize STAT orders and defer non-urgent CBC runs where clinically safe. Supervisor approval required for all routine CBC orders until further notice.",
    priority: "urgent",
    targetModules: ["lab"],
    createdBy: "Admin User",
    createdAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 86400_000).toISOString(),
    status: "active",
  },
  {
    id: "ANN-003",
    title: "Fire drill scheduled 3 PM today — all staff please note",
    body: "A mandatory fire drill will be conducted across all floors at 3:00 PM today. All non-emergency procedures should be paused. ICU and OT teams have been separately briefed by the Safety Officer. Please guide all ambulatory patients to the nearest assembly point.",
    priority: "emergency",
    targetModules: ["all"],
    createdBy: "Admin User",
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 3600_000).toISOString(),
    status: "active",
  },
];

function load(): Announcement[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as Announcement[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function save(data: Announcement[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(data));
}

export function getAnnouncements(): Announcement[] {
  const now = new Date().toISOString();
  return load().map((a) =>
    a.status === "active" && a.expiresAt < now ? { ...a, status: "expired" } : a
  );
}

export function pushAnnouncement(data: Omit<Announcement, "id" | "status">): Announcement {
  const list = getAnnouncements();
  const ann: Announcement = {
    id: `ANN-${Date.now().toString().slice(-5)}`,
    status: "active",
    ...data,
  };
  list.unshift(ann);
  save(list);
  return ann;
}

export function expireAnnouncement(id: string): void {
  const list = getAnnouncements();
  save(list.map((a) => (a.id === id ? { ...a, status: "expired" } : a)));
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>): void {
  const list = getAnnouncements();
  save(list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

export const ANNOUNCEMENTS_EVENT = "medora-announcements-updated";

export function notifyAnnouncementsUpdated() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_EVENT));
}
