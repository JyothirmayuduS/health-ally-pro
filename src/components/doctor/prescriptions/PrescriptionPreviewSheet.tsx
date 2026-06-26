import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import {
  CLINIC_RX_META,
  formatPrescriptionLine,
  formatRxDate,
  getPrescriptionLocale,
  type FormattedRxLine,
} from "@/lib/doctor-prescription-format";
import {
  getRxLabels,
  tPatientInstructions,
  tPhrase,
  tSex,
  type RxLabels,
} from "@/lib/doctor-prescription-i18n";
import type { PrescriptionDraft } from "@/lib/doctor-prescription-workflow";
import { PHARMACY_OPTIONS, quickSafetyScan } from "@/lib/doctor-prescription-ai";
import { formatAllergieList, parseAllergieSubstances } from "@/lib/patient-allergy";
import { nextRxNumber } from "@/lib/pharmacy-desk/prescription-bridge";
import { printPrescriptionDocument } from "@/lib/prescription-print";
import { cn } from "@/lib/utils";

type Props = {
  patient: PanelPatient;
  draft: PrescriptionDraft;
  onClose: () => void;
};

const RX_PAD = "rx-pad-section";

function PadField({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="rx-pad-field-label">{label}</span>
      <span className={cn("rx-pad-field-value", mono && "mono")}>{value}</span>
    </div>
  );
}

function RxQrBlock({ rxId, className }: { rxId: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <div className="h-10 w-10 border border-[#a8a29e] bg-[#fdf8f0] p-0.5 sm:h-11 sm:w-11" aria-hidden>
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #1c1917 25%, transparent 25%),
              linear-gradient(-45deg, #1c1917 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1c1917 75%),
              linear-gradient(-45deg, transparent 75%, #1c1917 75%)`,
            backgroundSize: "5px 5px",
            backgroundPosition: "0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0",
            opacity: 0.85,
          }}
        />
      </div>
      <p className="max-w-[4rem] truncate font-mono text-[6px] text-[#78716c] sm:text-[7px]">{rxId}</p>
    </div>
  );
}

function MedMetaLine({ line, labels }: { line: FormattedRxLine; labels: RxLabels }) {
  const parts = [
    line.indianDose,
    line.route,
    line.durationLabel,
    ...(line.timing !== "—" ? [line.timing] : []),
    `${labels.qty} ${line.qty}`,
    line.refills,
  ];

  return <p className="rx-pad-med-meta">{parts.join(" · ")}</p>;
}

