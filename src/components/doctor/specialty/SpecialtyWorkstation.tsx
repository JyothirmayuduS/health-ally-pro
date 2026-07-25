/**
 * Specialty / Medicine desk — one clinical surface.
 * Patient → presentation → Visit / Vitals / Exam / Orders / Plan.
 * Chart by exception; no card stack.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Baby,
  Bone,
  Box,
  Brain,
  Check,
  ClipboardCheck,
  Ear,
  Eye,
  Heart,
  Plus,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type {
  SpecialtyDefinition,
  SpecialtyField,
  SpecialtyModule,
  SpecialtyScore,
} from "@/lib/specialties/types";
import {
  chartsForSpecialty,
  saveSpecialtyChartNote,
  subscribeSpecialtyCharts,
  type HospitalDoctorRecord,
} from "@/lib/specialties";
import { SpecialtyAnatomyPanel } from "@/components/doctor/specialty/SpecialtyAnatomyPanel";
import { normalFindingFor, quickFindingsFor } from "@/lib/specialties/quick-findings";
import { PANEL_PATIENTS, type PanelPatient } from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
  Eye,
  Heart,
  Baby,
  Bone,
  Brain,
  Stethoscope,
  Activity,
  Ear,
};

/** Adult reference ranges + a typical-normal value for one-tap fill */
const VITAL_RANGES: Record<string, { low: number; high: number; normal: number }> = {
  bp_sys: { low: 90, high: 140, normal: 120 },
  bp_dia: { low: 60, high: 90, normal: 80 },
  hr: { low: 60, high: 100, normal: 76 },
  rr: { low: 12, high: 20, normal: 16 },
  temp: { low: 36.1, high: 37.5, normal: 36.8 },
  spo2: { low: 94, high: 100, normal: 98 },
  rbs: { low: 70, high: 140, normal: 110 },
};

