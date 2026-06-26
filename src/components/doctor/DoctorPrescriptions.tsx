import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Info,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { DrugMonographSheet } from "@/components/doctor/prescriptions/DrugMonographSheet";
import { PrescriptionPreviewSheet } from "@/components/doctor/prescriptions/PrescriptionPreviewSheet";
import {
  PrescriptionDispatchConfirmation,
  type DispatchConfirmationData,
} from "@/components/doctor/prescriptions/PrescriptionDispatchConfirmation";
import { PrescriptionAiAssistant } from "@/components/doctor/prescriptions/PrescriptionAiAssistant";
import { PrescriptionMobileCdssDrawer } from "@/components/doctor/prescriptions/PrescriptionMobileCdssDrawer";
import { PrescriptionMedicationCard } from "@/components/doctor/prescriptions/PrescriptionMedicationCard";
import { ChipGroup } from "@/components/doctor/prescriptions/PrescriptionChipGroup";
import { apkDoctor } from "@/lib/doctor-apk-data";
import {
  PHARMACY_OPTIONS,
  quickSafetyScan,
  type AiMedicationSuggestion,
} from "@/lib/doctor-prescription-ai";
import {
  clearStoredDraft,
  createLineFromDrug,
  defaultPrescriptionDraft,
  diagnosisSuggestionsFor,
  drugClassFor,
  FREQUENT_DRUG_IDS,
  isDrugSafeForPatient,
  lineToDoctorRx,
  loadStoredDraft,
  PATIENT_INSTRUCTION_TAGS,
  RX_TEMPLATES,
  saveStoredDraft,
  validatePrescription,
  type PrescriptionDraft,
  type PrescriptionLineDraft,
  type RxType,
} from "@/lib/doctor-prescription-workflow";
import {
  getPatientHistoryRx,
  getPatientMedications,
  PANEL_PATIENTS,
  type PanelPatient,
} from "@/lib/doctor-patients-apk-data";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import {
  pushDoctorPrescription,
  nextRxNumber,
  type DoctorRxPatient,
} from "@/lib/pharmacy-desk/prescription-bridge";
import {
  panelPatientToSnapshot,
  pushPatientPrescription,
} from "@/lib/patient-prescription-store";
import { LANGUAGE_OPTIONS } from "@/lib/doctor-prescription-i18n";
import { resolvePatientId } from "@/lib/shared/patients";
import { formatAllergieList, parseAllergieSubstances } from "@/lib/patient-allergy";
import {
  discontinueMed,
  durationDaysFromChart,
  frequencyFromChartLabel,
  listDiscontinuedMedIds,
  MED_RECON_EVENT,
  resolveDrugIdFromMedName,
} from "@/lib/doctor-med-reconciliation";
import {
  getDoctorSentRx,
  listDoctorTemplates,
  recordDoctorSentRx,
} from "@/lib/doctor-prescription-store";
import { findOpenEncounterForPatient, linkToEncounter } from "@/lib/shared/encounters";
import { cn } from "@/lib/utils";

type DoctorPrescriptionsProps = {
  initialPatientId?: string;
  amendFromRxNumber?: string;
  onDraftChange?: (draft: {
    diagnosis: string;
    diagnosisIcd?: string;
    lines: { drug_id: string; frequency: import("@/lib/doctor-prescription-workflow").RxFrequency; durationDays: number }[];
  }) => void;
  onSent?: (rxNumber: string) => void;
};

type SendTarget = "pharmacy" | "patient" | "both";

function panelToPharmacy(p: PanelPatient): DoctorRxPatient {
  return {
    id: p.id,
    name: p.name,
    mrn: p.patientRef,
    age: p.age,
    sex: p.gender,
    phone: "",
    allergies: parseAllergieSubstances(p.allergyWarning),
  };
}

function suggestionToLine(s: AiMedicationSuggestion): PrescriptionLineDraft {
  return createLineFromDrug(s.drug_id, {
    frequency: s.sig.includes("twice") ? "BD" : s.sig.includes("PRN") || s.sig.includes("as needed") ? "SOS" : "OD",
    durationDays: s.days_supply,
    refills_allowed: s.refills_allowed,
    qty_prescribed: s.qty_prescribed,
    sig: s.sig,
  });
}

