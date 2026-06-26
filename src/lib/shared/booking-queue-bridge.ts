import type { QueueVisitMode } from "@/lib/doctor-live-queue";
import {
  getLiveQueueState,
  LIVE_QUEUE_EVENT,
  pushBookingRequestFromPatient,
} from "@/lib/doctor-live-queue";
import type { PatientBooking } from "@/lib/patient-booking-store";
import {
  appendClinicalEvent,
  demoPanelPatientId,
} from "@/lib/shared/clinical-event-log";

export type QueueMetrics = {
  queuePosition?: number;
  queueTotal?: number;
  estimatedWait?: number;
  pendingApproval?: boolean;
};

/** Wire patient booking → doctor AWQ bookingRequests inbox. */
export function bridgePatientBookingToDoctorQueue(
  booking: PatientBooking,
  meta: { reason: string; visitType?: string },
): void {
  const panelPatientId = demoPanelPatientId();
  const mode: QueueVisitMode =
    meta.visitType === "video" ? "Video" : "In-person";

  pushBookingRequestFromPatient({
    bookingId: booking.id,
    patientId: panelPatientId,
    time: booking.time,
    mode,
    reason: meta.reason.trim() || "Scheduled visit via patient app",
  });

  appendClinicalEvent({
    kind: "appointment_booked",
    patientId: panelPatientId,
    panelPatientId,
    title: "Appointment booked",
    detail: `${booking.dateKey} ${booking.time} · ${meta.reason}`,
    severity: "info",
    meta: { bookingId: booking.id, doctorId: booking.doctorId },
  });
}

/** Resolve live queue position from doctor AWQ — replaces synthetic countdown math. */
export function resolveQueueMetricsForPanelPatient(
  panelPatientId: string,
): QueueMetrics {
  const state = getLiveQueueState();
  const active = state.entries.filter(
    (e) => e.status === "waiting" || e.status === "serving",
  );
  const sorted = [...active].sort((a, b) => a.token - b.token);
  const idx = sorted.findIndex((e) => e.patientId === panelPatientId);

  if (idx >= 0) {
    const ahead = sorted.slice(0, idx).filter((e) => e.status === "waiting").length;
    const serving = sorted.some((e) => e.status === "serving");
    return {
      queuePosition: idx + 1,
      queueTotal: sorted.length,
      estimatedWait: Math.max(0, ahead + (serving ? 1 : 0)) * 8,
    };
  }

  const pending = state.bookingRequests.some((r) => r.patientId === panelPatientId);
  if (pending) {
    return {
      queuePosition: sorted.length + 1,
      queueTotal: sorted.length + 1,
      estimatedWait: (sorted.length + 1) * 8,
      pendingApproval: true,
    };
  }

  return {};
}

export function subscribeDoctorQueue(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(LIVE_QUEUE_EVENT, onChange);
  return () => window.removeEventListener(LIVE_QUEUE_EVENT, onChange);
}
