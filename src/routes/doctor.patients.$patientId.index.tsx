import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FilePen,
  FlaskConical,
  History,
  MessageCircle,
  Upload,
} from "lucide-react";
import { ChartDetailSheet, type ChartSheetDetail } from "@/components/doctor/ChartDetailSheet";
import { BodyAnatomyMarker } from "@/components/clinical/BodyAnatomyMarker";
import { DoctorAdherenceInbox } from "@/components/doctor/DoctorAdherenceInbox";
import { PatientChartActionRail } from "@/components/doctor/PatientChartActionRail";
import {
  HistoryDocumentsPanel,
  HistoryTabBar,
  renderHistoryEntries,
} from "@/components/doctor/PatientHistoryPanels";
import {
  getPanelPatient,
  getPatientHistoryDocuments,
  getPatientHistoryRx,
  getPatientHistoryVitals,
  getPatientHistoryVisits,
  getPatientOpenItems,
  getPatientTherapy,
} from "@/lib/doctor-patients-apk-data";
import { listDoctorSentRx } from "@/lib/doctor-prescription-store";
import { getPatientQueueStatus } from "@/lib/doctor-patient-queue";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { listVitalsForPatient } from "@/lib/shared/vitals-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/patients/$patientId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search.section === "string" ? search.section : undefined,
  }),
  component: PatientChart,
});

const STATUS_BADGE = {
  Urgent: "bg-[#FCE8E6] text-[#C45C4A]",
  Stable: "bg-[#E8EFE6] text-[#1B3B2E]",
  Monitoring: "bg-[#F5E6B8] text-[#5C4A1E]",
  Critical: "bg-[#FCE8E6] text-[#C45C4A]",
} as const;

const HISTORY_TAB_DEFS = [
  { id: "visits", label: "Visits" },
  { id: "rx", label: "Rx" },
  { id: "documents", label: "Documents" },
  { id: "vitals", label: "Vitals" },
] as const;