export default function DoctorPrescriptions({
  initialPatientId,
  amendFromRxNumber,
  onDraftChange,
  onSent,
}: DoctorPrescriptionsProps) {
  const defaultPatient = PANEL_PATIENTS.find((p) => p.id === initialPatientId) ?? PANEL_PATIENTS[0]!;
  const [patientId, setPatientId] = useState(defaultPatient.id);

  useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  const [draft, setDraft] = useState<PrescriptionDraft>(() => {
    if (amendFromRxNumber) {
      const source = getDoctorSentRx(amendFromRxNumber);
      if (source) {
        return {
          ...source.draft,
          patientId: source.panelPatientId,
          updatedAt: new Date().toISOString(),
        };
      }
    }
    return defaultPrescriptionDraft(defaultPatient.id);
  });
  const [storedDraft, setStoredDraft] = useState<PrescriptionDraft | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [medsExpanded, setMedsExpanded] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [drugSearch, setDrugSearch] = useState("");
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dispatchConfirmation, setDispatchConfirmation] = useState<DispatchConfirmationData | null>(null);
  const [sendOptionsOpen, setSendOptionsOpen] = useState(false);
  const [monographDrugId, setMonographDrugId] = useState<string | null>(null);
  const [discontinuedIds, setDiscontinuedIds] = useState<string[]>([]);
  const drugSearchRef = useRef<HTMLInputElement>(null);
  const medicationSectionRef = useRef<HTMLDivElement>(null);

  const patient = useMemo(() => PANEL_PATIENTS.find((p) => p.id === patientId), [patientId]);
  const openEncounter = useMemo(
    () => (patient ? findOpenEncounterForPatient(patient.id) : undefined),
    [patient],
  );
  const activeMeds = useMemo(
    () =>
      patient
        ? getPatientMedications(patient.id).filter(
            (m) => m.status === "ACTIVE" && !discontinuedIds.includes(m.id),
          )
        : [],
    [patient, discontinuedIds],
  );
  const recentRx = useMemo(
    () => (patient ? getPatientHistoryRx(patient.id).slice(0, 1)[0] : undefined),
    [patient],
  );
  const diagnosisOptions = useMemo(
    () => (patient ? diagnosisSuggestionsFor(patient) : []),
    [patient],
  );
  const draftDrugIds = useMemo(() => draft.lines.map((l) => l.drug_id), [draft.lines]);
  const safetyAlerts = useMemo(
    () => (patient ? quickSafetyScan(patient, draftDrugIds) : []),
    [patient, draftDrugIds],
  );
  const criticalAlerts = safetyAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = safetyAlerts.filter((a) => a.severity === "warning");
  const missingFields = useMemo(() => validatePrescription(draft), [draft]);

  const rxDrugs = useMemo(() => DRUGS.filter((d) => d.rx_required), []);
  const filteredDrugs = useMemo(() => {
    const q = drugSearch.trim().toLowerCase();
    if (!q) return [];
    return rxDrugs.filter(
      (d) =>
        d.generic_name.toLowerCase().includes(q) ||
        d.brand_names.some((b) => b.toLowerCase().includes(q)),
    );
  }, [drugSearch, rxDrugs]);

  const updateDraft = useCallback((patch: Partial<PrescriptionDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  useEffect(() => {
    setDiscontinuedIds(listDiscontinuedMedIds(patientId));
  }, [patientId]);

  useEffect(() => {
    const refresh = () => setDiscontinuedIds(listDiscontinuedMedIds(patientId));
    window.addEventListener(MED_RECON_EVENT, refresh);
    return () => window.removeEventListener(MED_RECON_EVENT, refresh);
  }, [patientId]);

  useEffect(() => {
    const stored = loadStoredDraft(patientId);
    setStoredDraft(stored);
    setShowDraftBanner(Boolean(stored) && !amendFromRxNumber);
    if (amendFromRxNumber) {
      const source = getDoctorSentRx(amendFromRxNumber);
      if (source) {
        setDraft({
          ...source.draft,
          patientId: source.panelPatientId,
          updatedAt: new Date().toISOString(),
        });
      } else {
        setDraft(defaultPrescriptionDraft(patientId));
      }
    } else {
      setDraft(defaultPrescriptionDraft(patientId));
    }
    setDiagnosisSearch("");
    setDrugSearch("");
  }, [patientId, amendFromRxNumber]);

  useEffect(() => {
    if (openEncounter && !draft.diagnosis) {
      const suggested =
        openEncounter.soap?.assessment?.trim() ||
        openEncounter.chiefComplaint?.trim() ||
        "";
      if (suggested) {
        setDraft((d) => (d.diagnosis ? d : { ...d, diagnosis: suggested }));
      }
    }
  }, [openEncounter, draft.diagnosis]);

  useEffect(() => {
    if (draft.lines.length > 0 || draft.diagnosis) {
      saveStoredDraft(draft);
    }
  }, [draft]);

  useEffect(() => {
    onDraftChange?.({
      diagnosis: draft.diagnosis,
      diagnosisIcd: draft.diagnosisIcd,
      lines: draft.lines.map((l) => ({
        drug_id: l.drug_id,
        frequency: l.frequency,
        durationDays: l.durationDays,
      })),
    });
  }, [draft, onDraftChange]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{
        label: string;
        diagnosis: string;
        diagnosisIcd?: string;
        lines: { drug_id: string; frequency: import("@/lib/doctor-prescription-workflow").RxFrequency; durationDays: number }[];
      }>).detail;
      if (!detail) return;
      const lines = detail.lines.map((l) =>
        createLineFromDrug(l.drug_id, { frequency: l.frequency, durationDays: l.durationDays }),
      );
      updateDraft({ diagnosis: detail.diagnosis, diagnosisIcd: detail.diagnosisIcd, lines });
    };
    window.addEventListener("medora-apply-rx-template", handler);
    return () => window.removeEventListener("medora-apply-rx-template", handler);
  }, [updateDraft]);

  const addDrug = useCallback((drugId: string) => {
    setDraft((d) => {
      if (d.lines.some((l) => l.drug_id === drugId)) {
        toast.info("Already on this prescription");
        return d;
      }
      return { ...d, lines: [...d.lines, createLineFromDrug(drugId)] };
    });
    setDrugSearch("");
  }, []);

  const focusAddMedication = useCallback(() => {
    medicationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      drugSearchRef.current?.focus();
    }, 300);
    toast.message("Search for a drug above, then tap to add");
  }, []);

  const applySuggestion = useCallback((s: AiMedicationSuggestion) => {
    setDraft((d) => {
      if (d.lines.some((l) => l.drug_id === s.drug_id)) return d;
      return { ...d, lines: [...d.lines, suggestionToLine(s)] };
    });
    toast.success(`Added ${s.drug_name}`);
  }, []);

  const applyTemplate = (templateId: string) => {
    const builtin = RX_TEMPLATES.find((t) => t.id === templateId);
    const custom = listDoctorTemplates().find((t) => t.id === templateId);
    const tpl = builtin ?? custom;
    if (!tpl) return;
    const lines = tpl.lines.map((l) =>
      createLineFromDrug(l.drug_id, { frequency: l.frequency, durationDays: l.durationDays }),
    );
    updateDraft({
      diagnosis: tpl.diagnosis,
      diagnosisIcd: "diagnosisIcd" in tpl ? tpl.diagnosisIcd : undefined,
      lines,
    });
    toast.success(`Applied ${tpl.label} template`);
  };

  const renewMed = (medId: string, medName: string, frequency: string, duration: string) => {
    const drugId = resolveDrugIdFromMedName(medName);
    if (!drugId) {
      toast.error("Could not map medication to formulary — add manually");
      focusAddMedication();
      return;
    }
    setDraft((d) => {
      if (d.lines.some((l) => l.drug_id === drugId)) {
        toast.info("Already on this prescription");
        return d;
      }
      const line = createLineFromDrug(drugId, {
        frequency: frequencyFromChartLabel(frequency),
        durationDays: durationDaysFromChart(duration),
      });
      toast.success(`Renewed ${medName}`);
      return { ...d, lines: [...d.lines, line] };
    });
    void medId;
  };

  const handleDiscontinueMed = (medChartId: string, medName: string) => {
    discontinueMed(patientId, medChartId);
    setDiscontinuedIds(listDiscontinuedMedIds(patientId));
    toast.success(`${medName} marked discontinued (local)`);
  };

  const restoreDraft = () => {
    if (storedDraft) {
      setDraft(storedDraft);
      setShowDraftBanner(false);
      toast.success("Draft restored");
    }
  };

  const discardStoredDraft = () => {
    clearStoredDraft(patientId);
    setStoredDraft(null);
    setShowDraftBanner(false);
  };

  const saveDraftExplicit = () => {
    saveStoredDraft(draft);
    toast.success("Draft saved");
  };

  const dispatchPrescription = async (target: SendTarget) => {
    if (!patient) return;
    if (missingFields.length > 0) {
      toast.error(`Missing: ${missingFields.join(", ")}`);
      return;
    }
    if (criticalAlerts.length > 0) {
      toast.error("Cannot send — critical safety alert", {
        description: criticalAlerts.map((a) => a.title).join(" · "),
      });
      return;
    }

    setSending(true);
    const rxNum = nextRxNumber();
    const pharmacy = PHARMACY_OPTIONS.find((p) => p.id === draft.pharmacyId);
    const sentAt = new Date().toISOString();
    const sentDraft = { ...draft };
    const medicationNames = sentDraft.lines.map((line) => {
      const drug = DRUGS.find((d) => d.id === line.drug_id);
      return drug ? `${drug.generic_name} ${drug.strength}` : line.drug_id;
    });

    await new Promise((r) => setTimeout(r, 450));

    if (target === "pharmacy" || target === "both") {
      pushDoctorPrescription({
        id: `rx-doc-${Date.now()}`,
        rx_number: rxNum,
        patient: panelToPharmacy(patient),
        doctor_id: "d-rajesh",
        doctor_name: apkDoctor.name,
        doctor_specialty: apkDoctor.specialty,
        priority: draft.priority,
        lines: draft.lines.map(lineToDoctorRx),
        notes: [
          `Diagnosis: ${draft.diagnosis}`,
          draft.pharmacistNotes,
          draft.patientInstructions,
          draft.followUpRequired ? `Follow-up: ${draft.followUpNote || "required"}` : "",
          pharmacy ? `Route to: ${pharmacy.name}` : "",
          draft.printInPatientLanguage ? `Patient language: ${draft.patientLanguage}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        sent_at: sentAt,
      });
    }

  if (target === "patient" || target === "both") {
      pushPatientPrescription({
        rx_number: rxNum,
        patientId: resolvePatientId(patient.id),
        panelPatientId: patient.id,
        patientSnapshot: panelPatientToSnapshot(patient),
        draft: sentDraft,
        doctor_name: apkDoctor.name,
        doctor_specialty: apkDoctor.specialty,
        sent_at: sentAt,
      });
    }

    const encounter = findOpenEncounterForPatient(patient.id);
    if (encounter) {
      linkToEncounter(encounter.id, { rxId: rxNum });
    }

    recordDoctorSentRx({
      rx_number: rxNum,
      panelPatientId: patient.id,
      patientName: patient.name,
      patientRef: patient.patientRef,
      encounterId: encounter?.id,
      draft: sentDraft,
      target,
      pharmacyName: pharmacy?.name,
      sent_at: sentAt,
      amended_from_rx_number: amendFromRxNumber,
      doctor_name: apkDoctor.name,
      doctor_specialty: apkDoctor.specialty,
    });

    clearStoredDraft(patientId);
    setShowPreview(false);
    setDraft(defaultPrescriptionDraft(patientId));
    setDispatchConfirmation({
      rxNumber: rxNum,
      target,
      patientName: patient.name,
      pharmacyName: pharmacy?.name,
      diagnosis: sentDraft.diagnosis,
      medications: medicationNames,
      sentAt,
      draft: sentDraft,
      patient,
    });
    setSending(false);
    onSent?.(rxNum);
  };

  if (!patient) return null;

  const lastVisit = patient.lastSeen;
  const lastRxLabel = recentRx ? `${recentRx.monthShort} ${recentRx.day}` : "—";
  const selectedPharmacy = PHARMACY_OPTIONS.find((p) => p.id === draft.pharmacyId);
  const canDispatch = missingFields.length === 0 && criticalAlerts.length === 0 && !sending;

  const explainBlockedSend = () => {
    if (missingFields.length > 0) {
      toast.error(`Add ${missingFields.join(" and ")} before sending`);
      return;
    }
    if (criticalAlerts.length > 0) {
      toast.error("Fix safety alerts before sending", {
        description: criticalAlerts.map((a) => a.title).join(" · "),
      });
    }
  };

  const handlePrimarySend = () => {
    if (!canDispatch) {
      explainBlockedSend();
      return;
    }
    void dispatchPrescription("both");
  };

  const handleAlternateSend = (target: SendTarget) => {
    if (!canDispatch) {
      explainBlockedSend();
      return;
    }
    setSendOptionsOpen(false);
    void dispatchPrescription(target);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden pb-4 lg:max-w-4xl lg:pb-8 [scroll-padding-bottom:calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Preview action — page title lives in workspace tabs */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <h1 className="sr-only">Write prescription</h1>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-[#EDEAE6] bg-white px-4 text-sm font-medium text-[#1B3B2E]"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {amendFromRxNumber ? (
        <div className="mb-4 flex gap-2 rounded-2xl border border-[#E8F4F1] bg-[#F4FAF8] px-4 py-3 text-sm text-[#2C7873]">
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span>
            Amending <strong className="font-mono">{amendFromRxNumber}</strong> — send a new Rx when edits are complete.
          </span>
        </div>
      ) : null}

      {openEncounter ? (
        <div className="mb-4 flex gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3 text-sm text-[#5C635F] shadow-sm">
          <ClipboardList className="h-4 w-4 shrink-0 text-[#2C7873]" />
          <div className="min-w-0">
            <p className="font-semibold text-[#1B3B2E]">Open encounter {openEncounter.id}</p>
            <p className="mt-0.5 text-xs text-[#8A8F8C]">
              {openEncounter.chiefComplaint || "In consult"} · Rx will link on send
            </p>
          </div>
        </div>
      ) : null}

      {/* Draft banner */}
      {showDraftBanner && storedDraft && (
        <div className="mb-4 rounded-2xl border border-[#F0DDD6] bg-[#FDF8F5] px-4 py-3 text-sm text-[#5C635F]">
          Unsaved draft for <strong className="text-[#1B3B2E]">{patient.name}</strong>. Continue?{" "}
          <button type="button" onClick={restoreDraft} className="font-semibold text-[#B8735D] underline-offset-2 hover:underline">
            Yes
          </button>{" "}
          ·{" "}
          <button type="button" onClick={discardStoredDraft} className="font-semibold text-[#8A8F8C] underline-offset-2 hover:underline">
            Start fresh
          </button>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        {/* Patient card */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#1B3B2E]">{patient.name}</p>
              <p className="text-sm text-[#8A8F8C]">
                {patient.age}y · {patient.gender === "M" ? "Male" : "Female"} · {patient.patientRef}
              </p>
              <span className="mt-2 inline-block rounded-full bg-[#E8EFE6] px-2.5 py-0.5 text-xs font-medium text-[#1B3B2E]">
                {patient.condition}
              </span>
              <p className="mt-2 text-[11px] text-[#ADADAD]">
                Last visit {lastVisit} · Last Rx {lastRxLabel}
              </p>
            </div>
            <Link
              to="/doctor/patients/$patientId"
              params={{ patientId: patient.id }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#EDEAE6] text-[#1B3B2E]"
              aria-label="Open chart"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
          {patient.allergyWarning && (
            <div
              className={cn(
                "mt-3 flex gap-2 rounded-xl border px-3 py-2 text-xs",
                criticalAlerts.some((a) => a.id.startsWith("allergy-") && a.id !== "allergy-doc")
                  ? "border-[#C45C4A]/30 bg-[#FDF5F4] text-[#8B3A32]"
                  : "border-[#E9C46A]/40 bg-[#FFFBF0] text-[#92400E]",
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="break-words">
                <span className="font-semibold">Known allergy:</span>{" "}
                {formatAllergieList(parseAllergieSubstances(patient.allergyWarning))}
              </span>
            </div>
          )}

          {/* Patient switcher — compact */}
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PANEL_PATIENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPatientId(p.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                  p.id === patientId ? "border-[#1B3B2E] bg-[#1B3B2E] text-white" : "border-[#EDEAE6] bg-[#FAF9F7] text-[#5C635F]",
                )}
              >
                {p.initials}
              </button>
            ))}
          </div>
        </section>

        {/* Med reconciliation — active chart meds */}
        {(activeMeds.length > 0 || discontinuedIds.length > 0) && (
          <section className="rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setMedsExpanded((e) => !e)}
              className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-[#1B3B2E]">Med reconciliation</span>
              {medsExpanded ? <ChevronUp className="h-4 w-4 text-[#8A8F8C]" /> : <ChevronDown className="h-4 w-4 text-[#8A8F8C]" />}
            </button>
            {medsExpanded && (
              <ul className="border-t border-[#EDEAE6] px-4 py-3">
                {activeMeds.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-2 border-b border-[#F4F2EF] py-2.5 last:border-0">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-[#1B3B2E]">
                        {m.name} {m.strength}
                      </p>
                      <p className="text-xs text-[#8A8F8C]">
                        {m.frequency} · {m.duration}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => renewMed(m.id, m.name, m.frequency, m.duration)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E8F4F1] bg-[#FAFDFC] px-2.5 py-1 text-[11px] font-semibold text-[#2C7873]"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Renew
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscontinueMed(m.id, m.name)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#EDEAE6] px-2.5 py-1 text-[11px] font-semibold text-[#8A8F8C]"
                      >
                        <XCircle className="h-3 w-3" />
                        Stop
                      </button>
                    </div>
                  </li>
                ))}
                {discontinuedIds.length > 0 ? (
                  <li className="pt-2 text-xs text-[#ADADAD]">
                    {discontinuedIds.length} medication(s) discontinued this session (local)
                  </li>
                ) : null}
              </ul>
            )}
          </section>
        )}

        {/* Templates */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">Templates →</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[...RX_TEMPLATES, ...listDoctorTemplates().slice(0, 3)].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="shrink-0 rounded-full bg-[#B8735D] px-4 py-2 text-xs font-semibold text-white"
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Diagnosis */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <label className="block text-sm font-semibold text-[#1B3B2E]">
            Diagnosis / Indication <span className="text-[#C45C4A]">*</span>
          </label>
          <input
            value={draft.diagnosis || diagnosisSearch}
            onChange={(e) => {
              setDiagnosisSearch(e.target.value);
              updateDraft({ diagnosis: e.target.value });
            }}
            placeholder="ICD-10 or diagnosis name"
            className="mt-2 min-h-[48px] w-full rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] px-4 text-base sm:text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {diagnosisOptions.slice(0, 4).map((d) => (
              <button
                key={d.icd}
                type="button"
                onClick={() => updateDraft({ diagnosis: d.label, diagnosisIcd: d.icd })}
                className="rounded-full border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-1.5 text-xs font-medium text-[#5C635F]"
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Frequent meds */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">Frequent</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FREQUENT_DRUG_IDS.map((id) => {
              const d = DRUGS.find((x) => x.id === id);
              if (!d) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => addDrug(id)}
                  className="min-w-[7.5rem] shrink-0 snap-start rounded-2xl border border-[#C5DDD8] bg-[#E8F4F1] px-3 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-[#1B3B2E]">{d.generic_name}</p>
                  <p className="text-xs text-[#5C635F]">{d.strength}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Medication search */}
        <section ref={medicationSectionRef} className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-[#1B3B2E]">Medication</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ADADAD]" />
            <input
              ref={drugSearchRef}
              value={drugSearch}
              onChange={(e) => setDrugSearch(e.target.value)}
              placeholder="Drug, salt, or brand name"
              className="min-h-[48px] w-full rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] py-2.5 pl-10 pr-4 text-base sm:text-sm"
            />
          </div>
          {drugSearch.trim() && (
            <ul className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-[#EDEAE6]">
              {filteredDrugs.slice(0, 10).map((d) => {
                const safe = isDrugSafeForPatient(patient, d.id);
                return (
                  <li key={d.id}>
                    <div className="flex w-full min-h-[52px] items-center gap-3 px-4 py-2.5 hover:bg-[#FAF9F7]">
                      <button
                        type="button"
                        onClick={() => setMonographDrugId(d.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#EDEAE6] text-[#B8735D]"
                        aria-label="Drug info"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => addDrug(d.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-[#1B3B2E]">{d.generic_name}</span>
                          <span className="text-xs text-[#8A8F8C]">{drugClassFor(d.id)}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            safe ? "bg-[#E8F4F1] text-[#1B3B2E]" : "bg-[#FDF5F4] text-[#C45C4A]",
                          )}
                        >
                          {safe ? "Safe" : "Review"}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {draft.lines.length > 0 && (
            <p className="mt-3 text-xs text-[#8A8F8C]">{draft.lines.length} medication(s) added</p>
          )}

          <div className="mt-4 space-y-3">
            {draft.lines.map((line, idx) => (
              <PrescriptionMedicationCard
                key={line.key}
                index={idx}
                line={line}
                onChange={(next) =>
                  setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === line.key ? next : l)) }))
                }
                onRemove={() => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== line.key) }))}
                onDuplicate={() =>
                  setDraft((d) => ({
                    ...d,
                    lines: [...d.lines, { ...line, key: `line-${Date.now()}` }],
                  }))
                }
                onMoveUp={() =>
                  setDraft((d) => {
                    if (idx === 0) return d;
                    const next = [...d.lines];
                    [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
                    return { ...d, lines: next };
                  })
                }
                onMoveDown={() =>
                  setDraft((d) => {
                    if (idx >= d.lines.length - 1) return d;
                    const next = [...d.lines];
                    [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
                    return { ...d, lines: next };
                  })
                }
                canMoveUp={idx > 0}
                canMoveDown={idx < draft.lines.length - 1}
                onShowMonograph={() => setMonographDrugId(line.drug_id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={focusAddMedication}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#B8735D]/60 bg-[#FDF8F5] text-sm font-semibold text-[#B8735D] transition-colors hover:border-[#B8735D] hover:bg-[#F0DDD6]/40"
          >
            <Plus className="h-4 w-4" />
            Add another medication
          </button>
        </section>

        {/* Patient instructions */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-[#1B3B2E]">Instructions to patient</p>
          <ChipGroup
            label=""
            options={PATIENT_INSTRUCTION_TAGS}
            value={draft.instructionTags}
            onChange={(v) => {
              const tags = v as string[];
              updateDraft({
                instructionTags: tags,
                patientInstructions: tags.join(". "),
              });
            }}
            multiple
          />
          <textarea
            value={draft.patientInstructions}
            onChange={(e) => updateDraft({ patientInstructions: e.target.value })}
            rows={2}
            placeholder="Additional instructions…"
            className="mt-3 w-full rounded-2xl border border-[#EDEAE6] px-4 py-3 text-base sm:text-sm"
          />
          <p className="mt-1 text-right text-[10px] text-[#ADADAD]">{draft.patientInstructions.length} characters</p>
        </section>

        {/* Language */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <label className="flex min-h-[44px] items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#1B3B2E]">Print in patient language</span>
            <input
              type="checkbox"
              checked={draft.printInPatientLanguage}
              onChange={(e) => updateDraft({ printInPatientLanguage: e.target.checked })}
              className="h-5 w-5 accent-[#B8735D]"
            />
          </label>
          {draft.printInPatientLanguage && (
            <>
              <p className="mt-2 text-xs text-[#8A8F8C]">
                Patient copy and printout use the selected language. Drug names stay in English per NMC rules.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => updateDraft({ patientLanguage: lang.id })}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold",
                      draft.patientLanguage === lang.id
                        ? "bg-[#1B3B2E] text-white"
                        : "border border-[#EDEAE6] bg-[#FAF9F7] text-[#5C635F]",
                    )}
                  >
                    {lang.native}
                    <span className="ml-1 font-normal opacity-80">({lang.label})</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="mt-3 text-xs font-semibold text-[#B8735D] underline-offset-2 hover:underline"
              >
                Preview in{" "}
                {LANGUAGE_OPTIONS.find((l) => l.id === draft.patientLanguage)?.native ?? "selected language"}
              </button>
            </>
          )}
        </section>

        {/* Validity & metadata */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#ADADAD]">Validity & metadata</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#8A8F8C]">
              Valid from
              <input
                type="date"
                value={draft.validFrom}
                onChange={(e) => updateDraft({ validFrom: e.target.value })}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#EDEAE6] px-3 text-base sm:text-sm"
              />
            </label>
            <label className="text-xs text-[#8A8F8C]">
              Valid until
              <input
                type="date"
                value={draft.validUntil}
                onChange={(e) => updateDraft({ validUntil: e.target.value })}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#EDEAE6] px-3 text-base sm:text-sm"
              />
            </label>
          </div>
          <div className="mt-4">
            <ChipGroup
              label="Prescription type"
              options={[
                { id: "regular", label: "Regular" },
                { id: "controlled", label: "Controlled" },
                { id: "narcotic", label: "Narcotic" },
              ]}
              value={draft.rxType}
              onChange={(v) => updateDraft({ rxType: v as RxType })}
            />
          </div>
          <label className="mt-4 flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3">
            <span className="text-sm text-[#1B3B2E]">
              <span className="font-semibold">Follow-up required</span>
              <span className="mt-0.5 block text-xs text-[#8A8F8C]">
                {draft.followUpRequired ? "Follow-up will be scheduled" : "No follow-up with this Rx"}
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.followUpRequired}
              onChange={(e) => updateDraft({ followUpRequired: e.target.checked })}
              className="h-5 w-5 accent-[#B8735D]"
            />
          </label>
          <label className="mt-3 block text-xs text-[#8A8F8C]">
            Dispensing pharmacy (optional)
            <select
              value={draft.pharmacyId}
              onChange={(e) => updateDraft({ pharmacyId: e.target.value })}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#EDEAE6] px-3 text-base sm:text-sm"
            >
              {PHARMACY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs text-[#8A8F8C]">
            Notes to pharmacist
            <textarea
              value={draft.pharmacistNotes}
              onChange={(e) => updateDraft({ pharmacistNotes: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[#EDEAE6] px-3 py-2 text-base sm:text-sm"
            />
          </label>
        </section>

        {/* Desktop — full checklist */}
        <section className="hidden rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
            Ready to send checklist
          </p>

          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2 text-sm">
              {draft.diagnosis.trim() ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2C7873]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C45C4A]" />
              )}
              <span className={draft.diagnosis.trim() ? "text-[#1B3B2E]" : "text-[#C45C4A]"}>
                <span className="font-semibold">Diagnosis</span>
                {draft.diagnosis.trim() ? ` — ${draft.diagnosis}` : " — required. Add diagnosis above."}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              {draft.lines.length > 0 ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2C7873]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C45C4A]" />
              )}
              <span className={draft.lines.length > 0 ? "text-[#1B3B2E]" : "text-[#C45C4A]"}>
                <span className="font-semibold">Medication</span>
                {draft.lines.length > 0
                  ? ` — ${draft.lines.length} drug(s) on Rx`
                  : " — required. Search and add at least one drug."}
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              {criticalAlerts.length === 0 ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2C7873]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C45C4A]" />
              )}
              <span className={criticalAlerts.length === 0 ? "text-[#1B3B2E]" : "text-[#C45C4A]"}>
                <span className="font-semibold">Safety</span>
                {criticalAlerts.length === 0
                  ? " — no critical blocks"
                  : ` — ${criticalAlerts.length} critical alert(s) must be resolved`}
              </span>
            </li>
          </ul>

          {criticalAlerts.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-[#C45C4A]/30 bg-[#FDF5F4] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#C45C4A]">Must fix before sending</p>
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg bg-white/80 px-3 py-2">
                  <p className="text-sm font-semibold text-[#8B3A32]">{alert.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5C635F]">{alert.detail}</p>
                  {alert.id.startsWith("allergy-") && alert.id !== "allergy-doc" ? (
                    <p className="mt-1 text-[11px] font-medium text-[#B8735D]">
                      → Remove the conflicting drug from the medication list above.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className="mt-3 space-y-2 rounded-xl border border-[#E9A820]/30 bg-[#FFFBF0] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#92400E]">Review (does not block send)</p>
              {warningAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg bg-white/80 px-3 py-2">
                  <p className="text-sm font-semibold text-[#92400E]">{alert.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5C635F]">{alert.detail}</p>
                </div>
              ))}
            </div>
          )}

          {canDispatch && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#2C7873]">
              <CheckCircle2 className="h-4 w-4" />
              Ready to dispatch — use the buttons below.
            </p>
          )}
        </section>

        {/* Dispatch — desktop only (mobile uses sticky bar) */}
        <section className="hidden rounded-2xl border border-[#1B3B2E]/15 bg-gradient-to-b from-[#F4FAF8] to-white p-4 shadow-sm sm:p-5 lg:block">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
                Dispatch e-prescription
              </p>
              <p className="mt-1 text-sm text-[#5C635F]">
                Send this signed Rx to the pharmacy desk, the patient app, or both.
              </p>
            </div>
            <span className="mt-2 inline-flex w-fit items-center rounded-full bg-[#E8F4F1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1B3B2E] sm:mt-0">
              {draft.lines.length} med · {draft.rxType}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canDispatch}
              onClick={() => void dispatchPrescription("pharmacy")}
              className="flex min-h-[72px] flex-col items-start gap-2 rounded-2xl border border-[#EDEAE6] bg-white p-4 text-left transition-colors hover:border-[#2C7873]/40 hover:bg-[#FAFDFC] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1B3B2E]">
                <Building2 className="h-4 w-4 text-[#2C7873]" />
                Send to pharmacy
              </span>
              <span className="text-xs leading-snug text-[#8A8F8C]">
                {selectedPharmacy?.name ?? "Pharmacy desk"}
                {selectedPharmacy?.distance ? ` · ${selectedPharmacy.distance}` : ""}
              </span>
            </button>

            <button
              type="button"
              disabled={!canDispatch}
              onClick={() => void dispatchPrescription("patient")}
              className="flex min-h-[72px] flex-col items-start gap-2 rounded-2xl border border-[#EDEAE6] bg-white p-4 text-left transition-colors hover:border-[#B8735D]/40 hover:bg-[#FDF8F5] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1B3B2E]">
                <Smartphone className="h-4 w-4 text-[#B8735D]" />
                Send to patient
              </span>
              <span className="text-xs leading-snug text-[#8A8F8C]">
                {patient.name} · visible in patient app under My Prescriptions
              </span>
            </button>
          </div>

          <button
            type="button"
            disabled={!canDispatch}
            onClick={() => void dispatchPrescription("both")}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1B3B2E] text-sm font-semibold text-white transition-colors hover:bg-[#2C7873] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending prescription…" : "Send to pharmacy & patient"}
          </button>

          {!canDispatch && (
            <p className="mt-3 text-center text-xs text-[#8A8F8C]">
              {missingFields.length > 0
                ? `Complete: ${missingFields.join(", ")}`
                : criticalAlerts.length > 0
                  ? "Fix critical safety alerts in the checklist above"
                  : "Complete the checklist above to enable send"}
            </p>
          )}
        </section>

        {/* AI — collapsible */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setAiExpanded((e) => !e)}
            className="flex min-h-[48px] w-full items-center justify-between px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1B3B2E]">
              <Sparkles className="h-4 w-4 text-[#B8735D]" />
              Medora AI assistant
            </span>
            {aiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {aiExpanded && (
            <div className="border-t border-[#EDEAE6] p-3 sm:p-4">
              <PrescriptionAiAssistant
                patient={patient}
                draftDrugIds={draftDrugIds}
                onApplySuggestion={applySuggestion}
                onApplyAll={(suggestions) => suggestions.forEach(applySuggestion)}
              />
            </div>
          )}
        </section>

        {/* Scroll spacer — keeps content above mobile sticky bar + bottom nav */}
        <div
          className={cn(
            "lg:hidden",
            sendOptionsOpen ? "h-[calc(9.5rem+env(safe-area-inset-bottom))]" : "h-[calc(6.5rem+env(safe-area-inset-bottom))]",
          )}
          aria-hidden
        />
      </div>

      {showPreview && (
        <PrescriptionPreviewSheet
          patient={patient}
          draft={draft}
          onClose={() => setShowPreview(false)}
        />
      )}

      {dispatchConfirmation ? (
        <PrescriptionDispatchConfirmation
          data={dispatchConfirmation}
          onClose={() => setDispatchConfirmation(null)}
          onWriteAnother={() => setDispatchConfirmation(null)}
        />
      ) : null}

      <DrugMonographSheet drugId={monographDrugId} open={Boolean(monographDrugId)} onOpenChange={(o) => !o && setMonographDrugId(null)} />

      {/* Mobile sticky action bar — one row; more options expand on demand */}
      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 border-t border-[#EDEAE6] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        {sendOptionsOpen ? (
          <div className="grid grid-cols-3 gap-1.5 border-b border-[#EDEAE6] px-2.5 py-2">
            <button
              type="button"
              onClick={() => {
                saveDraftExplicit();
                setSendOptionsOpen(false);
              }}
              className="min-h-[40px] rounded-lg bg-[#FAFAF8] text-xs font-medium text-[#1B3B2E]"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => handleAlternateSend("pharmacy")}
              className="min-h-[40px] rounded-lg bg-[#F4FAF8] text-xs font-medium text-[#2C7873]"
            >
              Pharmacy
            </button>
            <button
              type="button"
              onClick={() => handleAlternateSend("patient")}
              className="min-h-[40px] rounded-lg bg-[#FDF8F5] text-xs font-medium text-[#B8735D]"
            >
              Patient
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {patient && (
            <PrescriptionMobileCdssDrawer
              patient={patient}
              draftDrugIds={draftDrugIds}
              onApplySuggestion={applySuggestion}
              alertCount={safetyAlerts.filter((a) => a.severity === "critical" || a.severity === "warning").length}
            />
          )}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#EDEAE6] bg-white text-[#1B3B2E]"
            aria-label="Preview prescription"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handlePrimarySend}
            className={cn(
              "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold",
              canDispatch
                ? "bg-[#1B3B2E] text-white"
                : "bg-[#E8E6E1] text-[#5C635F]",
            )}
          >
            <Send className="h-4 w-4 shrink-0" />
            {sending ? "Sending…" : "Send prescription"}
          </button>
          <button
            type="button"
            onClick={() => setSendOptionsOpen((o) => !o)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#EDEAE6] bg-white text-[#1B3B2E]"
            aria-label={sendOptionsOpen ? "Hide send options" : "More send options"}
            aria-expanded={sendOptionsOpen}
          >
            {sendOptionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
