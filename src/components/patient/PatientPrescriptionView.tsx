import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { PrescriptionPreviewDocument } from "@/components/doctor/prescriptions/PrescriptionPreviewSheet";
import type { PatientRxRecord } from "@/lib/patient-prescription-store";
import { snapshotToPanelPatient } from "@/lib/patient-prescription-store";
import { printPrescriptionDocument } from "@/lib/prescription-print";
import { cn } from "@/lib/utils";

type Props = {
  record: PatientRxRecord;
  backTo?: string;
  className?: string;
};

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PatientPrescriptionView({ record, backTo = "/prescriptions", className }: Props) {
  const patient = snapshotToPanelPatient(record.patientSnapshot, {
    patientId: record.patientId,
    panelPatientId: record.panelPatientId,
  });

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to={backTo}
            className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-2"
            aria-label="Back to prescriptions"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="label-eyebrow">E-prescription</p>
            <h1 className="mt-1 font-serif text-2xl tracking-tight sm:text-3xl">{record.rx_number}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {record.doctor_name} · {formatSentAt(record.sent_at)} · {record.draft.lines.length} medication
              {record.draft.lines.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => printPrescriptionDocument(record.rx_number)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-full border border-border bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 sm:self-center"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#E8E6E1]/40 p-2 sm:p-4 print:border-0 print:bg-white print:p-0">
        <PrescriptionPreviewDocument patient={patient} draft={record.draft} rxId={record.rx_number} />
      </div>

      <p className="text-center text-xs text-ink-muted print:hidden">
        <Download className="mr-1 inline h-3.5 w-3.5" />
        Use Print to save as PDF on your phone or computer.
      </p>
    </div>
  );
}
