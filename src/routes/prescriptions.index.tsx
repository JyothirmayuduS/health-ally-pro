import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileText, Info, Pill, User, X } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  listPatientPrescriptions,
  PATIENT_RX_EVENT,
  type PatientRxRecord,
} from "@/lib/patient-prescription-store";
import { getPastMedsByDoctor } from "@/lib/book-utils";
import type { PatientMedication } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type PrescriptionsSearch = {
  doctor?: string;
};

export const Route = createFileRoute("/prescriptions/")({
  validateSearch: (search: Record<string, unknown>): PrescriptionsSearch => ({
    doctor: typeof search.doctor === "string" ? search.doctor : undefined,
  }),
  head: () => ({
    meta: [{ title: "Past Prescriptions — Medora" }],
  }),
  component: PatientPrescriptionsPage,
});

function PatientPrescriptionsPage() {
  const { doctor: doctorFilter } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [records, setRecords] = useState<PatientRxRecord[]>([]);

  const refresh = () => setRecords(listPatientPrescriptions());

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(PATIENT_RX_EVENT, onUpdate);
    return () => window.removeEventListener(PATIENT_RX_EVENT, onUpdate);
  }, []);

  const filteredRx = useMemo(
    () =>
      doctorFilter
        ? records.filter((r) => r.doctor_name === doctorFilter)
        : records,
    [records, doctorFilter],
  );

  const pastMeds = useMemo(() => getPastMedsByDoctor(doctorFilter), [doctorFilter]);
  const isEmpty = filteredRx.length === 0 && pastMeds.length === 0;

  return (
    <div className="w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <Link
        to="/health"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:mb-5"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>Health</span>
      </Link>

      <header className="mb-6 border-b border-[#EDEAE6] pb-6 sm:mb-8 lg:mb-10 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
            Clinical archive
          </p>
          <h1 className="mt-1 font-serif text-[28px] leading-tight tracking-tight text-ink sm:text-[32px] lg:text-[40px]">
            Medication History
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-[15px]">
            Review historical dosages and clinical rationale from your care team.
          </p>
        </div>

        {!isEmpty ? (
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0">
            {filteredRx.length > 0 ? (
              <span className="rounded-full border border-[#EDEAE6] bg-white px-3 py-1.5 text-xs font-medium text-ink-muted">
                {filteredRx.length} e-prescription{filteredRx.length !== 1 ? "s" : ""}
              </span>
            ) : null}
            {pastMeds.length > 0 ? (
              <span className="rounded-full border border-[#EDEAE6] bg-white px-3 py-1.5 text-xs font-medium text-ink-muted">
                {pastMeds.length} discontinued
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {doctorFilter ? (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-clay/30 bg-clay/10 px-3.5 py-3 sm:mb-6 sm:px-4 lg:max-w-xl">
          <span className="inline-flex min-w-0 items-center gap-2 text-[13px] text-ink sm:text-sm">
            <User className="h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={1.75} />
            <span className="truncate">
              Filtered by <strong className="font-semibold">{doctorFilter}</strong>
            </span>
          </span>
          <button
            type="button"
            onClick={() => navigate({ search: { doctor: undefined } })}
            className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-clay text-white"
            aria-label="Clear filter"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white px-5 py-14 text-center sm:px-8 sm:py-16">
          <Pill className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-4 font-semibold text-ink">No medication history yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            Past prescriptions from your doctors will appear here.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-8 lg:gap-10",
            filteredRx.length > 0 && pastMeds.length > 0
              ? "xl:grid-cols-2 xl:items-start"
              : "max-w-3xl",
          )}
        >
          {filteredRx.length > 0 ? (
            <section className="min-w-0">
              <SectionHeading
                icon={FileText}
                title="E-prescriptions"
                subtitle="Digital prescriptions from your visits"
              />
              <ul className="mt-4 flex flex-col gap-2.5 sm:gap-3">
                {filteredRx.map((rx) => (
                  <li key={rx.id}>
                    <ErxRow rx={rx} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {pastMeds.length > 0 ? (
            <section className="min-w-0">
              <SectionHeading
                icon={Pill}
                title="Discontinued medications"
                subtitle="Previously prescribed — no longer active"
              />
              <ul className="mt-4 flex flex-col gap-3 sm:gap-3.5">
                {pastMeds.map((med) => (
                  <li key={med.id}>
                    <PastMedicationCard med={med} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/12">
        <Icon className="h-[18px] w-[18px] text-clay" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <h2 className="font-serif text-lg text-ink sm:text-xl">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function ErxRow({ rx }: { rx: PatientRxRecord }) {
  const flagged = rx.status === "cancelled" || rx.status === "amended";
  return (
    <Link
      to="/prescriptions/$rxId"
      params={{ rxId: rx.id }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 transition-all sm:gap-4 sm:px-4 sm:py-3.5 lg:px-5",
        flagged
          ? "border-[#F5C4BC] bg-[#FFF8F7] opacity-90"
          : "border-[#EDEAE6] hover:border-clay/35 hover:shadow-[0_6px_20px_rgba(27,59,46,0.06)]",
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/12 sm:h-11 sm:w-11">
        <Pill className="h-[18px] w-[18px] text-clay" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-[11px] font-bold uppercase tracking-wide text-clay sm:text-xs">
            {rx.rx_number}
          </p>
          {rx.status === "cancelled" ? (
            <span className="rounded-full bg-[#FCE8E6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#C45C4A]">
              Cancelled — do not take
            </span>
          ) : null}
          {rx.status === "amended" ? (
            <span className="rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#B8735D]">
              Amended — see new Rx
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm font-semibold text-ink sm:text-[15px]">
          {rx.draft.diagnosis || "Prescription"}
        </p>
        <p className="truncate text-xs text-ink-muted sm:text-sm">{rx.doctor_name}</p>
        {flagged && rx.cancel_reason ? (
          <p className="mt-1 text-xs font-medium text-[#C45C4A]">{rx.cancel_reason}</p>
        ) : null}
      </div>
      <span className="hidden shrink-0 text-xs font-medium text-clay opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
        View →
      </span>
    </Link>
  );
}

function PastMedicationCard({ med }: { med: PatientMedication }) {
  return (
    <article className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/[0.04] sm:h-11 sm:w-11">
            <Pill className="h-[18px] w-[18px] text-ink" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink sm:text-[17px]">{med.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {med.dosage} · {med.frequency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#F9F7F2] px-3 py-2 text-sm text-ink sm:max-w-[220px] sm:shrink-0">
          <User className="h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={1.75} />
          <span className="truncate text-[13px]">{med.prescribedBy}</span>
        </div>
      </div>

      <div className="mt-3.5 rounded-xl border border-[#EDEAE6]/80 bg-[#F9F7F2]/80 px-3.5 py-3 sm:mt-4 sm:px-4">
        <div className="mb-1.5 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={2} />
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-clay">
            Why it was prescribed
          </p>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          {med.clinicalReason ?? med.reason}
        </p>
      </div>
    </article>
  );
}