export function PrescriptionPreviewDocument({
  patient,
  draft,
  rxId: rxIdProp,
}: {
  patient: PanelPatient;
  draft: PrescriptionDraft;
  rxId?: string;
}) {
  const rxId = rxIdProp ?? nextRxNumber();
  const locale = getPrescriptionLocale(draft.printInPatientLanguage, draft.patientLanguage);
  const labels = getRxLabels(locale);
  const { date, time } = formatRxDate(draft.validFrom);
  const validUntil = formatRxDate(draft.validUntil).date;
  const pharmacy = PHARMACY_OPTIONS.find((p) => p.id === draft.pharmacyId);
  const lines = draft.lines.map((l, i) => formatPrescriptionLine(l, i, locale));
  const sexLabel = tSex(patient.gender, locale);
  const allergySubstances = parseAllergieSubstances(patient.allergyWarning);
  const draftDrugIds = draft.lines.map((l) => l.drug_id);
  const allergyConflicts = quickSafetyScan(patient, draftDrugIds).filter(
    (a) => a.severity === "critical" && a.id.startsWith("allergy-") && a.id !== "allergy-doc",
  );
  const hasAllergyConflict = allergyConflicts.length > 0;
  const diagnosisText = draft.diagnosis
    ? tPhrase(draft.diagnosis, locale)
    : labels.notRecorded;
  const adviceText = tPatientInstructions(
    draft.patientInstructions || draft.instructionTags.join(" · "),
    locale,
  );

  return (
    <article
      id="medora-rx-print"
      lang={locale}
      className={cn(
        "rx-pad-sheet rx-paper",
        locale !== "en" && "rx-paper-localized",
        "print:max-w-none print:shadow-none",
      )}
    >
      <div className="rx-pad-margin" aria-hidden />
      <div className="rx-pad-inner">
        <div className="rx-pad-watermark" aria-hidden>
          ℞
        </div>

        {draft.printInPatientLanguage && locale !== "en" ? (
          <div className={cn("rx-pad-patient-banner", RX_PAD)}>{labels.patientCopyBanner}</div>
        ) : null}

        <header className={cn("rx-pad-letterhead", RX_PAD)}>
          <h1 className="rx-pad-hospital">{CLINIC_RX_META.hospitalName}</h1>
          <p className="rx-pad-tagline">{CLINIC_RX_META.tagline}</p>
          <div className="rx-pad-contact">
            <p>{CLINIC_RX_META.address}</p>
            <p>
              Tel: {CLINIC_RX_META.phone} · {CLINIC_RX_META.email}
            </p>
          </div>
        </header>

        <div className={cn("rx-pad-doctor-row", RX_PAD)}>
          <div className="min-w-0 flex-1">
            <p className="rx-pad-doctor-name">{CLINIC_RX_META.doctorName}</p>
            <p className="rx-pad-doctor-meta">{CLINIC_RX_META.qualifications}</p>
            <p className="rx-pad-doctor-meta">{CLINIC_RX_META.department}</p>
            <p className="rx-pad-doctor-meta">
              {labels.regNo} {CLINIC_RX_META.nmcRegNo} · {CLINIC_RX_META.stateCouncil}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="rx-pad-meta-block">
              <p>
                <strong>{labels.date}</strong> {date}
              </p>
              <p>
                <strong>{labels.time}</strong> {time}
              </p>
              <p className="mt-0.5 font-mono text-[9px]">e-Rx {rxId}</p>
            </div>
            <RxQrBlock rxId={rxId} className="hidden min-[400px]:flex" />
          </div>
        </div>

        <section className={RX_PAD}>
          <div className="rx-pad-patient-grid">
            <PadField label={labels.patient} value={patient.name} className="min-[640px]:col-span-1" />
            <PadField label={labels.ageSex} value={`${patient.age} Y / ${sexLabel}`} />
            <PadField label={labels.uhid} value={patient.patientRef} mono />
            <PadField label={labels.validUntil} value={validUntil} />
          </div>
          {allergySubstances.length > 0 ? (
            <div
              className={cn(
                "rx-pad-allergy-stamp",
                !hasAllergyConflict && "rx-pad-allergy-stamp--warn",
              )}
            >
              <span>{hasAllergyConflict ? labels.allergyConflict : labels.knownAllergy}</span>
              <span>{formatAllergieList(allergySubstances)}</span>
            </div>
          ) : null}
        </section>

        <section className={cn("rx-pad-diagnosis", RX_PAD)}>
          <p className="rx-pad-diagnosis-label">{labels.diagnosis}</p>
          <p className="rx-pad-diagnosis-value">
            {diagnosisText}
            {draft.diagnosisIcd ? <span className="rx-pad-diagnosis-icd">[{draft.diagnosisIcd}]</span> : null}
          </p>
        </section>

        <section className={cn("rx-pad-rx-body", RX_PAD)}>
          <div className="rx-pad-rx-header">
            <span className="rx-pad-rx-symbol" aria-hidden>
              ℞
            </span>
            <p className="rx-pad-rx-note">{labels.rxGuideline}</p>
          </div>

          {lines.length === 0 ? (
            <p className="py-6 text-center text-[11px] italic text-[#78716c]">{labels.noMeds}</p>
          ) : (
            <ol className="list-none">
              {lines.map((line) => (
                <li key={line.index} className="rx-pad-med-line">
                  <p className="rx-pad-med-name">
                    <span className="rx-pad-med-index">{line.index}.</span>
                    {line.formAbbr} {line.genericUpper} {line.strength}
                    {line.controlled ? (
                      <span className="ml-1.5 border border-[#b91c1c] px-1 py-px font-mono text-[7px] font-normal text-[#b91c1c]">
                        {line.controlled}
                      </span>
                    ) : null}
                  </p>
                  <MedMetaLine line={line} labels={labels} />
                  <p className="rx-pad-med-sig">
                    {line.sig}
                    {line.substitution ? ` · ${line.substitution}` : ""}
                  </p>
                  {line.notes ? (
                    <p className="rx-pad-med-meta">
                      {labels.note}: {line.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        {(draft.patientInstructions ||
          draft.instructionTags.length > 0 ||
          draft.pharmacistNotes ||
          draft.followUpRequired ||
          pharmacy) && (
          <section className={cn("rx-pad-advice", RX_PAD)}>
            {draft.patientInstructions || draft.instructionTags.length > 0 ? (
              <p>
                <strong>{labels.advice}:</strong> {adviceText}
              </p>
            ) : null}
            {draft.pharmacistNotes ? (
              <p className="mt-1">
                <strong>{labels.toPharmacist}:</strong> {draft.pharmacistNotes}
              </p>
            ) : null}
            {draft.followUpRequired ? (
              <p className="mt-1">
                <strong>{labels.followUp}:</strong>{" "}
                {draft.followUpNote ? tPhrase(draft.followUpNote, locale) : labels.asAdvised}
              </p>
            ) : null}
            {pharmacy ? (
              <p className="mt-1">
                {labels.dispenseAt}: <strong>{pharmacy.name}</strong>
              </p>
            ) : null}
          </section>
        )}

        <footer className={cn("rx-pad-footer", RX_PAD)}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <p className="rx-pad-legal max-w-sm">{labels.footerLegal}</p>
            <div className="rx-pad-signature">
              <div className="rx-pad-sig-line">
                <p className="rx-pad-sig-script">{CLINIC_RX_META.doctorName.replace("Dr. ", "")}</p>
              </div>
              <p className="rx-pad-sig-name">{CLINIC_RX_META.doctorName}</p>
              <p className="rx-pad-sig-reg">{CLINIC_RX_META.nmcRegNo}</p>
            </div>
          </div>
          <div className="rx-pad-legal flex flex-wrap justify-between gap-1">
            <span className="font-mono">
              {rxId} · {date}
            </span>
            <span>{CLINIC_RX_META.website}</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export function PrescriptionPreviewSheet({ patient, draft, onClose }: Props) {
  const handlePrint = () => {
    printPrescriptionDocument();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex min-h-0 flex-col",
        "h-dvh max-h-dvh w-full",
        "print:relative print:inset-auto print:z-auto print:h-auto print:max-h-none",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Prescription preview"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#3d3a36]/70 backdrop-blur-[2px] print:hidden"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[840px] shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2 print:hidden",
          "pt-[max(0.5rem,env(safe-area-inset-top))]",
          "sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-3 md:mt-3 lg:mt-4",
        )}
      >
        <div className="min-w-0 flex-1 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4 sm:py-2.5">
          <p className="truncate text-sm font-semibold text-[#1B1B1B]">Prescription preview</p>
          <p className="truncate text-xs text-[#6B726E]">
            {patient.name} · {draft.lines.length} medication{draft.lines.length === 1 ? "" : "s"}
            {draft.printInPatientLanguage ? (
              <span className="text-[#2C7873]">
                {" "}
                · {getRxLabels(getPrescriptionLocale(true, draft.patientLanguage)).languageName}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/95 px-4 text-sm font-medium text-[#1B1B1B] shadow-lg backdrop-blur-sm hover:bg-white sm:flex-none"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-white/95 text-[#1B1B1B] shadow-lg backdrop-blur-sm hover:bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain rx-preview-desk",
          "flex items-start justify-center",
          "px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1",
          "sm:px-6 sm:pb-8",
          "print:overflow-visible print:bg-white print:p-0",
        )}
      >
        <PrescriptionPreviewDocument patient={patient} draft={draft} />
      </div>
    </div>
  );
}
