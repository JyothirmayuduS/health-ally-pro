import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Activity, ArrowDown, ArrowUp, Minus, Plus, X } from "lucide-react";
import { BodyAnatomyMarker } from "@/components/clinical/BodyAnatomyMarker";
import { DoctorClinicalPageHeader } from "@/components/doctor/clinical/DoctorClinicalPageHeader";
import { doctorInputClass, DoctorButton } from "@/components/doctor/ui/DoctorButton";
import {
  flagBp,
  flagHr,
  flagSpo2,
  flagTemp,
  VITAL_FLAG_BADGE,
  VITAL_FLAG_STYLE,
  type VitalFlag,
} from "@/lib/clinical/vitals-ranges";
import type { BodyMarker } from "@/lib/shared/body-anatomy";
import {
  CORE_VITAL_FIELDS,
  EXTRA_VITAL_PRESETS,
  type CoreVitalKey,
  type ExtraVitalEntry,
} from "@/lib/shared/vitals-config";
import {
  formatVitalsRecordedAt,
  listVitalsForPatient,
  recordVitals,
  subscribeVitals,
  type VitalsReading,
} from "@/lib/shared/vitals-store";
import { cn } from "@/lib/utils";

type VitalsForm = Record<CoreVitalKey, string>;

const EMPTY_FORM: VitalsForm = { bp: "", hr: "", rr: "", temp: "", spo2: "", weight: "" };

function fieldFlag(key: CoreVitalKey, value: string): VitalFlag {
  if (!value.trim()) return "normal";
  if (key === "bp") return flagBp(value);
  if (key === "hr") {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? "normal" : flagHr(n);
  }
  if (key === "temp") return flagTemp(value);
  if (key === "spo2") {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? "normal" : flagSpo2(n);
  }
  return "normal";
}

function compareDelta(current: string, previous?: string | number): "up" | "down" | "same" | null {
  if (!previous || !current.trim()) return null;
  const a = Number.parseFloat(current.replace(/[^\d.]/g, ""));
  const b = typeof previous === "number" ? previous : Number.parseFloat(String(previous).replace(/[^\d.]/g, ""));
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a > b) return "up";
  if (a < b) return "down";
  return "same";
}

