import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, Printer, Smartphone, X } from "lucide-react";
import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import type { PrescriptionDraft } from "@/lib/doctor-prescription-workflow";
import { printPrescriptionDocument } from "@/lib/prescription-print";
import { PrescriptionPreviewDocument } from "./PrescriptionPreviewSheet";

export type DispatchTarget = "pharmacy" | "patient" | "both";

export type DispatchConfirmationData = {
  rxNumber: string;
  target: DispatchTarget;
  patientName: string;
  pharmacyName?: string;
  diagnosis: string;
  medications: string[];
  sentAt: string;
  draft: PrescriptionDraft;
  patient: PanelPatient;
};

type Props = {
  data: DispatchConfirmationData;
  onClose: () => void;
  onWriteAnother: () => void;
};

function targetLabel(target: DispatchTarget): string {
  if (target === "pharmacy") return "Pharmacy only";
  if (target === "patient") return "Patient app only";
  return "Pharmacy & patient";
}

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REDIRECT_SECONDS = 5;

function redirectLabel(): string {
  return "sent prescription";
}

export function PrescriptionDispatchConfirmation({ data, onClose, onWriteAnother }: Props) {
  const printMountRef = useRef<HTMLDivElement>(null);
  const redirectCancelled = useRef(false);
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const goToPrescriptionPage = () => {
    void navigate({
      to: "/doctor/prescriptions",
      search: { view: "sent", rxId: data.rxNumber },
    });
  };

  const cancelAutoRedirect = () => {
    redirectCancelled.current = true;
  };

  const handleClose = () => {
    cancelAutoRedirect();
    onClose();
  };

  const handleWriteAnother = () => {
    cancelAutoRedirect();
    onWriteAnother();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    redirectCancelled.current = false;
    setSecondsLeft(REDIRECT_SECONDS);

    const countdown = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      if (!redirectCancelled.current) {
        goToPrescriptionPage();
        onClose();
      }
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timeout);
    };
  }, [data.rxNumber, data.target, onClose]);

  const handlePrint = () => {
    requestAnimationFrame(() => {
      printPrescriptionDocument();
    });
  };

  const sentToPharmacy = data.target === "pharmacy" || data.target === "both";
  const sentToPatient = data.target === "patient" || data.target === "both";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rx-dispatch-confirmation-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1B3B2E]/60 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-label="Close confirmation"
      />

      <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
        <div className="shrink-0 border-b border-[#EDEAE6] bg-gradient-to-b from-[#F4FAF8] to-white px-5 pb-4 pt-6 text-center sm:px-6 sm:pt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E8F4F1] ring-4 ring-[#E8F4F1]/80">
            <CheckCircle2 className="h-9 w-9 text-[#2C7873]" strokeWidth={2.25} />
          </div>
          <h2 id="rx-dispatch-confirmation-title" className="mt-4 font-serif text-xl font-semibold text-[#1B3B2E]">
            Prescription sent
          </h2>
          <p className="mt-1 text-sm text-[#5C635F]">E-prescription delivered successfully.</p>
          <p className="mt-3 font-mono text-lg font-bold tracking-wide text-[#1B3B2E]">{data.rxNumber}</p>
          <p className="mt-1 text-xs text-[#8A8F8C]">{formatSentAt(data.sentAt)}</p>
          <p className="mt-3 text-xs font-medium text-[#2C7873]">
            Opening {redirectLabel()} in {secondsLeft}s…
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">Delivery summary</p>

          <div className="mt-3 space-y-2">
            {sentToPharmacy ? (
              <div className="flex items-start gap-3 rounded-2xl border border-[#E8F4F1] bg-[#FAFDFC] px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E8F4F1]">
                  <Building2 className="h-4 w-4 text-[#2C7873]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1B3B2E]">Pharmacy desk</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5C635F]">
                    {data.pharmacyName ?? "Oak Haven Central Pharmacy"} — queued for dispensing
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#2C7873]" />
              </div>
            ) : null}

            {sentToPatient ? (
              <div className="flex items-start gap-3 rounded-2xl border border-[#FDF0EB] bg-[#FFFBF9] px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FDF0EB]">
                  <Smartphone className="h-4 w-4 text-[#B8735D]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1B3B2E]">Patient app</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5C635F]">
                    {data.patientName} can view this Rx under <strong>My Prescriptions</strong>
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#2C7873]" />
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-[#EDEAE6] bg-[#FAFAF8] px-3.5 py-3 text-sm">
            <div className="flex justify-between gap-2 border-b border-[#EDEAE6] pb-2">
              <span className="text-[#8A8F8C]">Patient</span>
              <span className="font-semibold text-[#1B3B2E]">{data.patientName}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#EDEAE6] py-2">
              <span className="text-[#8A8F8C]">Diagnosis</span>
              <span className="max-w-[58%] text-right font-medium text-[#1B3B2E]">{data.diagnosis}</span>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <span className="shrink-0 text-[#8A8F8C]">Medications</span>
              <span className="max-w-[58%] text-right text-[#1B3B2E]">
                {data.medications.length > 0 ? data.medications.join(" · ") : "—"}
              </span>
            </div>
            <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wide text-[#2C7873]">
              {targetLabel(data.target)}
            </p>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#EDEAE6] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={handleWriteAnother}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#1B3B2E] text-sm font-semibold text-white hover:bg-[#2C7873]"
          >
            Write another prescription
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#EDEAE6] text-sm font-medium text-[#1B3B2E] hover:bg-[#FAFAF8]"
            >
              <Printer className="h-4 w-4" />
              Print copy
            </button>
            <button
              type="button"
              onClick={() => {
                cancelAutoRedirect();
                goToPrescriptionPage();
                onClose();
              }}
              className="min-h-[44px] rounded-xl border border-[#2C7873]/30 bg-[#F4FAF8] text-sm font-medium text-[#1B3B2E] hover:bg-[#E8F4F1]"
            >
              View now
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[40px] w-full text-sm font-medium text-[#8A8F8C] hover:text-[#5C635F]"
          >
            Stay here
          </button>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#5C635F] shadow-sm hover:bg-white sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div ref={printMountRef} className="pointer-events-none fixed left-[-9999px] top-0 opacity-0" aria-hidden>
          <PrescriptionPreviewDocument patient={data.patient} draft={data.draft} rxId={data.rxNumber} />
        </div>
      </div>
    </div>
  );
}
