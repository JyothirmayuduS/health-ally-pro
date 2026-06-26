import { getPanelPatient, PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";

export type QueueVisitMode = "In-person" | "Video" | "Walk-in";

export type LiveQueueEntry = {
  id: string;
  token: number;
  patientId: string;
  reason: string;
  mode: QueueVisitMode;
  status: "serving" | "waiting" | "completed";
  slot?: string;
  waitMinutes: number;
  checkInTime: string;
  checkInAt?: string;
  servingStartedAt?: string;
  calledAt?: string;
  completedLabel?: string;
  completedAt?: string;
};

export type BookingRequest = {
  id: string;
  patientId: string;
  time: string;
  mode: QueueVisitMode;
  reason: string;
  requestedAt: string;
  source: "patient-app" | "reception";
};

export type LiveQueueState = {
  accepting: boolean;
  room: string;
  entries: LiveQueueEntry[];
  bookingRequests: BookingRequest[];
};

const KEY = "medora-doctor-live-queue-v1";
export const LIVE_QUEUE_EVENT = "medora-doctor-live-queue-updated";

const SEED: LiveQueueState = {
  accepting: true,
  room: "Room 3A",
  bookingRequests: [
    {
      id: "br1",
      patientId: "p2",
      time: "10:30",
      mode: "In-person",
      reason: "Blood pressure review — home readings elevated",
      requestedAt: minutesAgoIso(6),
      source: "patient-app",
    },
    {
      id: "br2",
      patientId: "p3",
      time: "15:30",
      mode: "Video",
      reason: "Medication side effects — GI upset on metformin",
      requestedAt: minutesAgoIso(2),
      source: "patient-app",
    },
  ],
  entries: [
    {
      id: "lq3",
      token: 1,
      patientId: "p3",
      reason: "Lab results review — HbA1c + fasting glucose",
      mode: "Video",
      status: "completed",
      slot: "09:00",
      waitMinutes: 0,
      checkInTime: "08:52",
      completedLabel: "09:00 · Video",
    },
    {
      id: "lq1",
      token: 2,
      patientId: "p1",
      reason: "Asthma exacerbation — peak flow low, O₂ sat 91%",
      mode: "In-person",
      status: "serving",
      slot: "11:15",
      waitMinutes: 0,
      checkInTime: "11:02",
      checkInAt: minutesAgoIso(22),
      servingStartedAt: minutesAgoIso(18),
      calledAt: minutesAgoIso(18),
    },
    {
      id: "lq2",
      token: 3,
      patientId: "p4",
      reason: "Cardiology co-management — post-PCI day 14",
      mode: "In-person",
      status: "waiting",
      slot: "14:00",
      waitMinutes: 8,
      checkInTime: "13:48",
      checkInAt: minutesAgoIso(8),
    },
    {
      id: "lq4",
      token: 4,
      patientId: "p2",
      reason: "Walk-in — repeat BP check",
      mode: "Walk-in",
      status: "waiting",
      waitMinutes: 14,
      checkInTime: "13:42",
      checkInAt: minutesAgoIso(14),
    },
  ],
};

function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function nowTimeLabel() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function secondsSinceClockTime(clock: string, nowMs = Date.now()) {
  const [h, m] = clock.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  const then = new Date();
  then.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((nowMs - then.getTime()) / 1000));
}

function secondsSinceIso(iso?: string, nowMs = Date.now()) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
}

function checkInSeconds(entry: LiveQueueEntry, nowMs = Date.now()) {
  if (entry.checkInAt) return secondsSinceIso(entry.checkInAt, nowMs);
  return secondsSinceClockTime(entry.checkInTime, nowMs);
}

