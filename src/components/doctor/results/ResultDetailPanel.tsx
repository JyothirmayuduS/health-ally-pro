import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Flag,
  History,
  NotebookPen,
  Pill,
  ScanLine,
  Send,
  Stethoscope,
  User,
  Beaker,
} from "lucide-react";
import {
  type ResultDocument,
  getResultPatientName,
  getResultPatientRef,
  getResultSeverity,
  isPatientUploadGated,
} from "@/lib/doctor-results-imaging";
import { getPanelPatient } from "@/lib/doctor-patients-apk-data";
import { ResultDocumentPreview } from "./ResultDocumentPreview";
import { PatientUploadDeclinedCard, PatientUploadIntakeCard } from "./PatientUploadIntakeCard";
import { cn } from "@/lib/utils";

const ICONS = {
  lab: Beaker,
  document: FileText,
  imaging: ScanLine,
  patient: User,
} as const;

const SEVERITY_STYLES = {
  critical: "bg-[#FCE8E6] text-[#C45C4A]",
  high: "bg-[#F5E6B8] text-[#5C4A1E]",
  borderline: "bg-[#EDEAE6] text-[#6B6B6B]",
} as const;

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-b border-[#F0EDE9] py-3.5 last:border-0">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-[#ADADAD]">{label}</p>
      <p className={cn("mt-1 text-sm", highlight ? "font-semibold text-[#B8735D]" : "text-[#1B3B2E]")}>
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-[#ADADAD]">{subtitle}</p>}
    </div>
  );
}

function CollapsibleBlock({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EDEAE6]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-[#FAFAF8] px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-[#ADADAD]">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#8A8F8C]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#8A8F8C]" />
        )}
      </button>
      {open && <div className="divide-y divide-[#F0EDE9] px-4">{children}</div>}
    </section>
  );
}