function flagVital(id: string, value: unknown): "low" | "high" | "ok" | null {
  const r = VITAL_RANGES[id];
  if (!r || value === "" || value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  if (n < r.low) return "low";
  if (n > r.high) return "high";
  return "ok";
}

const VITAL_FLAG_STYLE = {
  low: { text: "text-[#2A4A6A]", ring: "border-[#3A6A8A]", chip: "bg-[#E8F0F8] text-[#2A4A6A]", label: "Low" },
  high: { text: "text-[#8B3030]", ring: "border-[#C45C4A]", chip: "bg-[#FCE8E6] text-[#8B3030]", label: "High" },
  ok: { text: "text-[#2A4A32]", ring: "border-[#A8C4A0]", chip: "bg-[#E8EFE6] text-[#2A4A32]", label: "Normal" },
} as const;

function VitalsGrid({
  fields,
  values,
  onChange,
  onFillNormal,
}: {
  fields: SpecialtyField[];
  values: Record<string, unknown>;
  onChange: (id: string, v: unknown) => void;
  onFillNormal: () => void;
}) {
  const abnormal = fields.filter((f) => {
    const flag = flagVital(f.id, values[f.id]);
    return flag === "low" || flag === "high";
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] px-4 py-3">
        <p
          className={cn(
            "text-xs font-medium",
            abnormal.length > 0 ? "text-[#8B3030]" : "text-[#5C6B63]",
          )}
        >
          {abnormal.length > 0
            ? `${abnormal.length} value${abnormal.length === 1 ? "" : "s"} out of range`
            : "Tap Fill normal, then change only what’s abnormal"}
        </p>
        <button
          type="button"
          onClick={onFillNormal}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1B3B2E] bg-[#1B3B2E] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#244C3B]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Fill normal
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {fields.map((f) => {
          const flag = flagVital(f.id, values[f.id]);
          const style = flag ? VITAL_FLAG_STYLE[flag] : null;
          const range = VITAL_RANGES[f.id];
          return (
            <div key={f.id} className="rounded-2xl border border-[#E8E4DE] bg-white p-3 transition">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                  {f.label}
                </p>
                {flag && style ? (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", style.chip)}>
                    {style.label}
                  </span>
                ) : null}
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={values[f.id] == null ? "" : String(values[f.id])}
                onChange={(e) =>
                  onChange(f.id, e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="—"
                className={cn(
                  "mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-2xl font-semibold tabular-nums outline-none placeholder:text-[#D8D2CA]",
                  style ? style.text : "text-[#1B3B2E]",
                )}
              />
              <p className="mt-0.5 text-[10px] text-[#B4B8B4]">
                {f.unit ? <span>{f.unit}</span> : null}
                {f.unit && range ? " · " : ""}
                {range ? `${range.low}–${range.high}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Presentation chip → seeds Visit complaint + Exam provisional */
const PRESENTATION_SEED: Record<
  string,
  { complaint: string; hpi?: string; provisional: string; orders?: string }
> = {
  Fever: {
    complaint: "Fever x 3 days",
    hpi: "Acute onset. Associated fever. No chest pain / syncope.",
    provisional: "Viral fever",
    orders: "fever",
  },
  Hypertension: {
    complaint: "Follow-up for chronic disease",
    hpi: "Symptoms stable. Compliant with current therapy. No red-flag symptoms.",
    provisional: "Essential hypertension",
    orders: "dm_htn",
  },
  Diabetes: {
    complaint: "Follow-up for chronic disease",
    hpi: "Taking home meds regularly. No red-flag symptoms.",
    provisional: "Uncontrolled type 2 diabetes",
    orders: "dm_htn",
  },
  Anemia: {
    complaint: "Generalised weakness",
    provisional: "Iron deficiency anemia",
    orders: "basic",
  },
  Infection: {
    complaint: "Fever x 3 days",
    provisional: "Lower respiratory tract infection",
    orders: "fever",
  },
  "General checkup": {
    complaint: "No new complaints since last visit.",
    provisional: "Clinically stable — for routine follow-up.",
    orders: "basic",
  },
  "Cough / breathlessness": {
    complaint: "Cough with expectoration",
    hpi: "Associated cough / SOB. No chest pain / syncope.",
    provisional: "Lower respiratory tract infection",
    orders: "basic",
  },
  "Abdominal pain": {
    complaint: "Abdominal pain",
    hpi: "Acute onset. No vomiting / diarrhea.",
    provisional: "Acute gastroenteritis",
    orders: "basic",
  },
  "Chest pain": {
    complaint: "Chest pain",
    hpi: "Acute onset. Associated cough / SOB.",
    provisional: "Chest pain — rule out ACS / non-cardiac",
    orders: "basic",
  },
  "Weakness / fatigue": {
    complaint: "Generalised weakness",
    provisional: "Iron deficiency anemia",
    orders: "basic",
  },
};

function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Stethoscope;
  return <Icon className={className} strokeWidth={1.75} />;
}

function TextareaField({
  field,
  value,
  onChange,
}: {
  field: SpecialtyField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const chips = quickFindingsFor(field);
  const current = (value as string) ?? "";
  const hasText = current.trim().length > 0;
  const [open, setOpen] = useState(false);
  const showBox = open || hasText;

  return (
    <div className="space-y-2.5">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((phrase, i) => {
            const on = current.includes(phrase);
            return (
              <button
                key={phrase}
                type="button"
                onClick={() =>
                  onChange(
                    on
                      ? current.replace(phrase, "").replace(/\s{2,}/g, " ").trim()
                      : current
                        ? `${current.trim()} ${phrase}`
                        : phrase,
                  )
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                  on
                    ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                    : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
                )}
              >
                {i === 0 ? "Normal" : phrase}
              </button>
            );
          })}
        </div>
      ) : null}
      {showBox ? (
        <textarea
          autoFocus={open && !hasText}
          className={cn(
            "w-full resize-y rounded-2xl border-2 border-[#E8E4DE] bg-white px-3.5 py-3 text-sm text-[#1B3B2E] shadow-[inset_0_1px_2px_rgba(27,59,46,0.04)] outline-none transition focus:border-[#1B3B2E]/45 focus:ring-4 focus:ring-[#1B3B2E]/08",
            "min-h-[56px]",
          )}
          placeholder={field.placeholder ?? "Tap a chip above, or type only if different"}
          value={current}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#D8D2CA] px-3 py-1.5 text-[11px] font-semibold text-[#8A8F8C] transition hover:border-[#1B3B2E] hover:text-[#1B3B2E]"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Add free-text note
        </button>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SpecialtyField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "w-full border-0 border-b-2 border-[#D8D2CA] bg-transparent px-0 py-2 text-sm font-medium text-[#1B3B2E] outline-none transition focus:border-[#1B3B2E]";

  if (field.type === "textarea") {
    return <TextareaField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-[#E8E4DE]"
        />
        Yes
      </label>
    );
  }

  if (field.type === "select" || field.type === "laterality") {
    const options =
      field.type === "laterality" ? ["Left", "Right", "Bilateral"] : (field.options ?? []);
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? "" : o)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                on
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                  : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {(field.options ?? []).map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                on
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                  : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "scale") {
    const n = Number(value) || 0;
    return (
      <input
        type="range"
        min={0}
        max={10}
        value={n}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    );
  }

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "time"
          ? "time"
          : "text";

  return (
    <div className="relative">
      <input
        type={inputType}
        className={cn(base, field.unit && "pr-12")}
        placeholder={field.placeholder}
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(
            field.type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
      {field.unit ? (
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[#8A8F8C]">
          {field.unit}
        </span>
      ) : null}
    </div>
  );
}

function ScorePanel({
  scores,
  values,
  onChange,
}: {
  scores: SpecialtyScore[];
  values: Record<string, unknown>;
  onChange: (id: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      {scores.map((score) => {
        const total = score.items.reduce((sum, item) => {
          const v = Number(values[`${score.id}.${item.id}`]) || 0;
          return sum + v;
        }, 0);
        return (
          <div key={score.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1B3B2E]">{score.name}</p>
                <p className="text-xs text-[#8A8F8C]">{score.description}</p>
              </div>
              <p className="text-sm font-semibold text-[#B8735D]">
                {total}
                {score.max != null ? <span className="text-[#8A8F8C]">/{score.max}</span> : null}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {score.items.map((item) => (
                <label key={item.id} className="block text-xs font-medium text-[#5C6B63]">
                  {item.label}
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    className="mt-1.5 w-full border-0 border-b border-[#E8E4DE] bg-transparent py-2 text-sm outline-none focus:border-[#1B3B2E]"
                    value={Number(values[`${score.id}.${item.id}`]) || 0}
                    onChange={(e) => onChange(`${score.id}.${item.id}`, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleForm({
  module,
  specialty,
  doctor,
  patient,
  values,
  setValues,
  onSaved,
}: {
  module: SpecialtyModule;
  specialty: SpecialtyDefinition;
  doctor: HospitalDoctorRecord | null;
  patient: PanelPatient | null;
  values: Record<string, unknown>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onSaved: () => void;
}) {
  const set = (id: string, v: unknown) => setValues((prev) => ({ ...prev, [id]: v }));
  const normalisable = (module.fields ?? []).filter((f) => normalFindingFor(f));
  const isVitals = module.kind === "vitals_extended";

  const markAllNormal = () => {
    const next: Record<string, unknown> = { ...values };
    for (const f of normalisable) {
      const phrase = normalFindingFor(f);
      if (phrase && !String(next[f.id] ?? "").trim()) next[f.id] = phrase;
    }
    setValues(next);
    toast.success("Normals filled — edit only what’s abnormal");
  };

  const fillVitalsNormal = () => {
    const next: Record<string, unknown> = { ...values };
    for (const f of module.fields ?? []) {
      const r = VITAL_RANGES[f.id];
      if (r && (next[f.id] === undefined || next[f.id] === "")) next[f.id] = r.normal;
    }
    setValues(next);
    toast.success("Typical normal vitals filled");
  };

  const save = () => {
    if (!patient) {
      toast.error("Pick a patient first");
      return;
    }
    saveSpecialtyChartNote({
      specialtyId: specialty.id,
      doctorId: doctor?.doctorId ?? "unknown",
      patientName: patient.name,
      moduleId: module.id,
      values,
    });
    toast.success(`${module.title} saved`);
    onSaved();
  };

  return (
    <div className="space-y-6">
      {isVitals && module.fields?.length ? (
        <VitalsGrid
          fields={module.fields}
          values={values}
          onChange={set}
          onFillNormal={fillVitalsNormal}
        />
      ) : null}

      {!isVitals && normalisable.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] px-4 py-3">
          <p className="text-xs font-medium text-[#5C6B63]">Chart by exception</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={markAllNormal}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1B3B2E] bg-[#1B3B2E] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#244C3B]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Mark all normal
            </button>
            {Object.keys(values).length > 0 ? (
              <button
                type="button"
                onClick={() => setValues({})}
                className="rounded-full border border-[#E2E0DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#8A8F8C] hover:bg-[#F5F2ED]"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isVitals && module.fields?.length ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {module.fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : "",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
                {field.label}
                {field.required ? <span className="text-[#C45C4A]"> *</span> : null}
              </p>
              <div className="mt-1.5">
                <FieldInput field={field} value={values[field.id]} onChange={(v) => set(field.id, v)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {module.scores?.length ? (
        <ScorePanel scores={module.scores} values={values} onChange={set} />
      ) : null}

      {module.orderSets?.length ? (
        <div className="space-y-5">
          {module.orderSets.map((os) => (
            <div key={os.id}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[#1B3B2E]">{os.name}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
                  {os.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {os.items.map((item) => {
                  const key = `order.${os.id}.${item}`;
                  const on = Boolean(values[key]);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => set(key, !on)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        on
                          ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                          : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
                      )}
                    >
                      {on ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {module.procedures?.length ? (
        <div className="flex flex-wrap gap-2">
          {module.procedures.map((p) => {
            const key = `proc.${p.id}`;
            const on = Boolean(values[key]);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set(key, !on)}
                className={cn(
                  "rounded-full border px-4 py-2 text-left text-xs transition",
                  on
                    ? "border-[#1B3B2E] bg-[#E8EFE6] font-semibold text-[#1B3B2E]"
                    : "border-[#E8E4DE] text-[#5C6B63] hover:border-[#1B3B2E]/30",
                )}
              >
                {p.name}
                <span className="ml-1.5 text-[#8A8F8C]">{p.durationMin} min</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E4DE] bg-[#FAF9F7] px-4 py-3">
        <p className="text-xs font-medium text-[#8A8F8C]">
          Captured here shows in the encounter note → <span className="font-semibold text-[#1B3B2E]">Sign &amp; save visit</span>
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!patient}
          className="rounded-full border-2 border-[#C8D4C8] bg-white px-4 py-2 text-xs font-semibold text-[#3D5A45] transition hover:border-[#1B3B2E]/45 disabled:opacity-50"
        >
          Save {module.title} only
        </button>
      </div>
    </div>
  );
}

type SummaryLine = { label: string; value: string; flag?: "low" | "high" };

function summarizeModuleValues(
  module: SpecialtyModule,
  values: Record<string, unknown>,
): SummaryLine[] {
  const out: SummaryLine[] = [];
  for (const f of module.fields ?? []) {
    const v = values[f.id];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "boolean") {
      if (v) out.push({ label: f.label, value: "Yes" });
      continue;
    }
    if (f.type === "multiselect" && Array.isArray(v)) {
      if (v.length) out.push({ label: f.label, value: v.join(", ") });
      continue;
    }
    const flag = flagVital(f.id, v);
    out.push({
      label: f.label,
      value: `${String(v)}${f.unit ? ` ${f.unit}` : ""}`,
      flag: flag === "low" || flag === "high" ? flag : undefined,
    });
  }
  for (const os of module.orderSets ?? []) {
    const items = os.items.filter((item) => values[`order.${os.id}.${item}`]);
    if (items.length) out.push({ label: os.name, value: items.join(", ") });
  }
  for (const p of module.procedures ?? []) {
    if (values[`proc.${p.id}`]) out.push({ label: "Procedure", value: p.name });
  }
  return out;
}

function EncounterSummary({
  specialty,
  moduleValues,
  patient,
  activeModuleId,
  onJump,
  onSignSave,
}: {
  specialty: SpecialtyDefinition;
  moduleValues: Record<string, Record<string, unknown>>;
  patient: PanelPatient | null;
  activeModuleId: string;
  onJump: (moduleId: string) => void;
  onSignSave: () => void;
}) {
  const sections = specialty.modules
    .map((m) => ({ module: m, lines: summarizeModuleValues(m, moduleValues[m.id] ?? {}) }))
    .filter((s) => s.lines.length > 0);
  const total = sections.reduce((n, s) => n + s.lines.length, 0);

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="overflow-hidden rounded-[24px] border-2 border-[#CBD9CF] bg-white shadow-[0_8px_28px_rgba(27,59,46,0.06)]">
        <div className="flex items-center gap-2.5 border-b border-[#E8E4DE] bg-gradient-to-r from-[#EAF1EC] to-[#F6FAF6] px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#1B3B2E] text-white">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1B3B2E]">Encounter note</p>
            <p className="truncate text-[11px] text-[#8A8F8C]">
              {patient ? patient.name : "No patient selected"}
              {total > 0 ? ` · ${total} item${total === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>

        <div className="max-h-[52vh] space-y-3.5 overflow-y-auto px-4 py-3.5">
          {sections.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#A8ADA9]">
              Nothing charted yet. Fill Visit, Vitals, Exam, Orders or Plan and it appears here.
            </p>
          ) : (
            sections.map((s) => (
              <button
                key={s.module.id}
                type="button"
                onClick={() => onJump(s.module.id)}
                className={cn(
                  "block w-full rounded-2xl border px-3 py-2.5 text-left transition hover:border-[#1B3B2E]/40 hover:bg-[#FAFBFA]",
                  s.module.id === activeModuleId
                    ? "border-[#1B3B2E]/35 bg-[#F4F8F4]"
                    : "border-[#EEEBE5] bg-white",
                )}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                  {s.module.title}
                </p>
                <ul className="space-y-0.5">
                  {s.lines.map((l, i) => (
                    <li key={i} className="flex gap-1.5 text-[12px] leading-snug">
                      <span className="shrink-0 font-medium text-[#5C6B63]">{l.label}:</span>
                      <span
                        className={cn(
                          "min-w-0 break-words",
                          l.flag === "high"
                            ? "font-semibold text-[#8B3030]"
                            : l.flag === "low"
                              ? "font-semibold text-[#2A4A6A]"
                              : "text-[#1B3B2E]",
                        )}
                      >
                        {l.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[#E8E4DE] p-3">
          <button
            type="button"
            onClick={onSignSave}
            disabled={!patient || total === 0}
            className="w-full rounded-full border border-[#1B3B2E] bg-[#1B3B2E] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(27,59,46,0.25)] transition hover:bg-[#244C3B] disabled:border-[#C8C2BA] disabled:bg-[#C8C2BA] disabled:shadow-none"
          >
            Sign &amp; save visit
          </button>
        </div>
      </div>
    </aside>
  );
}

export function SpecialtyWorkstation({
  specialty,
  doctor,
}: {
  specialty: SpecialtyDefinition;
  doctor: HospitalDoctorRecord | null;
}) {
  const [activeModuleId, setActiveModuleId] = useState(specialty.modules[0]?.id ?? "");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<string | null>(null);
  const [moduleValues, setModuleValues] = useState<Record<string, Record<string, unknown>>>({});
  const [tick, setTick] = useState(0);
  const [deskTab, setDeskTab] = useState<"clinical" | "anatomy">("clinical");

  useEffect(() => {
    setActiveModuleId(specialty.modules[0]?.id ?? "");
    setDeskTab("clinical");
    setPresentation(null);
    setModuleValues({});
  }, [specialty.id, specialty.modules]);

  useEffect(() => {
    return subscribeSpecialtyCharts(() => setTick((t) => t + 1));
  }, []);

  useEffect(() => {
    void import("@/lib/specialties").then(({ hydrateSpecialtyChartsFromRemote }) =>
      hydrateSpecialtyChartsFromRemote(specialty.id).then(() => setTick((t) => t + 1)),
    );
  }, [specialty.id]);

  const module = specialty.modules.find((m) => m.id === activeModuleId) ?? specialty.modules[0];
  const patient = PANEL_PATIENTS.find((p) => p.id === patientId) ?? null;
  const values = moduleValues[module?.id ?? ""] ?? {};
  const setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>> = (updater) => {
    if (!module) return;
    setModuleValues((prev) => {
      const current = prev[module.id] ?? {};
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [module.id]: next };
    });
  };

  const recent = useMemo(
    () => chartsForSpecialty(specialty.id, doctor?.doctorId).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specialty.id, doctor?.doctorId, tick],
  );

  const applyPresentation = (label: string) => {
    const seed = PRESENTATION_SEED[label];
    setPresentation((prev) => (prev === label ? null : label));
    if (!seed || presentation === label) return;

    setModuleValues((prev) => {
      const next = { ...prev };
      const intakeId = specialty.modules.find((m) => m.kind === "intake")?.id;
      const examId = specialty.modules.find((m) => m.kind === "exam")?.id;
      const ordersId = specialty.modules.find((m) => m.kind === "orders")?.id;

      if (intakeId) {
        next[intakeId] = {
          ...(next[intakeId] ?? {}),
          complaint: seed.complaint,
          ...(seed.hpi ? { hpi: seed.hpi } : {}),
        };
      }
      if (examId) {
        next[examId] = {
          ...(next[examId] ?? {}),
          provisional: seed.provisional,
        };
      }
      if (ordersId && seed.orders) {
        const os = specialty.modules
          .find((m) => m.id === ordersId)
          ?.orderSets?.find((o) => o.id === seed.orders);
        if (os) {
          const orderVals: Record<string, unknown> = { ...(next[ordersId] ?? {}) };
          for (const item of os.items) orderVals[`order.${os.id}.${item}`] = true;
          next[ordersId] = orderVals;
        }
      }
      return next;
    });

    const intake = specialty.modules.find((m) => m.kind === "intake");
    if (intake) setActiveModuleId(intake.id);
    toast.message(`${label} seeded`, { description: "Visit + diagnosis + suggested orders filled" });
  };

  const signAndSaveVisit = () => {
    if (!patient) {
      toast.error("Pick a patient first");
      return;
    }
    let saved = 0;
    for (const m of specialty.modules) {
      const v = moduleValues[m.id];
      if (!v) continue;
      const hasVal = Object.values(v).some(
        (x) => x !== "" && x != null && !(Array.isArray(x) && x.length === 0),
      );
      if (!hasVal) continue;
      saveSpecialtyChartNote({
        specialtyId: specialty.id,
        doctorId: doctor?.doctorId ?? "unknown",
        patientName: patient.name,
        moduleId: m.id,
        values: v,
      });
      saved++;
    }
    if (saved === 0) {
      toast.error("Nothing charted yet");
      return;
    }
    toast.success(`Visit signed — ${saved} section${saved === 1 ? "" : "s"} saved`);
    setTick((t) => t + 1);
  };

  const moduleIndex = Math.max(
    0,
    specialty.modules.findIndex((m) => m.id === module?.id),
  );

  return (
    <div className="relative mx-auto w-full max-w-[1400px] space-y-5 pb-8">
      {/* Soft atmosphere wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-8 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: specialty.accentSoft }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 top-24 h-40 w-40 rounded-full bg-[#F0DDD6]/50 blur-3xl"
      />

      {/* Hero header with accent border */}
      <header
        className="relative overflow-hidden rounded-[28px] border-2 bg-white/90 p-5 shadow-[0_8px_30px_rgba(27,59,46,0.06)] backdrop-blur-sm sm:p-6"
        style={{ borderColor: specialty.accentSoft, borderTopColor: specialty.accent, borderTopWidth: 4 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-inner"
              style={{ background: specialty.accentSoft, color: specialty.accent }}
            >
              <SpecialtyIcon name={specialty.icon} className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: specialty.accent }}
              >
                {specialty.unitLabel}
              </p>
              <h1 className="font-serif text-[1.85rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2.15rem]">
                {specialty.shortName} desk
              </h1>
              <p className="mt-1 text-sm text-[#5C6B63]">
                {doctor?.name ?? "Doctor"} · {specialty.tagline}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeskTab("clinical")}
              className={cn(
                "rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
                deskTab === "clinical"
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                  : "border-[#C8D4C8] bg-white text-[#3D5A45] hover:border-[#1B3B2E]/40",
              )}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setDeskTab("anatomy")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
                deskTab === "anatomy"
                  ? "border-[#3A6A8A] bg-[#3A6A8A] text-white shadow-sm"
                  : "border-[#B8CCDC] bg-white text-[#2A4A6A] hover:border-[#3A6A8A]/50",
              )}
            >
              <Box className="h-4 w-4" />
              Anatomy
            </button>
          </div>
        </div>
      </header>

      {deskTab === "anatomy" ? (
        <SpecialtyAnatomyPanel specialty={specialty} />
      ) : (
        <>
          {/* Patient + presentation panel */}
          <section className="relative space-y-4 rounded-[24px] border-2 border-[#E8E4DE] bg-white p-4 shadow-[0_4px_20px_rgba(27,59,46,0.04)] sm:p-5">
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
                Patient
              </p>
              <div className="flex flex-wrap gap-2">
                {PANEL_PATIENTS.map((p) => {
                  const on = p.id === patientId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPatientId(on ? null : p.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        on
                          ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                          : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold",
                          on ? "bg-white/25 text-white" : "bg-[#F0EEE9] text-[#5C6B63]",
                        )}
                      >
                        {p.initials}
                      </span>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-dashed border-[#E8E4DE] pt-4">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
                Presentation — tap to seed Visit + diagnosis + orders
              </p>
              <div className="flex flex-wrap gap-2">
                {specialty.commonPresentations.map((p) => {
                  const on = presentation === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPresentation(p)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                        on
                          ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                          : "border-[#E2E0DB] bg-[#FAF9F7] text-[#5C6B63] hover:border-[#C8C2BA]",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {patient?.allergyWarning ? (
              <div className="flex items-center gap-2 rounded-2xl border-2 border-[#E9C46A] bg-[#FFFBF0] px-3.5 py-2.5 text-xs font-semibold text-[#92400E]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F5E6B8] text-[10px]">
                  !
                </span>
                Known allergy: {patient.allergyWarning}
              </div>
            ) : null}
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
          {/* Module tabs */}
          <nav
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Clinical modules"
          >
            {specialty.modules.map((m, i) => {
              const active = m.id === module?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModuleId(m.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                    active
                      ? "border-[#1B3B2E] bg-[#1B3B2E] text-white shadow-sm"
                      : "border-[#E2E0DB] bg-white text-[#5C6B63] hover:border-[#C8C2BA]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                      active ? "bg-white/25 text-white" : "bg-[#F0EEE9] text-[#8A8F8C]",
                    )}
                  >
                    {i + 1}
                  </span>
                  {m.title}
                </button>
              );
            })}
          </nav>

          {/* Module workspace */}
          <section className="min-h-[320px] rounded-[28px] border border-[#E8E4DE] bg-white p-5 shadow-[0_4px_20px_rgba(27,59,46,0.04)] sm:p-6">
            {module ? (
              <>
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] px-4 py-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1B3B2E] text-sm font-bold text-white">
                    {moduleIndex + 1}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1B3B2E]">{module.title}</h2>
                    {module.description ? (
                      <p className="text-sm text-[#5C6B63]">{module.description}</p>
                    ) : null}
                  </div>
                </div>
                <ModuleForm
                  module={module}
                  specialty={specialty}
                  doctor={doctor}
                  patient={patient}
                  values={values}
                  setValues={setValues}
                  onSaved={() => setTick((t) => t + 1)}
                />
              </>
            ) : (
              <p className="text-sm text-[#8A8F8C]">No modules for this specialty.</p>
            )}
          </section>
          </div>

          <EncounterSummary
            specialty={specialty}
            moduleValues={moduleValues}
            patient={patient}
            activeModuleId={module?.id ?? ""}
            onJump={setActiveModuleId}
            onSignSave={signAndSaveVisit}
          />
          </div>

          {recent.length > 0 ? (
            <section className="rounded-[24px] border-2 border-[#E8E4DE] bg-white/80 p-4 sm:p-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
                Recent notes
              </h3>
              <ul className="divide-y divide-[#F0EDE8]">
                {recent.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-[#1B3B2E]">{n.patientName}</p>
                      <p className="text-xs text-[#8A8F8C]">
                        {specialty.modules.find((m) => m.id === n.moduleId)?.title ?? n.moduleId}
                      </p>
                    </div>
                    <time className="shrink-0 rounded-full bg-[#F5F2ED] px-2.5 py-1 text-[10px] font-semibold text-[#8A8F8C]">
                      {new Date(n.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
