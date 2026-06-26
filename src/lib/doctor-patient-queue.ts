import {
  formatDisplayToken,
  type LiveQueueEntry,
  type LiveQueueState,
} from "@/lib/doctor-live-queue";

export type PatientQueueStatus =
  | { kind: "serving"; token: string; label: string }
  | { kind: "waiting"; token: string; label: string; waitMinutes: number }
  | { kind: "completed"; token: string; label: string }
  | { kind: "none" };

export function getPatientQueueStatus(
  patientId: string,
  entries: LiveQueueEntry[],
): PatientQueueStatus {
  const active = entries.find(
    (e) => e.patientId === patientId && e.status !== "completed",
  );
  if (active) {
    const token = formatDisplayToken(active.token);
    if (active.status === "serving") {
      return { kind: "serving", token, label: `In room · ${token}` };
    }
    return {
      kind: "waiting",
      token,
      label: `Waiting · ${token}`,
      waitMinutes: active.waitMinutes,
    };
  }

  const done = entries.find(
    (e) => e.patientId === patientId && e.status === "completed",
  );
  if (done) {
    const token = formatDisplayToken(done.token);
    return { kind: "completed", token, label: `Done · ${token}` };
  }

  return { kind: "none" };
}

export function buildTodayTimeline(state: LiveQueueState) {
  const items: {
    id: string;
    time: string;
    patientId: string;
    label: string;
    reason: string;
    status: "serving" | "waiting" | "completed" | "booking";
    token?: number;
    bookingId?: string;
  }[] = [];

  for (const entry of state.entries) {
    items.push({
      id: entry.id,
      time: entry.slot ?? entry.checkInTime,
      patientId: entry.patientId,
      label: entry.status === "serving" ? "In consult" : entry.status === "waiting" ? "Waiting" : "Completed",
      reason: entry.reason,
      status: entry.status,
      token: entry.token,
    });
  }

  for (const req of state.bookingRequests) {
    items.push({
      id: req.id,
      time: req.time,
      patientId: req.patientId,
      label: "Needs approval",
      reason: req.reason,
      status: "booking",
      bookingId: req.id,
    });
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
}
