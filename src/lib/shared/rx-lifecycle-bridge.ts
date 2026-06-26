import type { DoctorSentRxRecord } from "@/lib/doctor-prescription-store";
import {
  cancelPatientPrescription,
  flagPatientPrescriptionAmended,
} from "@/lib/patient-prescription-store";
import { appendClinicalEvent } from "@/lib/shared/clinical-event-log";

export function propagateRxCancellation(
  record: DoctorSentRxRecord,
  reason?: string,
): void {
  cancelPatientPrescription(record.rx_number, reason);
  appendClinicalEvent({
    kind: "rx_cancelled",
    patientId: record.panelPatientId,
    panelPatientId: record.panelPatientId,
    title: `Prescription ${record.rx_number} cancelled`,
    detail: reason?.trim() || "Cancelled by prescriber",
    severity: "warning",
    meta: { rxNumber: record.rx_number },
  });
}

export function propagateRxAmendment(record: DoctorSentRxRecord): void {
  flagPatientPrescriptionAmended(record.rx_number);
  appendClinicalEvent({
    kind: "rx_amended",
    patientId: record.panelPatientId,
    panelPatientId: record.panelPatientId,
    title: `Prescription ${record.rx_number} amended`,
    detail: "A new prescription replaces this script — do not duplicate doses.",
    severity: "warning",
    meta: { rxNumber: record.rx_number },
  });
}
