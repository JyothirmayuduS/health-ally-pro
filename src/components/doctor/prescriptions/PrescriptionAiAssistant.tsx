import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  analyzePrescriptionContext,
  type AiAlert,
  type AiMedicationSuggestion,
  type PrescriptionAiAnalysis,
} from "@/lib/doctor-prescription-ai";
import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import { MedoraAiComplianceBadge } from "@/components/ai/MedoraAiComplianceBadge";

type Props = {
  patient: PanelPatient;
  draftDrugIds: string[];
  onApplySuggestion: (suggestion: AiMedicationSuggestion) => void;
  onApplyAll: (suggestions: AiMedicationSuggestion[]) => void;
};

function AlertRow({ alert }: { alert: AiAlert }) {
  const styles =
    alert.severity === "critical"
      ? "border-[#C45C4A]/40 bg-[#FDF5F4] text-[#8B3A32]"
      : alert.severity === "warning"
        ? "border-[#E9A820]/40 bg-[#FFFBF0] text-[#7A5A10]"
        : "border-[#1B3B2E]/20 bg-[#F5F9F7] text-[#1B3B2E]";

  const Icon = alert.severity === "critical" ? ShieldAlert : AlertTriangle;

  return (
    <div className={cn("flex gap-2.5 rounded-xl border px-3 py-2.5 text-sm", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="font-semibold">{alert.title}</p>
        <p className="mt-0.5 text-xs opacity-90">{alert.detail}</p>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: AiMedicationSuggestion;
  onApply: () => void;
}) {
  const tierColor =
    suggestion.tier === "first-line"
      ? "bg-[#1B3B2E] text-white"
      : suggestion.tier === "caution"
        ? "bg-[#E9A820]/20 text-[#7A5A10]"
        : "bg-[#EDEAE6] text-[#5C635F]";

  return (
    <div className="rounded-2xl border border-[#EDEAE6] bg-white p-3 shadow-sm sm:p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-semibold text-[#1B3B2E]">
              {suggestion.drug_name} {suggestion.strength}
            </p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tierColor)}>
              {suggestion.tier.replace("-", " ")}
            </span>
          </div>
          <p className="mt-1 break-words text-xs text-[#8A8F8C]">{suggestion.sig}</p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-[#F0DDD6] px-2 py-0.5 text-[10px] font-bold text-[#B8735D]">
          {suggestion.confidence}%
        </span>
      </div>
      <p className="mt-2 break-words text-xs leading-relaxed text-[#5C635F]">{suggestion.rationale}</p>
      <p className="mt-1 break-words text-[10px] text-[#ADADAD]">{suggestion.guideline}</p>
      <button
        type="button"
        onClick={onApply}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[#1B3B2E] px-3.5 py-2 text-xs font-semibold text-white sm:w-auto sm:min-h-[36px] sm:py-1.5"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Add to Rx
      </button>
    </div>
  );
}

export function PrescriptionAiAssistant({
  patient,
  draftDrugIds,
  onApplySuggestion,
  onApplyAll,
}: Props) {
  const [analysis, setAnalysis] = useState<PrescriptionAiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState("");
  const patientRef = useRef(patient.id);
  const [aiCloud, setAiCloud] = useState<boolean | null>(null);
  const [vectorRag, setVectorRag] = useState(false);

  useEffect(() => {
    void import("@/lib/ai/medora-ai").then(({ medoraAiStatus }) => {
      void medoraAiStatus().then((s) => {
        setAiCloud(s.cloudEnabled);
        setVectorRag(!!s.vectorRagEnabled);
      });
    });
  }, []);

  const runAnalysis = useCallback(
    async (clinicianQuery?: string) => {
      setLoading(true);
      setStatus("Initializing Medora Clinical Intelligence…");
      try {
        const result = await analyzePrescriptionContext(
          { patient, draftDrugIds, clinicianQuery },
          setStatus,
        );
        setAnalysis(result);
        setExpanded(true);
      } finally {
        setLoading(false);
        setStatus("");
      }
    },
    [patient, draftDrugIds],
  );

  useEffect(() => {
    if (patientRef.current !== patient.id) {
      patientRef.current = patient.id;
      setAnalysis(null);
      void runAnalysis();
    }
  }, [patient.id, runAnalysis]);

  const criticalCount = analysis?.alerts.filter((a) => a.severity === "critical").length ?? 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#1B3B2E]/15 bg-gradient-to-br from-[#F5F9F7] via-white to-[#FAF7F4] shadow-[0_4px_24px_rgba(27,59,46,0.06)] sm:rounded-[24px]">
      <header className="flex flex-col gap-3 border-b border-[#EDEAE6] px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1B3B2E] text-white sm:h-11 sm:w-11 sm:rounded-2xl">
            <Brain className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-base font-semibold text-[#1B3B2E] sm:text-lg">Medora AI</h2>
              <span className="rounded-full bg-[#F0DDD6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B8735D]">
                Clinical
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-[#8A8F8C] sm:text-xs">
              Formulary-aware suggestions · interactions · RAG-enhanced
              {aiCloud === true && " · cloud AI active"}
              {aiCloud === false && " · on-device mode"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="grid h-9 w-9 shrink-0 place-items-center self-end rounded-xl border border-[#EDEAE6] text-[#8A8F8C] sm:self-auto"
          aria-label={expanded ? "Collapse AI panel" : "Expand AI panel"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </header>

      {expanded && (
        <div className="space-y-4 px-3 py-3 sm:px-5 sm:py-4">
          <MedoraAiComplianceBadge
            cloudEnabled={aiCloud ?? undefined}
            vectorRag={vectorRag}
            phiRedacted
            compact
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) void runAnalysis(query.trim() || undefined);
              }}
              placeholder='Ask AI — e.g. "Best statin?"'
              className="min-h-[44px] min-w-0 flex-1 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-2.5 text-base sm:text-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void runAnalysis(query.trim() || undefined)}
              className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1B3B2E] px-5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#B8735D]" />
              <p className="text-sm text-[#5C635F]">{status || "Analyzing chart…"}</p>
            </div>
          )}

          {!loading && !analysis && (
            <button
              type="button"
              onClick={() => void runAnalysis()}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-dashed border-[#B8735D]/50 bg-[#F0DDD6]/30 py-4 text-sm font-medium text-[#B8735D]"
            >
              <Sparkles className="h-4 w-4" />
              Generate AI recommendations for {patient.name}
            </button>
          )}

          {analysis && !loading && (
            <>
              <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
                <p className="text-sm leading-relaxed text-[#1B3B2E]">{analysis.summary}</p>
                {analysis.clinicalNarrative && (
                  <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-line break-words rounded-xl bg-[#FAF9F7] p-3 text-xs leading-relaxed text-[#5C635F] sm:max-h-64">
                    {analysis.clinicalNarrative}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-[#ADADAD]">Source: {analysis.modelSource}</p>
              </div>

              {analysis.alerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">
                    Safety alerts {criticalCount > 0 && `· ${criticalCount} critical`}
                  </p>
                  {analysis.alerts.map((a) => (
                    <AlertRow key={a.id} alert={a} />
                  ))}
                </div>
              )}

              {analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">
                      Ranked suggestions
                    </p>
                    <button
                      type="button"
                      onClick={() => onApplyAll(analysis.suggestions.slice(0, 3))}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-full border border-[#EDEAE6] px-3 text-xs font-semibold text-[#1B3B2E] sm:min-h-0 sm:border-0 sm:px-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Apply top 3
                    </button>
                  </div>
                  {analysis.suggestions.map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      onApply={() => onApplySuggestion(s)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
