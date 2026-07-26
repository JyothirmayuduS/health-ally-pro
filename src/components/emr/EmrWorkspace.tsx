import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  FileText,
  History,
  Loader2,
  Paperclip,
  Plus,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { listIcdDiagnoses } from "@/lib/hospital-masters";
import type { EmrChartBundle, EmrTimelineItem } from "@/lib/emr/schemas";
import {
  addEmrAllergy,
  addEmrDiagnosis,
  addEmrHistory,
  addEmrImmunization,
  addEmrProcedure,
  getEmrChart,
  openEmrEncounter,
  recordEmrVitals,
  saveEmrSoap,
  uploadEmrAttachment,
} from "@/lib/emr/client";
import { cn } from "@/lib/utils";

const TABS = [
  "timeline",
  "soap",
  "vitals",
  "diagnoses",
  "procedures",
  "allergies",
  "immunizations",
  "history",
  "attachments",
  "versions",
] as const;

type Tab = (typeof TABS)[number];

const inputCls =
  "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-[13px] outline-none focus:border-sage focus:ring-1 focus:ring-sage";

type Props = {
  patientId: string;
  patientName?: string;
  embedded?: boolean;
  canWrite?: boolean;
};

function kindIcon(kind: EmrTimelineItem["kind"]) {
  switch (kind) {
    case "vitals":
      return Activity;
    case "allergy":
      return AlertTriangle;
    case "immunization":
      return Syringe;
    case "attachment":
      return Paperclip;
    case "history":
      return History;
    case "note":
    case "encounter":
      return FileText;
    default:
      return Stethoscope;
  }
}