export function ResultDetailPanel({
  doc,
  variant = "page",
  onPrev,
  onNext,
  position,
  total,
  remainingReview,
  onPatientUploadAccept,
  onPatientUploadDecline,
}: {
  doc: ResultDocument;
  variant?: "page" | "sheet";
  onPrev?: () => void;
  onNext?: () => void;
  position?: number;
  total?: number;
  remainingReview?: number;
  onPatientUploadAccept?: () => void;
  onPatientUploadDecline?: () => void;
}) {
  const Icon = ICONS[doc.iconKind];
  const patient = getPanelPatient(doc.patientId);
  const patientName = getResultPatientName(doc.patientId);
  const patientRef = getResultPatientRef(doc.patientId);
  const severity = getResultSeverity(doc);
  const gated = isPatientUploadGated(doc);
  const declined = doc.patientUploadIntake === "declined";
  const canViewFull = !gated && !declined;
  const pad = variant === "sheet" ? "px-4 py-4" : "p-5";

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        variant === "sheet" ? "pb-2" : "pb-4",
      )}
    >
      <article
        className={cn(
          "overflow-hidden bg-white",
          variant === "sheet"
            ? "rounded-none shadow-none"
            : "rounded-t-[24px] border border-b-0 border-[#EDEAE6] shadow-[0_4px_24px_rgba(27,59,46,0.06)]",
        )}
      >
        {/* Queue navigation — desktop header */}
        {(onPrev || onNext) && variant === "page" && (
          <div className="flex items-center justify-between border-b border-[#F0EDE9] px-5 py-2.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A8F8C] disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            {position && total ? (
              <p className="text-[11px] font-medium text-[#ADADAD]">
                {position} of {total}
                {remainingReview != null && remainingReview > 0 && ` · ${remainingReview} to review`}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A8F8C] disabled:opacity-35"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={cn("border-b border-[#F0EDE9]", pad)}>
          <div className="flex items-start gap-3">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: doc.accent }}
            >
              <Icon className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">
                {doc.modality} · {doc.modalityClass.toUpperCase()}
              </p>
              <h2 className="font-serif text-xl font-semibold text-[#1B3B2E] sm:text-2xl">{doc.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-[#1B3B2E]">{patientName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {gated ? (
                  <span className="inline-flex rounded-full bg-[#F5E6B8] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C4A1E]">
                    Pending
                  </span>
                ) : declined ? (
                  <span className="inline-flex rounded-full bg-[#FCE8E6] px-2.5 py-0.5 text-[11px] font-semibold text-[#C45C4A]">
                    Declined
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      doc.status === "Processing"
                        ? "bg-[#F5E6B8] text-[#5C4A1E]"
                        : doc.status === "Signed off"
                          ? "bg-[#E8EFE6] text-[#1B3B2E]"
                          : "bg-[#F0DDD6] text-[#B8735D]",
                    )}
                  >
                    {doc.status}
                  </span>
                )}
                {canViewFull && severity && (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                      SEVERITY_STYLES[severity],
                    )}
                  >
                    {severity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("space-y-6", pad)}>
          {!canViewFull ? (
            <>
              {gated && (
                <section className="rounded-2xl border border-[#EDEAE6] bg-[#FAFAF8]/80 p-4">
                  <SectionHeader title="UPLOAD SUMMARY" subtitle="Visible before accept" />
                  <div className="space-y-2 text-sm text-[#1B3B2E]">
                    <p>
                      <span className="text-[#8A8F8C]">From:</span> {doc.source}
                    </p>
                    <p>
                      <span className="text-[#8A8F8C]">Received:</span> {doc.relativeTime}
                    </p>
                    <p>
                      <span className="text-[#8A8F8C]">Format:</span> {doc.fileFormat} · {doc.payloadSize}
                    </p>
                  </div>
                </section>
              )}

              <ResultDocumentPreview doc={doc} compact={variant === "sheet"} locked />

              {gated && onPatientUploadAccept && onPatientUploadDecline && (
                <PatientUploadIntakeCard
                  onAccept={onPatientUploadAccept}
                  onDecline={onPatientUploadDecline}
                  compact={variant === "sheet"}
                />
              )}

              {declined && <PatientUploadDeclinedCard />}
            </>
          ) : (
            <>
          {patient && (
            <section className="rounded-2xl border border-[#EDEAE6] bg-[#FAFAF8]/80 p-4">
              <SectionHeader title="PATIENT CONTEXT" subtitle="Linked chart record" />
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] text-[#ADADAD]">ACTIVE PROBLEM</p>
                  <p className="mt-1 text-sm font-medium text-[#1B3B2E]">{patient.condition}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] text-[#ADADAD]">DEMOGRAPHICS</p>
                  <p className="mt-1 text-sm text-[#1B3B2E]">
                    {patient.age} yrs · {patient.gender === "M" ? "Male" : "Female"} · {patientRef}
                  </p>
                </div>
                {doc.riskStratification && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-semibold tracking-[0.1em] text-[#ADADAD]">RISK</p>
                    <p className="mt-1 text-sm font-medium text-[#B8735D]">{doc.riskStratification}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {doc.analytes && doc.analytes.length > 0 && (
            <section>
              <SectionHeader title="RESULTS" subtitle="Structured values from source document" />
              <div className="overflow-hidden rounded-2xl border border-[#EDEAE6]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EDEAE6] bg-[#FAFAF8] text-[10px] font-bold tracking-[0.1em] text-[#8A8F8C]">
                      <th className="px-4 py-2.5">ANALYTE</th>
                      <th className="px-4 py-2.5 text-right">VALUE</th>
                      <th className="px-4 py-2.5 text-right">FLAG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDE9]">
                    {doc.analytes.map((a) => (
                      <tr key={a.name}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1B3B2E]">{a.name}</p>
                          <p className="text-xs text-[#ADADAD]">{a.ref}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1B3B2E]">
                          {a.value}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.flag ? (
                            <span className="rounded-full bg-[#F5E6B8] px-2 py-0.5 text-[10px] font-semibold text-[#5C4A1E]">
                              {a.flag}
                            </span>
                          ) : (
                            <span className="text-[#ADADAD]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {doc.clinicalImpression && (
            <section className="rounded-2xl bg-[#E8EFE6]/60 p-4">
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#1B3B2E]">CLINICAL IMPRESSION</p>
              <p className="mt-2 text-sm leading-relaxed text-[#1B3B2E]">{doc.clinicalImpression}</p>
            </section>
          )}

          <ResultDocumentPreview doc={doc} compact={variant === "sheet"} />

          <section>
            <SectionHeader title="CLINICAL ACTIONS" />
            <div className="flex flex-wrap gap-2">
              <Link
                to="/doctor/settings/referrals"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1B3B2E] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
                Refer
              </Link>
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: doc.patientId }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3B2E]"
              >
                <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
                Chart
              </Link>
              <Link
                to="/doctor/prescriptions"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3B2E]"
              >
                <Pill className="h-4 w-4" strokeWidth={1.75} />
                Rx
              </Link>
              <Link
                to="/doctor/encounters"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3B2E]"
              >
                <NotebookPen className="h-4 w-4" strokeWidth={1.75} />
                Note
              </Link>
            </div>
            {doc.flagged && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FCE8E6] px-4 py-2 text-sm font-semibold text-[#C45C4A]">
                <Flag className="h-4 w-4" strokeWidth={1.75} />
                Flagged for follow-up
              </p>
            )}
          </section>

          {doc.referrals && doc.referrals.length > 0 && (
            <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
                  <div>
                    <p className="text-sm font-semibold text-[#1B3B2E]">Referral history</p>
                    <p className="text-xs text-[#8A8F8C]">
                      {doc.referrals.length} for {patientName}
                    </p>
                  </div>
                </div>
                <Link to="/doctor/settings/referrals" className="text-xs font-semibold text-[#B8735D]">
                  All →
                </Link>
              </div>
              <ul className="divide-y divide-[#F0EDE9]">
                {doc.referrals.map((ref) => (
                  <li key={ref.id}>
                    <Link
                      to="/doctor/settings/referrals"
                      search={{ id: ref.id }}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-[#FAFAF8] -mx-1 px-1 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1B3B2E]">{ref.specialty}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              ref.status === "Pending"
                                ? "bg-[#F5E6B8] text-[#5C4A1E]"
                                : "bg-[#E8EFE6] text-[#1B3B2E]",
                            )}
                          >
                            {ref.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#8A8F8C]">{ref.facility}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doc.history.length > 0 && (
            <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-[#8A8F8C]" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-[#1B3B2E]">Document history</p>
                  <p className="text-xs text-[#8A8F8C]">Audit trail</p>
                </div>
              </div>
              <ul className="space-y-0">
                {doc.history.map((entry, i) => (
                  <li key={entry.id} className="grid grid-cols-[12px_1fr] gap-3">
                    <div className="relative flex justify-center">
                      {i < doc.history.length - 1 && (
                        <div className="absolute top-3 bottom-0 w-px bg-[#E0DCD6]" aria-hidden />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-1.5 h-2 w-2 rounded-full",
                          entry.isLatest ? "bg-[#1B3B2E]" : "bg-[#D4D0CB]",
                        )}
                      />
                    </div>
                    <div className="min-w-0 pb-4">
                      <p className="text-sm font-semibold text-[#1B3B2E]">{entry.action}</p>
                      <p className="text-xs text-[#ADADAD]">
                        {entry.relativeTime} · {entry.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <CollapsibleBlock title="DOCUMENT DETAILS" subtitle="Format, provenance, workflow">
            <DetailRow label="REPORT TITLE" value={doc.title} />
            <DetailRow label="ORIGINATING FACILITY" value={doc.source} />
            <DetailRow label="INBOUND CHANNEL" value={doc.channel} />
            <DetailRow label="FILE FORMAT" value={doc.fileFormat} />
            <DetailRow label="PAYLOAD SIZE" value={doc.payloadSize} />
            {doc.specimenDate && <DetailRow label="SPECIMEN / STUDY DATE" value={doc.specimenDate} />}
            {doc.receivedAt && <DetailRow label="RECEIVED IN INBOX" value={doc.receivedAt} />}
            {doc.orderingClinician && (
              <DetailRow label="ORDERING CLINICIAN" value={doc.orderingClinician} />
            )}
            {doc.inboxStatus && <DetailRow label="INBOX STATUS" value={doc.inboxStatus} />}
            {doc.chartAttachment && <DetailRow label="CHART ATTACHMENT" value={doc.chartAttachment} />}
          </CollapsibleBlock>

          <CollapsibleBlock title="RECORD IDENTIFIERS" subtitle="Audit & medico-legal traceability">
            <DetailRow label="DOCUMENT RECORD ID" value={doc.documentRecordId} />
            <DetailRow label="PATIENT CHART KEY" value={patientRef} />
            {doc.integrity && <DetailRow label="INTEGRITY" value={doc.integrity} />}
            {doc.retention && <DetailRow label="RETENTION" value={doc.retention} />}
          </CollapsibleBlock>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

export function ResultDetailEmpty() {
  return (
    <div className="hidden min-h-[480px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#E8E4DF] bg-white/60 p-12 text-center lg:flex">
      <FileText className="h-12 w-12 text-[#C4C0BA]" strokeWidth={1.5} />
      <p className="mt-4 text-base font-semibold text-[#1B3B2E]">Select a result</p>
      <p className="mt-1 max-w-xs text-sm text-[#8A8F8C]">
        Choose from the inbox to review, sign off, or file in the patient chart.
      </p>
      <p className="mt-4 hidden text-[11px] text-[#ADADAD] lg:block">
        Shortcuts: <kbd className="rounded border px-1">J</kbd> / <kbd className="rounded border px-1">K</kbd> navigate ·{" "}
        <kbd className="rounded border px-1">S</kbd> sign off
      </p>
    </div>
  );
}