export function formatLiveClock(now = new Date()) {
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDurationParts(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return { minutes: m, seconds: s };
}

export function formatDurationHuman(totalSeconds: number) {
  const { minutes, seconds } = formatDurationParts(totalSeconds);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function formatConsultTimer(iso?: string, nowMs = Date.now()) {
  const secs = secondsSinceIso(iso, nowMs);
  const { minutes, seconds } = formatDurationParts(secs);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatWaitLive(entry: LiveQueueEntry, nowMs = Date.now()) {
  const secs = checkInSeconds(entry, nowMs);
  if (secs < 60) return `${secs}s`;
  return formatDurationHuman(secs);
}

export function formatCalledAt(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return `Called at ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatRelativeLive(iso: string, nowMs = Date.now()) {
  const secs = secondsSinceIso(iso, nowMs);
  if (secs < 8) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  return formatDurationHuman(secs) + " ago";
}

export function computeQueueStatsLive(entries: LiveQueueEntry[], nowMs = Date.now()) {
  const active = entries.filter((e) => e.status !== "completed");
  const waiting = entries.filter((e) => e.status === "waiting");
  const waitSeconds = waiting.map((e) => checkInSeconds(e, nowMs));
  const avgSeconds =
    waitSeconds.length > 0
      ? Math.round(waitSeconds.reduce((a, b) => a + b, 0) / waitSeconds.length)
      : 0;

  return {
    inLine: active.length,
    waiting: waiting.length,
    avgWaitSeconds: avgSeconds,
    avgWaitLabel: avgSeconds < 60 ? `${avgSeconds}s` : formatDurationHuman(avgSeconds),
  };
}

function minutesSinceClockTime(clock: string) {
  const [h, m] = clock.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((now.getTime() - then.getTime()) / 60_000));
}

function minutesSinceIso(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function refreshWaitTimes() {
  const state = load();
  const nowMs = Date.now();
  const entries = state.entries.map((e) => {
    if (e.status === "waiting") {
      return {
        ...e,
        waitMinutes: Math.floor(checkInSeconds(e, nowMs) / 60),
      };
    }
    return e;
  });
  if (JSON.stringify(entries) === JSON.stringify(state.entries)) return state;
  return emit({ ...state, entries });
}

export function formatRelativeMinutes(iso: string) {
  const mins = minutesSinceIso(iso);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export function formatConsultDuration(iso?: string) {
  const mins = minutesSinceIso(iso);
  if (!iso || mins < 1) return "Just started";
  if (mins === 1) return "1 min in consult";
  return `${mins} min in consult`;
}

function markServing(entry: LiveQueueEntry): LiveQueueEntry {
  const now = new Date().toISOString();
  return {
    ...entry,
    status: "serving",
    waitMinutes: 0,
    servingStartedAt: now,
    calledAt: now,
  };
}

function markCompleted(entry: LiveQueueEntry): LiveQueueEntry {
  const doneAt = nowTimeLabel();
  return {
    ...entry,
    status: "completed",
    completedAt: new Date().toISOString(),
    completedLabel: `${entry.slot ?? doneAt} · ${entry.mode}`,
  };
}

function normalizeState(state: LiveQueueState): LiveQueueState {
  return {
    ...state,
    bookingRequests: state.bookingRequests.map((r, index) => ({
      ...r,
      requestedAt: r.requestedAt ?? minutesAgoIso(8 - index * 3),
      source: r.source ?? "patient-app",
    })),
    entries: state.entries.map((e) => ({
      ...e,
      checkInAt: e.checkInAt ?? undefined,
      waitMinutes:
        e.status === "waiting"
          ? Math.floor(checkInSeconds(e) / 60)
          : e.waitMinutes,
    })),
  };
}

function load(): LiveQueueState {
  if (typeof window === "undefined") return structuredClone(SEED);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = normalizeState(structuredClone(SEED));
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalizeState(JSON.parse(raw) as LiveQueueState);
  } catch {
    return normalizeState(structuredClone(SEED));
  }
}

function save(state: LiveQueueState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(LIVE_QUEUE_EVENT));
}

function emit(state: LiveQueueState) {
  save(state);
  return state;
}

export function getLiveQueueState(): LiveQueueState {
  return load();
}

export function resetLiveQueueState() {
  return emit(structuredClone(SEED));
}

export function setAccepting(accepting: boolean) {
  const state = load();
  return emit({ ...state, accepting });
}

export function dismissBookingRequest(requestId: string) {
  const state = load();
  return emit({
    ...state,
    bookingRequests: state.bookingRequests.filter((r) => r.id !== requestId),
  });
}

/** Patient-app booking → doctor AWQ bookingRequests inbox (bidirectional bridge). */
export function pushBookingRequestFromPatient(input: {
  bookingId: string;
  patientId: string;
  time: string;
  mode: QueueVisitMode;
  reason: string;
}): LiveQueueState {
  const state = load();
  const requestId = `br-${input.bookingId}`;
  if (state.bookingRequests.some((r) => r.id === requestId)) return state;

  const request: BookingRequest = {
    id: requestId,
    patientId: input.patientId,
    time: input.time,
    mode: input.mode,
    reason: input.reason,
    requestedAt: new Date().toISOString(),
    source: "patient-app",
  };

  return emit({
    ...state,
    bookingRequests: [...state.bookingRequests, request],
  });
}

function nextToken(entries: LiveQueueEntry[]) {
  const max = entries.reduce((m, e) => Math.max(m, e.token), 0);
  return max + 1;
}

export function addPatientToQueue(input: {
  patientId: string;
  reason: string;
  mode?: QueueVisitMode;
  slot?: string;
}): { state: LiveQueueState; token: number | null; alreadyInQueue: boolean } {
  const state = load();
  const active = state.entries.find(
    (e) =>
      e.patientId === input.patientId &&
      (e.status === "waiting" || e.status === "serving"),
  );
  if (active) return { state, token: active.token, alreadyInQueue: true };

  const checkInTime = nowTimeLabel();
  const checkInAt = new Date().toISOString();
  const token = nextToken(state.entries);
  const entry: LiveQueueEntry = {
    id: `lq-${Date.now()}`,
    token,
    patientId: input.patientId,
    reason: input.reason,
    mode: input.mode ?? "In-person",
    status: "waiting",
    slot: input.slot,
    waitMinutes: 0,
    checkInTime,
    checkInAt,
  };

  const next = emit({
    ...state,
    entries: [...state.entries, entry],
  });
  return { state: next, token, alreadyInQueue: false };
}

export function approveBookingRequest(requestId: string) {
  const state = load();
  const request = state.bookingRequests.find((r) => r.id === requestId);
  if (!request) return { state, token: null as number | null };

  const checkInTime = nowTimeLabel();
  const checkInAt = new Date().toISOString();
  const token = nextToken(state.entries);
  const entry: LiveQueueEntry = {
    id: `lq-${Date.now()}`,
    token,
    patientId: request.patientId,
    reason: request.reason,
    mode: request.mode,
    status: "waiting",
    slot: request.time,
    waitMinutes: 0,
    checkInTime,
    checkInAt,
  };

  const next = emit({
    ...state,
    bookingRequests: state.bookingRequests.filter((r) => r.id !== requestId),
    entries: [...state.entries, entry],
  });
  return { state: next, token };
}

export function callNextPatient() {
  const state = load();
  const serving = state.entries.find((e) => e.status === "serving");
  const waiting = state.entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => a.token - b.token);

  if (!waiting.length) return state;

  let entries = [...state.entries];

  if (serving) {
    entries = entries.map((e) => (e.id === serving.id ? markCompleted(e) : e));
  }

  const next = waiting[0]!;
  entries = entries.map((e) => (e.id === next.id ? markServing(e) : e));

  return emit({ ...state, entries });
}

export function callPatient(entryId: string) {
  const state = load();
  const target = state.entries.find((e) => e.id === entryId && e.status === "waiting");
  if (!target) return state;

  let entries = state.entries.map((e) => {
    if (e.status === "serving") return markCompleted(e);
    if (e.id === entryId) return markServing(e);
    return e;
  });

  return emit({ ...state, entries });
}

export function completeServing() {
  const state = load();
  const serving = state.entries.find((e) => e.status === "serving");
  if (!serving) return state;

  const entries = state.entries.map((e) =>
    e.id === serving.id ? markCompleted(e) : e,
  );

  return emit({ ...state, entries });
}

export function formatDisplayToken(token: number) {
  return `Q-${String(token).padStart(2, "0")}`;
}

export function formatQueueDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function getQueuePatient(patientId: string) {
  return getPanelPatient(patientId) ?? PANEL_PATIENTS.find((p) => p.id === patientId);
}

export function getQueueAlerts(entries: LiveQueueEntry[], bookingCount: number, nowMs = Date.now()) {
  const alerts: string[] = [];
  const longWait = entries.filter(
    (e) => e.status === "waiting" && checkInSeconds(e, nowMs) >= 15 * 60,
  );
  const urgentWaiting = entries.filter((e) => {
    if (e.status !== "waiting") return false;
    const patient = getQueuePatient(e.patientId);
    return patient?.status === "Urgent";
  });

  if (bookingCount > 0) alerts.push(`${bookingCount} booking request${bookingCount > 1 ? "s" : ""} awaiting approval`);
  if (urgentWaiting.length) alerts.push(`${urgentWaiting.length} urgent patient${urgentWaiting.length > 1 ? "s" : ""} in line`);
  if (longWait.length) alerts.push(`${longWait.length} patient${longWait.length > 1 ? "s" : ""} waiting 15+ minutes`);

  return alerts;
}

export function computeQueueStats(entries: LiveQueueEntry[]) {
  const active = entries.filter((e) => e.status !== "completed");
  const waiting = entries.filter((e) => e.status === "waiting");
  const avgWait =
    waiting.length > 0
      ? Math.round(waiting.reduce((sum, e) => sum + e.waitMinutes, 0) / waiting.length)
      : 0;

  return {
    inLine: active.length,
    waiting: waiting.length,
    avgWaitMinutes: avgWait,
  };
}