export function EmrWorkspace({
  patientId,
  patientName,
  embedded,
  canWrite = true,
}: Props) {
  const [tab, setTab] = useState<Tab>("timeline");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<EmrChartBundle | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);

  const [soap, setSoap] = useState({
    chiefComplaint: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    changeSummary: "",
  });
  const [vitals, setVitals] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    temperatureC: "",
    spo2: "",
    weightKg: "",
    heightCm: "",
  });
  const [dx, setDx] = useState({ code: "", display: "", primary: false });
  const [proc, setProc] = useState({ code: "", display: "" });
  const [allergy, setAllergy] = useState({ substance: "", reaction: "", severity: "unknown" });
  const [imm, setImm] = useState({ vaccineCode: "", vaccineName: "", doseNumber: "1" });
  const [hx, setHx] = useState({
    category: "medical" as "medical" | "surgical" | "family" | "social" | "other",
    title: "",
    detail: "",
  });

  const icdOptions = useMemo(() => listIcdDiagnoses().slice(0, 40), []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getEmrChart(patientId);
    if (!res.ok) {
      setError(res.error);
      setChart(null);
      setLoading(false);
      return;
    }
    setChart(res.data);
    const open = res.data.encounters.find((e) => e.status === "open");
    if (open?.id) {
      setEncounterId(String(open.id));
      setSoap({
        chiefComplaint: String(open.chief_complaint ?? ""),
        subjective: String(open.subjective ?? ""),
        objective: String(open.objective ?? ""),
        assessment: String(open.assessment ?? ""),
        plan: String(open.plan ?? ""),
        changeSummary: "",
      });
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function withSave(fn: () => Promise<void>) {
    setSaving(true);
    try {
      await fn();
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="emr-workspace"
      className={cn(
        "flex flex-col gap-4",
        !embedded && "rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-sage">
            EMR / EHR
          </p>
          <h2 className="font-heading text-[18px] font-semibold text-ink-900">
            {patientName || "Clinical chart"}
          </h2>
          <p className="text-[12.5px] text-ink-500">
            Timeline, SOAP, vitals, ICD-10, procedures, allergies, vaccines, history & attachments
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            data-testid="emr-open-encounter"
            disabled={saving}
            onClick={() =>
              void withSave(async () => {
                const res = await openEmrEncounter(patientId, {
                  chiefComplaint: soap.chiefComplaint || undefined,
                });
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                setEncounterId(String(res.data.id));
                toast.success("Encounter opened");
                setTab("soap");
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sage px-3 text-[12.5px] font-semibold text-white hover:bg-sage-hover disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> Open encounter
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-ink-100 pb-2">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={`emr-tab-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11.5px] font-semibold capitalize transition-colors",
              tab === id
                ? "bg-sage text-white"
                : "bg-bone text-ink-600 hover:bg-sage-soft hover:text-sage",
            )}
          >
            {id}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading chart…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-noshowBorder bg-status-noshowBg/40 px-4 py-6 text-center text-[13px] text-status-noshowText">
          {error}
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-2 block w-full font-semibold text-sage hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {tab === "timeline" ? (
            <ul data-testid="emr-timeline" className="divide-y divide-ink-100 rounded-xl border border-ink-100">
              {(chart?.timeline ?? []).length === 0 ? (
                <li className="px-4 py-10 text-center text-[13px] text-ink-400">
                  No clinical events yet. Open an encounter to begin documentation.
                </li>
              ) : null}
              {(chart?.timeline ?? []).slice(0, 40).map((item) => {
                const Icon = kindIcon(item.kind);
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-soft text-sage">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink-900">{item.title}</span>
                        <span className="rounded-full bg-bone px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-ink-400">
                          {item.kind}
                        </span>
                      </div>
                      {item.summary ? (
                        <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-500">{item.summary}</p>
                      ) : null}
                    </div>
                    <time className="shrink-0 font-mono text-[11px] text-ink-400">
                      {item.occurredAt.slice(0, 16).replace("T", " ")}
                    </time>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tab === "soap" && canWrite ? (
            <div className="space-y-3" data-testid="emr-soap-form">
              {(
                [
                  ["chiefComplaint", "Chief complaint"],
                  ["subjective", "Subjective (S)"],
                  ["objective", "Objective (O)"],
                  ["assessment", "Assessment (A)"],
                  ["plan", "Plan (P)"],
                  ["changeSummary", "Version note"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-ink-400">
                    {label}
                  </span>
                  <textarea
                    value={soap[key]}
                    onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                    rows={key === "chiefComplaint" || key === "changeSummary" ? 2 : 3}
                    className={cn(inputCls, "h-auto py-2")}
                  />
                </label>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void withSave(async () => {
                      const res = await saveEmrSoap(patientId, {
                        encounterId: encounterId ?? undefined,
                        ...soap,
                        sign: false,
                      });
                      if (!res.ok) {
                        toast.error(res.error);
                        return;
                      }
                      setEncounterId(String(res.data.encounter.id));
                      toast.success("SOAP draft saved (versioned)");
                    })
                  }
                  className="h-9 rounded-full border border-ink-200 px-4 text-[12.5px] font-semibold hover:bg-bone"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  data-testid="emr-sign-note"
                  disabled={saving}
                  onClick={() =>
                    void withSave(async () => {
                      const res = await saveEmrSoap(patientId, {
                        encounterId: encounterId ?? undefined,
                        ...soap,
                        sign: true,
                        changeSummary: soap.changeSummary || "Signed clinical note",
                      });
                      if (!res.ok) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Note signed — history immutable");
                    })
                  }
                  className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white hover:bg-sage-hover"
                >
                  Sign note
                </button>
              </div>
            </div>
          ) : null}

          {tab === "vitals" && canWrite ? (
            <form
              data-testid="emr-vitals-form"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                void withSave(async () => {
                  const num = (v: string) => (v ? Number(v) : null);
                  const res = await recordEmrVitals(patientId, {
                    encounterId,
                    bpSystolic: num(vitals.bpSystolic),
                    bpDiastolic: num(vitals.bpDiastolic),
                    heartRate: num(vitals.heartRate),
                    temperatureC: num(vitals.temperatureC),
                    spo2: num(vitals.spo2),
                    weightKg: num(vitals.weightKg),
                    heightCm: num(vitals.heightCm),
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Vitals recorded");
                  setVitals({
                    bpSystolic: "",
                    bpDiastolic: "",
                    heartRate: "",
                    temperatureC: "",
                    spo2: "",
                    weightKg: "",
                    heightCm: "",
                  });
                });
              }}
            >
              {(
                [
                  ["bpSystolic", "BP sys"],
                  ["bpDiastolic", "BP dia"],
                  ["heartRate", "HR"],
                  ["temperatureC", "Temp °C"],
                  ["spo2", "SpO₂"],
                  ["weightKg", "Weight kg"],
                  ["heightCm", "Height cm"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1">
                  <span className="text-[11px] text-ink-400">{label}</span>
                  <input
                    className={inputCls}
                    value={vitals[key]}
                    onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <div className="col-span-full">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white"
                >
                  Record vitals
                </button>
              </div>
            </form>
          ) : null}

          {tab === "diagnoses" ? (
            <div className="space-y-4">
              {canWrite ? (
                <form
                  data-testid="emr-diagnosis-form"
                  className="grid gap-2 sm:grid-cols-[140px_1fr_auto]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void withSave(async () => {
                      const res = await addEmrDiagnosis(patientId, {
                        encounterId,
                        icd10Code: dx.code,
                        icd10Display: dx.display,
                        isPrimary: dx.primary,
                      });
                      if (!res.ok) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Diagnosis added");
                      setDx({ code: "", display: "", primary: false });
                    });
                  }}
                >
                  <input
                    className={inputCls}
                    placeholder="ICD-10"
                    value={dx.code}
                    list="emr-icd-list"
                    onChange={(e) => {
                      const code = e.target.value;
                      const match = icdOptions.find(
                        (i) => i.code.toLowerCase() === code.toLowerCase(),
                      );
                      setDx((d) => ({
                        ...d,
                        code,
                        display: match?.description ?? d.display,
                      }));
                    }}
                    required
                  />
                  <datalist id="emr-icd-list">
                    {icdOptions.map((i) => (
                      <option key={i.code} value={i.code}>
                        {i.description}
                      </option>
                    ))}
                  </datalist>
                  <input
                    className={inputCls}
                    placeholder="Display name"
                    value={dx.display}
                    onChange={(e) => setDx((d) => ({ ...d, display: e.target.value }))}
                    required
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white"
                  >
                    Add
                  </button>
                </form>
              ) : null}
              <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100">
                {(chart?.diagnoses ?? []).map((row) => (
                  <li key={String(row.id)} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                    <span className="font-mono font-semibold text-sage">{String(row.icd10_code)}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-900">
                      {String(row.icd10_display)}
                    </span>
                    <span className="text-[11px] uppercase text-ink-400">
                      {String(row.clinical_status)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === "procedures" && canWrite ? (
            <form
              className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                void withSave(async () => {
                  const res = await addEmrProcedure(patientId, {
                    encounterId,
                    code: proc.code || undefined,
                    display: proc.display,
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Procedure recorded");
                  setProc({ code: "", display: "" });
                });
              }}
            >
              <input
                className={inputCls}
                placeholder="Code"
                value={proc.code}
                onChange={(e) => setProc((p) => ({ ...p, code: e.target.value }))}
              />
              <input
                className={inputCls}
                placeholder="Procedure"
                value={proc.display}
                onChange={(e) => setProc((p) => ({ ...p, display: e.target.value }))}
                required
              />
              <button type="submit" className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white">
                Add
              </button>
            </form>
          ) : null}

          {tab === "allergies" && canWrite ? (
            <form
              className="grid gap-2 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                void withSave(async () => {
                  const res = await addEmrAllergy(patientId, {
                    substance: allergy.substance,
                    reaction: allergy.reaction || undefined,
                    severity: allergy.severity as "mild" | "moderate" | "severe" | "unknown",
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Allergy recorded");
                  setAllergy({ substance: "", reaction: "", severity: "unknown" });
                });
              }}
            >
              <input
                className={inputCls}
                placeholder="Substance"
                value={allergy.substance}
                onChange={(e) => setAllergy((a) => ({ ...a, substance: e.target.value }))}
                required
              />
              <input
                className={inputCls}
                placeholder="Reaction"
                value={allergy.reaction}
                onChange={(e) => setAllergy((a) => ({ ...a, reaction: e.target.value }))}
              />
              <button type="submit" className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white">
                Add allergy
              </button>
            </form>
          ) : null}

          {tab === "immunizations" && canWrite ? (
            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                void withSave(async () => {
                  const res = await addEmrImmunization(patientId, {
                    encounterId,
                    vaccineCode: imm.vaccineCode,
                    vaccineName: imm.vaccineName,
                    doseNumber: imm.doseNumber ? Number(imm.doseNumber) : null,
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Immunization recorded");
                  setImm({ vaccineCode: "", vaccineName: "", doseNumber: "1" });
                });
              }}
            >
              <input
                className={inputCls}
                placeholder="Vaccine code"
                value={imm.vaccineCode}
                onChange={(e) => setImm((v) => ({ ...v, vaccineCode: e.target.value }))}
                required
              />
              <input
                className={inputCls}
                placeholder="Vaccine name"
                value={imm.vaccineName}
                onChange={(e) => setImm((v) => ({ ...v, vaccineName: e.target.value }))}
                required
              />
              <input
                className={inputCls}
                placeholder="Dose"
                value={imm.doseNumber}
                onChange={(e) => setImm((v) => ({ ...v, doseNumber: e.target.value }))}
              />
              <button type="submit" className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white">
                Add
              </button>
            </form>
          ) : null}

          {tab === "history" && canWrite ? (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void withSave(async () => {
                  const res = await addEmrHistory(patientId, {
                    category: hx.category,
                    title: hx.title,
                    detail: hx.detail || undefined,
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("History entry added");
                  setHx({ category: "medical", title: "", detail: "" });
                });
              }}
            >
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <select
                  className={inputCls}
                  value={hx.category}
                  onChange={(e) =>
                    setHx((h) => ({
                      ...h,
                      category: e.target.value as typeof hx.category,
                    }))
                  }
                >
                  <option value="medical">Medical</option>
                  <option value="surgical">Surgical</option>
                  <option value="family">Family</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
                <input
                  className={inputCls}
                  placeholder="Title"
                  value={hx.title}
                  onChange={(e) => setHx((h) => ({ ...h, title: e.target.value }))}
                  required
                />
              </div>
              <textarea
                className={cn(inputCls, "h-auto py-2")}
                rows={3}
                placeholder="Detail"
                value={hx.detail}
                onChange={(e) => setHx((h) => ({ ...h, detail: e.target.value }))}
              />
              <button type="submit" className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white">
                Add history
              </button>
            </form>
          ) : null}

          {tab === "attachments" && canWrite ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-bone/30 px-4 py-10 text-center">
              <Paperclip className="h-5 w-5 text-sage" />
              <span className="text-[13px] font-medium text-ink-700">Upload clinical attachment</span>
              <span className="text-[12px] text-ink-400">PDF, images, DICOM up to 20MB</span>
              <input
                type="file"
                className="hidden"
                data-testid="emr-attachment-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void withSave(async () => {
                    const res = await uploadEmrAttachment(patientId, file, {
                      title: file.name,
                      encounterId: encounterId ?? undefined,
                    });
                    if (!res.ok) {
                      toast.error(res.error);
                      return;
                    }
                    toast.success("Attachment uploaded");
                  });
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}

          {tab === "versions" ? (
            <ul data-testid="emr-note-versions" className="divide-y divide-ink-100 rounded-xl border border-ink-100">
              {(chart?.noteVersions ?? []).length === 0 ? (
                <li className="px-4 py-8 text-center text-[13px] text-ink-400">
                  No note versions yet. Saving or signing SOAP creates immutable history.
                </li>
              ) : null}
              {(chart?.noteVersions ?? []).map((row) => (
                <li key={String(row.id)} className="px-4 py-3 text-[13px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">
                      Version {String(row.version_number)}
                    </span>
                    <span className="rounded-full bg-bone px-1.5 py-0.5 text-[10px] font-mono uppercase text-ink-500">
                      {String(row.note_status)}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-ink-400">
                      {String(row.created_at).slice(0, 19).replace("T", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-500">
                    {String(row.change_summary || row.assessment || "—")}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {!canWrite && tab !== "timeline" && tab !== "versions" && tab !== "diagnoses" ? (
            <p className="text-[13px] text-ink-400">Read-only view for this role.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