function formatReadingSummary(row: VitalsReading): string {
  const parts = [
    row.bp && `BP ${row.bp}`,
    row.hr && `HR ${row.hr}`,
    row.rr && `RR ${row.rr}`,
    row.spo2 && `SpO₂ ${row.spo2}%`,
    row.temp,
    row.weight && `${row.weight} kg`,
    ...(row.extras?.map((e) => `${e.label} ${e.value}${e.unit ? ` ${e.unit}` : ""}`) ?? []),
    row.bodyMarkers?.length ? `${row.bodyMarkers.length} area${row.bodyMarkers.length === 1 ? "" : "s"} marked` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

export type VitalsCaptureWorkspaceProps = {
  patientId: string;
  recordedBy: string;
  patientSelect?: React.ReactNode;
  patientCard?: React.ReactNode;
  chartPatientId?: string;
  portal?: "doctor" | "reception";
};

export function VitalsCaptureWorkspace({
  patientId,
  recordedBy,
  patientSelect,
  patientCard,
  chartPatientId,
  portal = "doctor",
}: VitalsCaptureWorkspaceProps) {
  const [form, setForm] = useState<VitalsForm>(EMPTY_FORM);
  const [extras, setExtras] = useState<ExtraVitalEntry[]>([]);
  const [bodyMarkers, setBodyMarkers] = useState<BodyMarker[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [history, setHistory] = useState<VitalsReading[]>(() => listVitalsForPatient(patientId));

  useEffect(() => {
    setHistory(listVitalsForPatient(patientId));
    return subscribeVitals(() => setHistory(listVitalsForPatient(patientId)));
  }, [patientId]);

  const lastReading = history[0];
  const abnormalCount = CORE_VITAL_FIELDS.filter((f) => fieldFlag(f.key, form[f.key]) !== "normal").length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setExtras([]);
    setBodyMarkers([]);
    setShowAddMenu(false);
    setCustomLabel("");
  };

  const handleSave = () => {
    const saved = recordVitals({
      patientId,
      panelPatientId: patientId,
      bp: form.bp,
      hr: form.hr,
      rr: form.rr,
      temp: form.temp ? `${form.temp.replace(/°C/i, "").trim()}°C` : undefined,
      spo2: form.spo2,
      weight: form.weight,
      extras,
      bodyMarkers,
      recordedBy,
    });
    if (!saved) {
      toast.error("Enter at least one vital sign or mark a body area");
      return;
    }
    toast.success("Vitals saved to patient chart");
    resetForm();
    setHistory(listVitalsForPatient(patientId));
  };

  const prefillLast = () => {
    if (!lastReading) return;
    setForm({
      bp: lastReading.bp ?? "",
      hr: lastReading.hr ? String(lastReading.hr) : "",
      rr: lastReading.rr ? String(lastReading.rr) : "",
      temp: lastReading.temp?.replace("°C", "") ?? "",
      spo2: lastReading.spo2 ? String(lastReading.spo2) : "",
      weight: lastReading.weight ?? "",
    });
    setExtras(lastReading.extras ?? []);
    setBodyMarkers(lastReading.bodyMarkers ?? []);
    toast.message("Prefilled from last reading");
  };

  const addExtra = (label: string, unit: string) => {
    const id = `extra-${Date.now()}`;
    setExtras((prev) => [...prev, { id, label, value: "", unit }]);
    setShowAddMenu(false);
    setCustomLabel("");
  };

  const removeExtra = (id: string) => setExtras((prev) => prev.filter((e) => e.id !== id));

  const eyebrow = portal === "reception" ? "FRONT DESK · VITALS" : "IN-ROOM · VITALS";

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-3 lg:space-y-5">
      <DoctorClinicalPageHeader
        compact
        eyebrow={eyebrow}
        title="Record vitals"
        description="Capture vitals during the visit. Abnormal values are flagged before you save — compare against the last reading on the right."
        icon={Activity}
        steps={["Select patient", "Enter vitals", "Review flags", "Save to chart"]}
      />

      {patientCard ?? null}
      {patientSelect ?? null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
        <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-3 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#1B3B2E]">Today&apos;s reading</h2>
                <p className="mt-0.5 text-[11px] text-[#8A8F8C] lg:text-xs">
                  {new Date().toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lastReading ? (
                  <button
                    type="button"
                    onClick={prefillLast}
                    className="rounded-full border border-[#E8E4DF] bg-[#FAFAF8] px-2.5 py-1 text-[11px] font-semibold text-[#1B3B2E] lg:px-3 lg:py-1.5 lg:text-xs"
                  >
                    Copy last
                  </button>
                ) : null}
                {abnormalCount > 0 ? (
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-xs", VITAL_FLAG_BADGE.critical)}>
                    {abnormalCount} flag{abnormalCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-4 lg:gap-3">
              {CORE_VITAL_FIELDS.map((field) => {
                const flag = fieldFlag(field.key, form[field.key]);
                const delta =
                  field.key === "bp"
                    ? compareDelta(form.bp, lastReading?.bp)
                    : field.key === "hr"
                      ? compareDelta(form.hr, lastReading?.hr)
                      : field.key === "spo2"
                        ? compareDelta(form.spo2, lastReading?.spo2)
                        : field.key === "weight"
                          ? compareDelta(form.weight, lastReading?.weight)
                          : null;

                return (
                  <label
                    key={field.key}
                    className={cn("block rounded-2xl border p-2.5 transition-colors lg:p-3", VITAL_FLAG_STYLE[flag])}
                  >
                    <span className="flex items-center justify-between gap-1 text-[9px] font-semibold uppercase tracking-wide text-[#8A8F8C] lg:text-[10px]">
                      {field.label}
                      {flag !== "normal" ? (
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] normal-case lg:text-[9px]", VITAL_FLAG_BADGE[flag])}>
                          {flag === "critical" ? "Critical" : "Review"}
                        </span>
                      ) : null}
                    </span>
                    <div className="mt-1.5 flex items-end gap-1 lg:mt-2 lg:gap-1.5">
                      <input
                        className="min-h-[40px] w-full bg-transparent text-lg font-semibold text-[#1B3B2E] outline-none placeholder:font-normal placeholder:text-[#C5C5C5] lg:min-h-[44px] lg:text-xl"
                        value={form[field.key]}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        inputMode={field.inputMode}
                      />
                      <span className="shrink-0 pb-1 text-[10px] text-[#8A8F8C] lg:text-xs">{field.unit}</span>
                    </div>
                    {delta && lastReading ? (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-[#8A8F8C] lg:mt-1 lg:text-[10px]">
                        {delta === "up" ? <ArrowUp className="h-3 w-3" /> : delta === "down" ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        vs last
                      </span>
                    ) : null}
                  </label>
                );
              })}

              {extras.map((extra) => (
                <label
                  key={extra.id}
                  className="relative block rounded-2xl border border-[#E8E4DF] bg-[#FAFAF8] p-2.5 lg:p-3"
                >
                  <button
                    type="button"
                    onClick={() => removeExtra(extra.id)}
                    className="absolute right-2 top-2 rounded-full p-0.5 text-[#8A8F8C] hover:bg-[#EDEAE6]"
                    aria-label={`Remove ${extra.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="block pr-6 text-[9px] font-semibold uppercase tracking-wide text-[#8A8F8C] lg:text-[10px]">
                    {extra.label}
                  </span>
                  <div className="mt-1.5 flex items-end gap-1 lg:mt-2 lg:gap-1.5">
                    <input
                      className="min-h-[40px] w-full bg-transparent text-lg font-semibold text-[#1B3B2E] outline-none placeholder:font-normal placeholder:text-[#C5C5C5] lg:min-h-[44px] lg:text-xl"
                      value={extra.value}
                      onChange={(e) =>
                        setExtras((prev) =>
                          prev.map((x) => (x.id === extra.id ? { ...x, value: e.target.value } : x)),
                        )
                      }
                      placeholder="—"
                    />
                    {extra.unit ? (
                      <span className="shrink-0 pb-1 text-[10px] text-[#8A8F8C] lg:text-xs">{extra.unit}</span>
                    ) : null}
                  </div>
                </label>
              ))}

              <div className="relative col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setShowAddMenu((v) => !v)}
                  className="flex h-full min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#C5C5C5] bg-[#FAFAF8] text-[#8A8F8C] transition-colors hover:border-[#1B3B2E] hover:text-[#1B3B2E]"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                  <span className="text-[11px] font-semibold">Add vital</span>
                </button>
                {showAddMenu ? (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[200px] rounded-xl border border-[#EDEAE6] bg-white p-2 shadow-lg sm:w-56">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
                      Quick add
                    </p>
                    {EXTRA_VITAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => addExtra(preset.label, preset.unit)}
                        className="block w-full rounded-lg px-2 py-2 text-left text-sm text-[#1B3B2E] hover:bg-[#FAFAF8]"
                      >
                        {preset.label}
                        <span className="ml-1 text-xs text-[#8A8F8C]">{preset.unit}</span>
                      </button>
                    ))}
                    <div className="mt-2 border-t border-[#EDEAE6] pt-2">
                      <input
                        className={cn(doctorInputClass, "text-sm")}
                        placeholder="Custom label…"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={!customLabel.trim()}
                        onClick={() => addExtra(customLabel.trim(), "")}
                        className="mt-2 w-full rounded-lg bg-[#1B3B2E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        Add custom
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:mt-5">
              <DoctorButton className="min-h-[48px] flex-1" onClick={handleSave}>
                Save to chart
              </DoctorButton>
              <DoctorButton variant="secondary" className="min-h-[48px]" onClick={resetForm}>
                Clear
              </DoctorButton>
            </div>
          </section>

        <aside className="space-y-3 lg:space-y-4">
          <BodyAnatomyMarker markers={bodyMarkers} onChange={setBodyMarkers} className="lg:order-first" />
          {lastReading ? (
            <section className="rounded-[20px] border border-[#EDEAE6] bg-[#F7FAF6] p-3 lg:p-4">
              <h2 className="text-sm font-semibold text-[#1B3B2E]">Last recorded</h2>
              <p className="mt-0.5 text-xs text-[#8A8F8C]">{formatVitalsRecordedAt(lastReading.recordedAt)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {lastReading.bp ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">BP</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.bp}</dd>
                  </div>
                ) : null}
                {lastReading.hr ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">HR</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.hr} bpm</dd>
                  </div>
                ) : null}
                {lastReading.rr ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">RR</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.rr} /min</dd>
                  </div>
                ) : null}
                {lastReading.spo2 ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">SpO₂</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.spo2}%</dd>
                  </div>
                ) : null}
                {lastReading.temp ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">Temp</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.temp}</dd>
                  </div>
                ) : null}
                {lastReading.weight ? (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase text-[#8A8F8C]">Weight</dt>
                    <dd className="font-semibold text-[#1B3B2E]">{lastReading.weight} kg</dd>
                  </div>
                ) : null}
              </dl>
              {lastReading.bodyMarkers?.length ? (
                <p className="mt-2 text-xs text-[#C45C4A]">
                  Marked: {lastReading.bodyMarkers.map((m) => m.label).join(", ")}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-3 lg:p-4">
            <h2 className="text-sm font-semibold text-[#1B3B2E]">Vitals history</h2>
            <p className="mt-0.5 text-xs text-[#8A8F8C]">Recent recordings for this patient</p>
            <ul className="mt-3 max-h-[280px] space-y-2 overflow-y-auto lg:max-h-[320px]">
              {history.length === 0 ? (
                <li className="rounded-xl bg-[#FAFAF8] p-3 text-sm text-[#8A8F8C]">No vitals yet.</li>
              ) : (
                history.map((row) => (
                  <li key={row.id} className="rounded-xl border border-[#F0EDE8] px-3 py-2.5">
                    <p className="text-xs font-medium text-[#8A8F8C]">{formatVitalsRecordedAt(row.recordedAt)}</p>
                    <p className="mt-1 text-sm font-medium text-[#1B3B2E]">{formatReadingSummary(row)}</p>
                  </li>
                ))
              )}
            </ul>
            {chartPatientId && portal === "doctor" ? (
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: chartPatientId }}
                search={{ section: "open-items" }}
                className="mt-3 inline-block text-xs font-semibold text-[#B8735D]"
              >
                View full chart →
              </Link>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
