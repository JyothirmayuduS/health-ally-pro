import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Copy,
  FilePen,
  Printer,
  Smartphone,
  XCircle,
} from "lucide-react";
import { PrescriptionPreviewSheet } from "@/components/doctor/prescriptions/PrescriptionPreviewSheet";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import {
  cancelDoctorSentRx,
  DOCTOR_RX_STORE_EVENT,
  getDoctorSentRx,
  markDoctorSentRxAmended,
  medicationNamesFromDraft,
} from "@/lib/doctor-prescription-store";
import { printPrescriptionDocument } from "@/lib/prescription-print";
import { cn } from "@/lib/utils";

type Props = {
  rxId: string;
};

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DoctorSentRxDetail({ rxId }: Props) {
  const navigate = useNavigate();
  const [record, setRecord] = useState(() => getDoctorSentRx(rxId));
  const [showPreview, setShowPreview] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const refresh = () => setRecord(getDoctorSentRx(rxId));
    refresh();
    window.addEventListener(DOCTOR_RX_STORE_EVENT, refresh);
    return () => window.removeEventListener(DOCTOR_RX_STORE_EVENT, refresh);
  }, [rxId]);

  const patient = useMemo(
    () => (record ? PANEL_PATIENTS.find((p) => p.id === record.panelPatientId) : undefined),
    [record],
  );

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#EDEAE6] bg-white p-8 text-center">
        <p className="font-medium text-[#1B3B2E]">Prescription not found</p>
        <Link
          to="/doctor/prescriptions"
          search={{ view: "sent" }}
          className="mt-4 inline-flex text-sm font-semibold text-[#2C7873] underline-offset-2 hover:underline"
        >
          Back to sent list
        </Link>
      </div>
    );
  }

  const meds = medicationNamesFromDraft(record.draft);
  const isActive = record.status === "sent";

  const handleCancel = () => {
    const updated = cancelDoctorSentRx(record.rx_number, cancelReason);
    if (!updated) {
      toast.error("Could not cancel — already cancelled or amended");
      return;
    }
    toast.success("Prescription cancelled");
    setCancelOpen(false);
    setRecord(updated);
  };

  const handleAmend = () => {
    if (!isActive) {
      toast.error("Only active sent prescriptions can be amended");
      return;
    }
    markDoctorSentRxAmended(record.rx_number);
    void navigate({
      to: "/doctor/prescriptions",
      search: {
        view: "write",
        patientId: record.panelPatientId,
        amendFrom: record.rx_number,
      },
    });
    toast.message("Draft opened for amendment", {
      description: `Based on ${record.rx_number}. Send the new Rx when ready.`,
    });
  };

  const handleReprint = () => {
    setShowPreview(true);
    requestAnimationFrame(() => printPrescriptionDocument());
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl pb-8 lg:max-w-4xl">
      <button
        type="button"
        onClick={() => void navigate({ to: "/doctor/prescriptions", search: { view: "sent" } })}
        className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[#5C635F] hover:text-[#1B3B2E]"
      >
        <ArrowLeft className="h-4 w-4" />
        Sent prescriptions
      </button>

      <header className="rounded-2xl border border-[#EDEAE6] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-bold text-[#1B3B2E]">{record.rx_number}</p>
            <p className="mt-1 text-sm text-[#8A8F8C]">{formatSentAt(record.sent_at)}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase",
              record.status === "sent" && "bg-[#E8F4F1] text-[#2C7873]",
              record.status === "cancelled" && "bg-[#FDF5F4] text-[#8B3A32]",
              record.status === "amended" && "bg-[#F4F0EB] text-[#7C5C3A]",
            )}
          >
            {record.status}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-[#FAFAF8] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">Patient</p>
            <p className="font-semibold text-[#1B3B2E]">{record.patientName}</p>
            <p className="text-xs text-[#8A8F8C]">{record.patientRef}</p>
          </div>
          <div className="rounded-xl bg-[#FAFAF8] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">Diagnosis</p>
            <p className="font-medium text-[#1B3B2E]">{record.draft.diagnosis || "—"}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {(record.target === "pharmacy" || record.target === "both") && (
            <div className="flex items-center gap-2 text-sm text-[#5C635F]">
              <Building2 className="h-4 w-4 text-[#2C7873]" />
              {record.pharmacyName ?? "Pharmacy desk"}
            </div>
          )}
          {(record.target === "patient" || record.target === "both") && (
            <div className="flex items-center gap-2 text-sm text-[#5C635F]">
              <Smartphone className="h-4 w-4 text-[#B8735D]" />
              Delivered to patient app
            </div>
          )}
        </div>

        {record.status === "cancelled" && record.cancel_reason ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-[#C45C4A]/30 bg-[#FDF5F4] px-3 py-2 text-xs text-[#8B3A32]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{record.cancel_reason}</span>
          </div>
        ) : null}

        {record.amended_from_rx_number ? (
          <p className="mt-3 text-xs text-[#8A8F8C]">Amendment of {record.amended_from_rx_number}</p>
        ) : null}
      </header>

      <section className="mt-4 rounded-2xl border border-[#EDEAE6] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">Medications</p>
        <ul className="mt-3 space-y-2">
          {meds.map((m) => (
            <li key={m} className="rounded-xl border border-[#EDEAE6] px-3 py-2 text-sm text-[#1B3B2E]">
              {m}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#EDEAE6] bg-white text-sm font-semibold text-[#1B3B2E]"
        >
          <Copy className="h-4 w-4" />
          View Rx pad
        </button>
        <button
          type="button"
          onClick={handleReprint}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#EDEAE6] bg-white text-sm font-semibold text-[#1B3B2E]"
        >
          <Printer className="h-4 w-4" />
          Reprint
        </button>
        {isActive ? (
          <>
            <button
              type="button"
              onClick={handleAmend}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#1B3B2E] text-sm font-semibold text-white"
            >
              <FilePen className="h-4 w-4" />
              Amend & rewrite
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#C45C4A]/40 text-sm font-semibold text-[#8B3A32]"
            >
              <XCircle className="h-4 w-4" />
              Cancel Rx
            </button>
          </>
        ) : null}
      </div>

      {cancelOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[#1B3B2E]/50"
            onClick={() => setCancelOpen(false)}
            aria-label="Close"
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl">
            <h3 className="font-serif text-lg font-semibold text-[#1B3B2E]">Cancel prescription?</h3>
            <p className="mt-1 text-sm text-[#5C635F]">
              This marks {record.rx_number} as cancelled in your local ledger. Pharmacy/patient copies are not auto-revoked in this demo.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="mt-4 w-full rounded-xl border border-[#EDEAE6] px-3 py-2 text-sm"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#EDEAE6] text-sm font-medium"
              >
                Keep active
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[44px] rounded-xl bg-[#8B3A32] text-sm font-semibold text-white"
              >
                Cancel Rx
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPreview && patient ? (
        <PrescriptionPreviewSheet
          patient={patient}
          draft={record.draft}
          rxId={record.rx_number}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </div>
  );
}