function PatientChart() {
  const { patientId } = Route.useParams();
  const { section } = Route.useSearch();
  const { entries } = useLiveQueue();
  const patient = getPanelPatient(patientId);
  const [historyTab, setHistoryTab] = useState<(typeof HISTORY_TAB_DEFS)[number]["id"]>("rx");
  const [sheetDetail, setSheetDetail] = useState<ChartSheetDetail | null>(null);

  const therapy = getPatientTherapy(patientId);
  const activeRx = listDoctorSentRx(patientId).find((r) => r.status === "sent");
  const openItems = getPatientOpenItems(patientId);
  const historyVisits = getPatientHistoryVisits(patientId);
  const historyRx = getPatientHistoryRx(patientId);
  const historyDocuments = getPatientHistoryDocuments(patientId);
  const historyVitals = getPatientHistoryVitals(patientId);
  const queueStatus = getPatientQueueStatus(patientId, entries);
  const latestVitalsMarkers = listVitalsForPatient(patientId)[0]?.bodyMarkers ?? [];

  const historyTabs = [
    { id: "visits" as const, label: "Visits", count: historyVisits.length },
    { id: "rx" as const, label: "Rx", count: historyRx.length },
    { id: "documents" as const, label: "Documents", count: historyDocuments.length },
    { id: "vitals" as const, label: "Vitals", count: historyVitals.length },
  ];

  useEffect(() => {
    if (section === "open-items") {
      document.getElementById("open-items")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [section]);

  if (!patient) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#8A8F8C]">Patient not found.</p>
        <Link to="/doctor/patients" search={{ view: "panel" }} className="mt-3 inline-block text-sm font-semibold text-[#B8735D]">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-4 lg:pb-8">
      <header>
        <div className="flex items-center gap-3">
          <Link
            to="/doctor/patients"
            search={{ view: "panel" }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-[#1B3B2E]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-[#1B3B2E]">Patient chart</p>
            <p className="truncate text-sm text-[#8A8F8C]">{patient.name}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Link
              to="/doctor/patients/$patientId/history"
              params={{ patientId }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF] bg-white"
              aria-label="Full history"
            >
              <History className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              onClick={() =>
                toast.success("Upload started", {
                  description: "Choose a file from your device (demo)",
                })
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3.5 py-2.5 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden md:inline">Upload</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 sm:hidden">
          <Link
            to="/doctor/patients/$patientId/history"
            params={{ patientId }}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] bg-white text-sm font-semibold text-[#1B3B2E]"
          >
            <History className="h-4 w-4" strokeWidth={1.75} />
            Full history
          </Link>
          <button
            type="button"
            onClick={() =>
              toast.success("Upload started", {
                description: "Choose a file from your device (demo)",
              })
            }
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B3B2E] text-sm font-semibold text-white"
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Upload
          </button>
        </div>
      </header>

      <article className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-[0_2px_14px_rgba(27,59,46,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#F0DDD6] text-sm font-semibold text-[#1B3B2E]">
              {patient.initials}
            </span>
            <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-[#1B3B2E]">{patient.name}</p>
            <p className="text-sm text-[#8A8F8C]">{patient.condition}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_BADGE[patient.status])}>
                {patient.status}
              </span>
              <span className="text-xs text-[#8A8F8C]">
                {patient.age}y · {patient.gender} · {patient.patientRef}
              </span>
              {queueStatus.kind !== "none" ? (
                <span className="rounded-full bg-[#E8EFE6] px-2.5 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
                  {queueStatus.label}
                </span>
              ) : null}
            </div>
            {patient.alert ? (
              <p className="mt-2 text-sm font-semibold text-[#C45C4A]">{patient.alert}</p>
            ) : null}
            <p className="mt-1 text-xs leading-relaxed text-[#8A8F8C]">{patient.timeline}</p>
            {patient.pills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patient.pills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-lg bg-[#F5F2ED] px-2.5 py-1 text-[11px] font-medium text-[#8A8F8C]"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-[#F0EDE8] pt-3 text-center text-[10px] font-medium tracking-wide text-[#8A8F8C] md:ml-auto md:w-auto md:shrink-0 md:grid-cols-1 md:gap-2 md:border-0 md:pt-0 md:text-right">
            <div className="rounded-xl bg-[#FAFAF8] px-2 py-2 md:bg-transparent md:px-0 md:py-0">
              <p className="text-base font-bold leading-none text-[#1B3B2E]">{patient.visits}</p>
              <p className="mt-0.5">VISITS</p>
            </div>
            <div className="rounded-xl bg-[#FAFAF8] px-2 py-2 md:bg-transparent md:px-0 md:py-0">
              <p className="text-base font-bold leading-none text-[#1B3B2E]">{patient.rxCount}</p>
              <p className="mt-0.5">RX</p>
            </div>
            <div className="rounded-xl bg-[#FAFAF8] px-2 py-2 md:bg-transparent md:px-0 md:py-0">
              <p className="text-sm font-bold leading-none text-[#1B3B2E]">{patient.lastSeen}</p>
              <p className="mt-0.5">LAST SEEN</p>
            </div>
          </div>
        </div>
      </article>

      {patient.allergyWarning && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#C45C4A] px-4 py-3.5 text-sm font-medium text-white">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {patient.allergyWarning}
        </div>
      )}

      <PatientChartActionRail patientId={patientId} />

      <div className="lg:hidden">
        <BodyAnatomyMarker markers={latestVitalsMarkers} readOnly />
        <Link
          to="/doctor/vitals"
          search={{ patientId }}
          className="mt-2 block text-center text-xs font-semibold text-[#B8735D] hover:underline"
        >
          {latestVitalsMarkers.length > 0 ? "Update on record vitals →" : "Mark areas on record vitals →"}
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <DoctorAdherenceInbox patientId={patientId} />

      {therapy ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#1B3B2E]">Before you prescribe</h2>
            {activeRx ? (
              <Link
                to="/doctor/prescriptions"
                search={{
                  view: "write",
                  patientId,
                  amendFrom: activeRx.rx_number,
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#B8735D]/30 bg-[#FFF8F5] px-4 text-xs font-semibold text-[#B8735D] hover:bg-[#F0DDD6]/40"
              >
                <FilePen className="h-3.5 w-3.5" strokeWidth={2} />
                Adjust therapy
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="relative flex min-h-[148px] flex-col rounded-[18px] border border-[#EDEAE6] bg-white p-3.5 text-left shadow-[0_2px_12px_rgba(27,59,46,0.05)]">
              <div className="mb-2.5 h-1 w-full rounded-full bg-[#B8735D]" />
              <p className="text-[10px] font-semibold tracking-[0.1em] text-[#B8735D]">CURRENT THERAPY</p>
              {therapy.lines.map((line) => (
                <p key={line} className="mt-2 text-[13px] font-medium leading-snug text-[#1B3B2E]">
                  {line}
                </p>
              ))}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSheetDetail({ type: "therapy" })}
                  className="text-[11px] text-[#8A8F8C] hover:text-[#1B3B2E]"
                >
                  Tap for detail
                </button>
                {activeRx ? (
                  <Link
                    to="/doctor/prescriptions"
                    search={{
                      view: "write",
                      patientId,
                      amendFrom: activeRx.rx_number,
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[#1B3B2E] px-3 text-[11px] font-semibold text-white"
                  >
                    <FilePen className="h-3 w-3" />
                    Adjust
                  </Link>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSheetDetail({ type: "problems" })}
              className="flex min-h-[148px] flex-col rounded-[18px] border border-[#EDEAE6] bg-white p-3.5 text-left shadow-[0_2px_12px_rgba(27,59,46,0.05)]"
            >
              <div className="mb-2.5 h-1 w-full rounded-full bg-[#1B3B2E]" />
              <p className="text-[10px] font-semibold tracking-[0.1em] text-[#1B3B2E]">PROBLEM LIST</p>
              {therapy.problems.map((line) => (
                <p key={line} className="mt-2 text-[13px] font-medium leading-snug text-[#1B3B2E]">
                  {line}
                </p>
              ))}
              <p className="mt-auto pt-3 text-[11px] text-[#8A8F8C]">Tap for detail</p>
            </button>
          </div>
        </section>
      ) : null}

      {openItems.length > 0 && (
        <section id="open-items" className="space-y-3">
              <h2 className="text-sm font-semibold text-[#1B3B2E]">Open items</h2>
              <div className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white shadow-[0_2px_14px_rgba(27,59,46,0.05)]">
                {openItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSheetDetail(
                      item.documentId
                        ? { type: "document", id: item.documentId }
                        : { type: "open-item", id: item.id },
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAF8F5]"
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      item.icon === "message" ? "bg-[#F5F2ED]" : "bg-[#F0DDD6]",
                    )}
                  >
                    {item.icon === "message" ? (
                      <MessageCircle className="h-[18px] w-[18px] text-[#8A8F8C]" strokeWidth={1.75} />
                    ) : (
                      <FlaskConical className="h-[18px] w-[18px] text-[#8A8F8C]" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">{item.kind}</p>
                    <p className="text-sm font-semibold text-[#1B3B2E]">{item.title}</p>
                    <p className="text-xs text-[#8A8F8C]">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" />
                </button>
              ))}
            </div>
          </section>
      )}

      <section className="space-y-3">
            <article className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-[0_2px_14px_rgba(27,59,46,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#1B3B2E]">History</h2>
                  <p className="mt-0.5 text-xs text-[#8A8F8C]">Visits, prescriptions, documents &amp; vitals</p>
                </div>
                <Link
                  to="/doctor/patients/$patientId/history"
                  params={{ patientId }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8EFE6] px-3 py-1.5 text-xs font-semibold text-[#1B3B2E]"
                >
                  <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Full log
                </Link>
              </div>

              <div className="mt-4">
                <HistoryTabBar tabs={historyTabs} activeTab={historyTab} onChange={setHistoryTab} />
              </div>

              <div className="mt-4 space-y-3">
                {historyTab === "visits" &&
                  renderHistoryEntries(historyVisits, (entry) =>
                    setSheetDetail({ type: "visit", id: entry.id }),
                  )}

                {historyTab === "rx" &&
                  renderHistoryEntries(historyRx, (entry) =>
                    setSheetDetail({ type: "medication", id: entry.medicationId }),
                  )}

                {historyTab === "documents" && (
                  <HistoryDocumentsPanel
                    patientId={patientId}
                    patientName={patient.name}
                    onOpenDocument={(id) => setSheetDetail({ type: "document", id })}
                    onUpload={() =>
                      toast.success("Upload started", {
                        description: "Choose a file from your device (demo)",
                      })
                    }
                  />
                )}

                {historyTab === "vitals" &&
                  renderHistoryEntries(historyVitals, (entry) =>
                    setSheetDetail({ type: "vital", id: entry.id }),
                  )}
              </div>
            </article>
          </section>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-4">
          <BodyAnatomyMarker markers={latestVitalsMarkers} readOnly />
          <Link
            to="/doctor/vitals"
            search={{ patientId }}
            className="mt-2 block text-center text-xs font-semibold text-[#B8735D] hover:underline"
          >
            {latestVitalsMarkers.length > 0 ? "Update on record vitals →" : "Mark areas on record vitals →"}
          </Link>
        </aside>
      </section>

      <ChartDetailSheet
        detail={sheetDetail}
        patientId={patientId}
        patientName={patient.name}
        onClose={() => setSheetDetail(null)}
        onOpenMedication={(id) => setSheetDetail({ type: "medication", id })}
        onOpenDocument={(id) => setSheetDetail({ type: "document", id })}
      />
    </div>
  );
}
