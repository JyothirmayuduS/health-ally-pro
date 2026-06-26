import { getPanelPatient } from "@/lib/doctor-patients-apk-data";
import { listActiveMedications } from "@/lib/patient-meds-store";
import {
  listClinicalEvents,
  type ClinicalEvent,
} from "@/lib/shared/clinical-event-log";

export type AdherenceRiskTier = "critical" | "warning" | "stable";

export type AdherenceTriageResult = {
  tier: AdherenceRiskTier;
  label: string;
  detail: string;
  sparkline: number[];
  panelPatientId: string;
  patientName: string;
  events48h: ClinicalEvent[];
};

const MS_48H = 48 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function isMedTakenEvent(event: ClinicalEvent): boolean {
  return event.kind === "med_adherence" && event.meta?.taken !== false;
}

function isMedMissedEvent(event: ClinicalEvent): boolean {
  return event.kind === "med_adherence" && event.meta?.taken === false;
}

/** 7-day adherence sparkline derived from clinical-event-log med_adherence tokens. */
export function buildAdherenceSparkline(
  events: ClinicalEvent[],
  prescribedDaily: number,
  nowMs = Date.now(),
): number[] {
  const spark: number[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(nowMs);
    d.setDate(d.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    const takenCount = events.filter(
      (e) => isMedTakenEvent(e) && dayKey(e.at) === key,
    ).length;
    const pct =
      prescribedDaily > 0
        ? Math.min(100, Math.round((takenCount / prescribedDaily) * 100))
        : 100;
    spark.push(pct);
  }
  return spark;
}

/** 5-second triage read model — sourced from clinical-event-log + live med state. */
export function buildAdherenceTriageForPanelPatient(
  panelPatientId: string,
  nowMs = Date.now(),
): AdherenceTriageResult {
  const patient = getPanelPatient(panelPatientId);
  const events = listClinicalEvents(panelPatientId, 250);
  const meds = listActiveMedications();
  const prescribedDaily = meds.length;
  const missedToday = meds.filter((m) => !m.taken).length;
  const takenToday = meds.filter((m) => m.taken).length;
  const medPct = prescribedDaily ? Math.round((takenToday / prescribedDaily) * 100) : 100;

  const recent48 = events.filter(
    (e) => nowMs - new Date(e.at).getTime() <= MS_48H,
  );
  const medTaken48 = recent48.filter(isMedTakenEvent).length;
  const medMissed48 = recent48.filter(isMedMissedEvent).length;
  const exercise48 = recent48.filter((e) => e.kind === "exercise_adherence").length;
  const rxSafety = recent48.filter(
    (e) => e.kind === "rx_cancelled" || e.kind === "rx_amended",
  );

  const sparkline = buildAdherenceSparkline(events, prescribedDaily, nowMs);
  const name = patient?.name ?? "Patient";

  if (
    medMissed48 >= 2 ||
    missedToday >= 2 ||
    (medTaken48 === 0 && missedToday >= 1 && prescribedDaily > 0)
  ) {
    return {
      tier: "critical",
      label: "CRITICAL Non-Adherence (48h)",
      detail: `${name} · ${missedToday} dose(s) outstanding today · PT ${exercise48 === 0 ? "skipped in 48h" : `${exercise48} session(s) in 48h`}`,
      sparkline,
      panelPatientId,
      patientName: name,
      events48h: recent48,
    };
  }

  if (medMissed48 >= 1 || missedToday >= 1 || rxSafety.length > 0) {
    const rxNote = rxSafety.length
      ? `Rx safety flag (${rxSafety[0]?.kind === "rx_cancelled" ? "cancelled" : "amended"}) · `
      : "";
    return {
      tier: "warning",
      label: "WARNING",
      detail: `${rxNote}${missedToday} dose(s) outstanding · ${medPct}% taken today`,
      sparkline,
      panelPatientId,
      patientName: name,
      events48h: recent48,
    };
  }

  return {
    tier: "stable",
    label: "STABLE",
    detail: `Meds ${medPct}% today · ${exercise48} PT session${exercise48 === 1 ? "" : "s"} in 48h`,
    sparkline,
    panelPatientId,
    patientName: name,
    events48h: recent48,
  };
}

/** Panel-wide adherence alerts for AWQ / home dashboard rows. */
export function listPanelAdherenceAlerts(nowMs = Date.now()): AdherenceTriageResult[] {
  const demoIds = ["p1", "p2", "p3"];
  return demoIds
    .map((id) => buildAdherenceTriageForPanelPatient(id, nowMs))
    .filter((t) => t.tier !== "stable")
    .sort((a, b) => {
      const rank = { critical: 0, warning: 1, stable: 2 };
      return rank[a.tier] - rank[b.tier];
    });
}
