import {
  computeQueueStatsLive,
  formatDisplayToken,
  getQueuePatient,
  type LiveQueueEntry,
  type LiveQueueState,
} from "@/lib/doctor-live-queue";
import { apkTasks } from "@/lib/doctor-apk-data";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";

export type ClinicOverview = {
  inLine: number;
  waiting: number;
  bookingCount: number;
  completedToday: number;
  accepting: boolean;
  room: string;
  avgWaitLabel: string;
  serving: LiveQueueEntry | undefined;
  nextWaiting: LiveQueueEntry | undefined;
  urgentWaitingCount: number;
  openTasksCount: number;
  homeBadge: number;
  queueBadge: number;
};

export function computeClinicOverview(
  state: LiveQueueState,
  nowMs = Date.now(),
): ClinicOverview {
  const waiting = state.entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => a.token - b.token);
  const serving = state.entries.find((e) => e.status === "serving");
  const completedToday = state.entries.filter((e) => e.status === "completed");
  const stats = computeQueueStatsLive(state.entries, nowMs);

  const urgentWaitingCount = waiting.filter((e) => {
    const patient = getQueuePatient(e.patientId);
    return patient?.status === "Urgent";
  }).length;

  const openTasksCount = apkTasks.length;
  const bookingCount = state.bookingRequests.length;

  const homeBadge = bookingCount + urgentWaitingCount + openTasksCount;
  const queueBadge = stats.inLine + bookingCount;

  return {
    inLine: stats.inLine,
    waiting: stats.waiting,
    bookingCount,
    completedToday: completedToday.length,
    accepting: state.accepting,
    room: state.room,
    avgWaitLabel: stats.avgWaitLabel,
    serving,
    nextWaiting: waiting[0],
    urgentWaitingCount,
    openTasksCount,
    homeBadge,
    queueBadge,
  };
}

export function formatQueueBadge(count: number) {
  if (count <= 0) return null;
  if (count > 9) return "9+";
  return String(count);
}

export function panelCounts() {
  const panel = PANEL_PATIENTS.length;
  const today = PANEL_PATIENTS.filter((p) => p.categories.includes("today")).length;
  const urgent = PANEL_PATIENTS.filter((p) => p.status === "Urgent").length;
  const tasks = apkTasks.length;
  return { panel, today, urgent, tasks };
}

export function servingTokenLabel(entry?: LiveQueueEntry) {
  if (!entry) return null;
  return formatDisplayToken(entry.token);
}
