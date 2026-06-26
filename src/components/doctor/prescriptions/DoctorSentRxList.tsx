import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, ChevronRight, FileText, Smartphone, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import {
  DOCTOR_RX_STORE_EVENT,
  listDoctorSentRx,
  medicationNamesFromDraft,
  type DoctorSentRxRecord,
} from "@/lib/doctor-prescription-store";
import { cn } from "@/lib/utils";

type Props = {
  patientFilter?: string;
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

function statusBadge(status: DoctorSentRxRecord["status"]) {
  if (status === "cancelled") return { label: "Cancelled", className: "bg-[#FDF5F4] text-[#8B3A32]" };
  if (status === "amended") return { label: "Amended", className: "bg-[#F4F0EB] text-[#7C5C3A]" };
  return { label: "Sent", className: "bg-[#E8F4F1] text-[#2C7873]" };
}

function targetIcons(target: DoctorSentRxRecord["target"]) {
  return (
    <span className="flex items-center gap-1 text-[#8A8F8C]">
      {(target === "pharmacy" || target === "both") && <Building2 className="h-3.5 w-3.5" aria-hidden />}
      {(target === "patient" || target === "both") && <Smartphone className="h-3.5 w-3.5" aria-hidden />}
    </span>
  );
}

export function DoctorSentRxList({ patientFilter }: Props) {
  const navigate = useNavigate();
  const [records, setRecords] = useState(() => listDoctorSentRx(patientFilter));

  useEffect(() => {
    const refresh = () => setRecords(listDoctorSentRx(patientFilter));
    refresh();
    window.addEventListener(DOCTOR_RX_STORE_EVENT, refresh);
    return () => window.removeEventListener(DOCTOR_RX_STORE_EVENT, refresh);
  }, [patientFilter]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl lg:max-w-4xl">
      <header className="mb-4">
        <h1 className="font-serif text-xl font-semibold text-[#1B3B2E] sm:text-2xl">Sent prescriptions</h1>
        <p className="mt-1 text-sm text-[#8A8F8C]">
          Local ledger — view, reprint, cancel, or amend without backend sync.
        </p>
      </header>

      {patientFilter ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8A8F8C]">Filtered:</span>
          <button
            type="button"
            onClick={() =>
              void navigate({ to: "/doctor/prescriptions", search: { view: "sent" } })
            }
            className="inline-flex items-center gap-1 rounded-full border border-[#EDEAE6] bg-white px-3 py-1 text-xs font-medium text-[#1B3B2E]"
          >
            {PANEL_PATIENTS.find((p) => p.id === patientFilter)?.name ?? patientFilter}
            <XCircle className="h-3.5 w-3.5 text-[#8A8F8C]" />
          </button>
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EDEAE6] bg-white px-6 py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#C5C9C6]" />
          <p className="mt-3 font-medium text-[#1B3B2E]">No sent prescriptions yet</p>
          <p className="mt-1 text-sm text-[#8A8F8C]">Complete a prescription and tap Send to see it here.</p>
          <Link
            to="/doctor/prescriptions"
            search={{ view: "write" }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#1B3B2E] px-5 text-sm font-semibold text-white"
          >
            Write prescription
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map((rx) => {
            const badge = statusBadge(rx.status);
            const meds = medicationNamesFromDraft(rx.draft);
            return (
              <li key={rx.id}>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: "/doctor/prescriptions",
                      search: { view: "sent", rxId: rx.rx_number },
                    })
                  }
                  className="flex w-full items-start gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#2C7873]/30 hover:bg-[#FAFDFC]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#1B3B2E]">{rx.rx_number}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", badge.className)}>
                        {badge.label}
                      </span>
                      {targetIcons(rx.target)}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#1B3B2E]">{rx.patientName}</p>
                    <p className="mt-0.5 text-xs text-[#8A8F8C]">{rx.draft.diagnosis || "No diagnosis"}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#5C635F]">
                      {meds.length > 0 ? meds.join(" · ") : "No medications"}
                    </p>
                    <p className="mt-2 text-[11px] text-[#ADADAD]">{formatSentAt(rx.sent_at)}</p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#C5C9C6]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
