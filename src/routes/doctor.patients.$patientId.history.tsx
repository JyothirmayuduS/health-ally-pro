import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, Pill, Search } from "lucide-react";
import { toast } from "sonner";
import { ChartDetailSheet, type ChartSheetDetail } from "@/components/doctor/ChartDetailSheet";
import {
  HistoryDocumentsPanel,
  type HistoryPanelTab,
  renderHistoryEntries,
} from "@/components/doctor/PatientHistoryPanels";
import {
  getPanelPatient,
  getPatientHistoryDocuments,
  getPatientHistoryRx,
  getPatientHistoryVitals,
  getPatientHistoryVisits,
  getPatientMedications,
  type HistoryTimelineEntry,
} from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/patients/$patientId/history")({
  component: PatientHistory,
});

type FullHistoryTab = "all" | HistoryPanelTab;

function matchesSearch(entry: HistoryTimelineEntry, query: string) {
  const haystack = [entry.title, entry.meta, entry.note ?? ""].join(" ").toLowerCase();
  return haystack.includes(query);
}

function PatientHistory() {
  const { patientId } = Route.useParams();
  const patient = getPanelPatient(patientId);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FullHistoryTab>("all");
  const [sheetDetail, setSheetDetail] = useState<ChartSheetDetail | null>(null);

  const meds = getPatientMedications(patientId);
  const visits = getPatientHistoryVisits(patientId);
  const rx = getPatientHistoryRx(patientId);
  const documents = getPatientHistoryDocuments(patientId);
  const vitals = getPatientHistoryVitals(patientId);

  const query = search.trim().toLowerCase();

  const filteredMeds = useMemo(() => {
    return meds.filter(
      (m) =>
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.condition.toLowerCase().includes(query) ||
        m.chartBody.toLowerCase().includes(query),
    );
  }, [meds, query]);

  const filteredVisits = useMemo(
    () => visits.filter((entry) => !query || matchesSearch(entry, query)),
    [visits, query],
  );
  const filteredRx = useMemo(
    () => rx.filter((entry) => !query || matchesSearch(entry, query)),
    [rx, query],
  );
  const filteredVitals = useMemo(
    () => vitals.filter((entry) => !query || matchesSearch(entry, query)),
    [vitals, query],
  );

  const activityCount = visits.length + rx.length + documents.length + vitals.length;
  const totalCount = meds.length + activityCount;

  const panelTabs = [
    { id: "visits" as const, label: "Visits", count: filteredVisits.length },
    { id: "rx" as const, label: "Rx", count: filteredRx.length },
    { id: "documents" as const, label: "Documents", count: documents.length },
    { id: "vitals" as const, label: "Vitals", count: filteredVitals.length },
  ];

  if (!patient) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#8A8F8C]">Patient not found.</p>
        <Link to="/doctor/patients" className="mt-3 inline-block text-sm font-semibold text-[#B8735D]">
          Back to patients
        </Link>
      </div>
    );
  }

  const showVisits = tab === "all" || tab === "visits";
  const showRx = tab === "all" || tab === "rx";
  const showDocuments = tab === "all" || tab === "documents";
  const showVitals = tab === "all" || tab === "vitals";
  const showChart = tab === "all";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 pb-8">
      <header className="flex items-start gap-3">
        <Link
          to="/doctor/patients/$patientId"
          params={{ patientId }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-[#1B3B2E]" />
        </Link>
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-[#1B3B2E]">Patient history</h1>
          <p className="text-sm text-[#8A8F8C]">{patient.name}</p>
        </div>
      </header>

      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A8F8C]"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meds, visits, documents..."
          className="h-11 w-full rounded-2xl border border-[#E8E4DF] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#B8735D]/40"
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: String(meds.length), label: "ON CHART" },
          { value: String(activityCount), label: "ACTIVITY" },
          { value: String(totalCount), label: "TOTAL" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[18px] border border-[#EDEAE6] bg-white px-3 py-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-[#1B3B2E]">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 rounded-2xl bg-[#F5F2ED] p-1">
        {(
          [
            { id: "all" as const, label: "All", count: totalCount },
            ...panelTabs,
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium",
              tab === t.id ? "bg-white text-[#1B3B2E] shadow-sm" : "text-[#8A8F8C]",
            )}
          >
            {t.label}
            <span className="text-xs">{t.count}</span>
          </button>
        ))}
      </div>

      {showChart && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">CURRENT CHART</p>
          {filteredMeds.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSheetDetail({ type: "medication", id: item.id })}
              className="w-full rounded-[20px] border border-[#EDEAE6] bg-white p-4 text-left shadow-[0_2px_14px_rgba(27,59,46,0.05)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-[#1B3B2E]">
                  <Pill className="h-3 w-3" strokeWidth={2} />
                  ACTIVE MEDICATION
                </span>
                <span className="text-xs text-[#8A8F8C]">{item.chartDate}</span>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8EFE6]">
                  <Pill className="h-4 w-4 text-[#1B3B2E]" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1B3B2E]">
                    {item.name} {item.strength}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8A8F8C]">{item.chartSubtitle}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#8A8F8C]">{item.chartBody}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" />
              </div>
              <p className="mt-3 text-right text-xs font-semibold text-[#1B3B2E]">View full details ›</p>
            </button>
          ))}
        </section>
      )}

      {(showVisits || showRx || showDocuments || showVitals) && (
        <article className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-[0_2px_14px_rgba(27,59,46,0.05)]">
          <div className="space-y-5">
            {showVisits && filteredVisits.length > 0 && (
              <section className="space-y-3">
                {tab === "all" && (
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">VISITS</p>
                )}
                {renderHistoryEntries(filteredVisits, (entry) =>
                  setSheetDetail({ type: "visit", id: entry.id }),
                )}
              </section>
            )}

            {showRx && filteredRx.length > 0 && (
              <section className="space-y-3">
                {tab === "all" && (
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">PRESCRIPTIONS</p>
                )}
                {renderHistoryEntries(filteredRx, (entry) =>
                  setSheetDetail({ type: "medication", id: entry.medicationId }),
                )}
              </section>
            )}

            {showDocuments && (
              <section className="space-y-3">
                {tab === "all" && (
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">DOCUMENTS</p>
                )}
                <HistoryDocumentsPanel
                  patientId={patientId}
                  patientName={patient.name}
                  searchQuery={search}
                  onOpenDocument={(id) => setSheetDetail({ type: "document", id })}
                  onUpload={() =>
                    toast.success("Upload started", {
                      description: "Choose a file from your device (demo)",
                    })
                  }
                />
              </section>
            )}

            {showVitals && filteredVitals.length > 0 && (
              <section className="space-y-3">
                {tab === "all" && (
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">VITALS</p>
                )}
                {renderHistoryEntries(filteredVitals, (entry) =>
                  setSheetDetail({ type: "vital", id: entry.id }),
                )}
              </section>
            )}
          </div>
        </article>
      )}

      <Link
        to="/doctor/patients/$patientId"
        params={{ patientId }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8735D]"
      >
        <History className="h-4 w-4" strokeWidth={1.75} />
        Back to patient chart
      </Link>

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
