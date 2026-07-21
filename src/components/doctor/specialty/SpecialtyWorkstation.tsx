import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Baby,
  Bone,
  Brain,
  Box,
  Check,
  ClipboardList,
  Ear,
  Eye,
  Heart,
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

function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Stethoscope;
  return <Icon className={className} strokeWidth={1.75} />;
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
    "w-full rounded-xl border border-[#E8E4DE] bg-white px-3 py-2.5 text-sm text-[#1B3B2E] outline-none focus:border-[#B8735D]/50 focus:ring-2 focus:ring-[#B8735D]/15";

  if (field.type === "textarea") {
    return (
      <textarea
        className={cn(base, "min-h-[88px] resize-y")}
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
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
      field.type === "laterality" ? ["Left", "Right", "Bilateral"] : field.options ?? [];
    return (
      <select
        className={base}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() =>
                onChange(on ? selected.filter((x) => x !== o) : [...selected, o])
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                on
                  ? "bg-[#1B3B2E] text-white"
                  : "bg-[#F5F2ED] text-[#5C6B63] hover:bg-[#EDEAE6]",
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
    field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text";

  return (
    <div className="relative">
      <input
        type={inputType}
        className={cn(base, field.unit && "pr-14")}
        placeholder={field.placeholder}
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
        }
      />
      {field.unit ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8F8C]">
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
    <div className="space-y-5">
      {scores.map((score) => {
        const total = score.items.reduce((sum, item) => {
          const v = Number(values[`${score.id}.${item.id}`]) || 0;
          return sum + v;
        }, 0);
        return (
          <div key={score.id} className="rounded-2xl border border-[#E8E4DE] bg-[#FAF8F5] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1B3B2E]">{score.name}</p>
                <p className="text-xs text-[#8A8F8C]">{score.description}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-[#B8735D] ring-1 ring-[#E8E4DE]">
                {total}
                {score.max != null ? <span className="text-[#8A8F8C]">/{score.max}</span> : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {score.items.map((item) => (
                <label key={item.id} className="block text-xs font-medium text-[#5C6B63]">
                  {item.label}
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] bg-white px-3 py-2 text-sm"
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
  patientName,
  onSaved,
}: {
  module: SpecialtyModule;
  specialty: SpecialtyDefinition;
  doctor: HospitalDoctorRecord | null;
  patientName: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const set = (id: string, v: unknown) => setValues((prev) => ({ ...prev, [id]: v }));

  const save = () => {
    if (!patientName.trim()) {
      toast.error("Enter a patient name before saving");
      return;
    }
    saveSpecialtyChartNote({
      specialtyId: specialty.id,
      doctorId: doctor?.doctorId ?? "unknown",
      patientName: patientName.trim(),
      moduleId: module.id,
      values,
    });
    toast.success(`${module.title} saved to specialty chart`);
    setValues({});
    onSaved();
  };

  return (
    <div className="space-y-5">
      {module.fields?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {module.fields.map((field) => (
            <label
              key={field.id}
              className={cn(
                "block text-xs font-semibold tracking-wide text-[#5C6B63]",
                field.type === "textarea" || field.type === "multiselect" ? "sm:col-span-2" : "",
              )}
            >
              {field.label}
              {field.required ? <span className="text-[#B8735D]"> *</span> : null}
              <div className="mt-1.5">
                <FieldInput field={field} value={values[field.id]} onChange={(v) => set(field.id, v)} />
              </div>
            </label>
          ))}
        </div>
      ) : null}

      {module.scores?.length ? (
        <ScorePanel scores={module.scores} values={values} onChange={set} />
      ) : null}

      {module.orderSets?.length ? (
        <div className="space-y-3">
          {module.orderSets.map((os) => (
            <div key={os.id} className="rounded-2xl border border-[#E8E4DE] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1B3B2E]">{os.name}</p>
                <span className="rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F8C]">
                  {os.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {os.items.map((item) => {
                  const key = `order.${os.id}.${item}`;
                  const on = Boolean(values[key]);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => set(key, !on)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                        on
                          ? "bg-[#1B3B2E] text-white"
                          : "bg-[#F5F2ED] text-[#5C6B63] hover:bg-[#EDEAE6]",
                      )}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
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
        <div className="grid gap-3 sm:grid-cols-2">
          {module.procedures.map((p) => {
            const key = `proc.${p.id}`;
            const on = Boolean(values[key]);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set(key, !on)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  on
                    ? "border-[#1B3B2E] bg-[#E8EFE6]"
                    : "border-[#E8E4DE] bg-white hover:border-[#B8735D]/40",
                )}
              >
                <p className="text-sm font-semibold text-[#1B3B2E]">{p.name}</p>
                <p className="mt-1 text-xs text-[#8A8F8C]">
                  {p.durationMin} min
                  {p.requiresConsent ? " · Consent required" : ""}
                  {p.implantPossible ? " · Implant possible" : ""}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          className="rounded-2xl bg-[#1B3B2E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244C3B]"
        >
          Save {module.title}
        </button>
      </div>
    </div>
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
  const [patientName, setPatientName] = useState("");
  const [tick, setTick] = useState(0);
  const [deskTab, setDeskTab] = useState<"clinical" | "anatomy">("clinical");

  useEffect(() => {
    setActiveModuleId(specialty.modules[0]?.id ?? "");
    setDeskTab("clinical");
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
  const recent = useMemo(
    () => chartsForSpecialty(specialty.id, doctor?.doctorId).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specialty.id, doctor?.doctorId, tick],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header
        className="overflow-hidden rounded-[28px] border border-[#E8E4DE] bg-white shadow-[0_4px_20px_rgba(27,59,46,0.06)]"
        style={{ borderTopColor: specialty.accent, borderTopWidth: 4 }}
      >
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: specialty.accentSoft, color: specialty.accent }}
            >
              <SpecialtyIcon name={specialty.icon} className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8F8C]">
                Specialty workstation
              </p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#1B3B2E]">
                {specialty.name}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-[#5C6B63]">{specialty.tagline}</p>
              <p className="mt-2 text-xs text-[#8A8F8C]">
                {doctor?.name ?? "Doctor"} · {doctor?.room ?? specialty.unitLabel} · assigned by admin
              </p>
            </div>
          </div>
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: specialty.accentSoft }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8F8C]">Unit</p>
            <p className="font-semibold" style={{ color: specialty.accent }}>
              {specialty.unitLabel}
            </p>
          </div>
        </div>

        <div className="border-t border-[#F0EDE8] px-6 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8F8C]">
            Common presentations
          </p>
          <div className="flex flex-wrap gap-2">
            {specialty.commonPresentations.map((p) => (
              <span
                key={p}
                className="rounded-full bg-[#F7F5F2] px-3 py-1 text-xs font-medium text-[#5C6B63]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDeskTab("clinical")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
            deskTab === "clinical" ? "text-white" : "bg-white text-[#5C6B63] ring-1 ring-[#E8E4DE]",
          )}
          style={deskTab === "clinical" ? { background: specialty.accent } : undefined}
        >
          <ClipboardList className="h-4 w-4" />
          Clinical charting
        </button>
        <button
          type="button"
          onClick={() => setDeskTab("anatomy")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
            deskTab === "anatomy" ? "text-white" : "bg-white text-[#5C6B63] ring-1 ring-[#E8E4DE]",
          )}
          style={deskTab === "anatomy" ? { background: specialty.accent } : undefined}
        >
          <Box className="h-4 w-4" />
          3D anatomy
        </button>
      </div>

      {deskTab === "anatomy" ? (
        <SpecialtyAnatomyPanel specialty={specialty} />
      ) : (
      <>
      <div className="rounded-[24px] border border-[#E8E4DE] bg-white p-4 sm:p-5">
        <label className="block text-xs font-semibold text-[#5C6B63]">
          Active patient for this specialty note
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient name"
            className="mt-1.5 w-full rounded-xl border border-[#E8E4DE] bg-[#FAF8F5] px-3 py-2.5 text-sm outline-none focus:border-[#B8735D]/50 focus:ring-2 focus:ring-[#B8735D]/15 sm:max-w-md"
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="h-fit rounded-[24px] border border-[#E8E4DE] bg-white p-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8F8C]">
            Clinical modules
          </p>
          <ul className="space-y-1">
            {specialty.modules.map((m) => {
              const active = m.id === module?.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setActiveModuleId(m.id)}
                    className={cn(
                      "w-full rounded-2xl px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "font-semibold text-white"
                        : "text-[#5C6B63] hover:bg-[#F7F5F2]",
                    )}
                    style={active ? { background: specialty.accent } : undefined}
                  >
                    {m.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-[24px] border border-[#E8E4DE] bg-white p-5 sm:p-6">
          {module ? (
            <>
              <div className="mb-5 flex items-start gap-3">
                <div
                  className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: specialty.accentSoft, color: specialty.accent }}
                >
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1B3B2E]">{module.title}</h2>
                  <p className="text-sm text-[#8A8F8C]">{module.description}</p>
                </div>
              </div>
              <ModuleForm
                module={module}
                specialty={specialty}
                doctor={doctor}
                patientName={patientName}
                onSaved={() => setTick((t) => t + 1)}
              />
            </>
          ) : (
            <p className="text-sm text-[#8A8F8C]">No modules configured for this specialty.</p>
          )}
        </section>
      </div>

      {recent.length > 0 ? (
        <section className="rounded-[24px] border border-[#E8E4DE] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[#1B3B2E]">Recent specialty notes</h3>
          <ul className="divide-y divide-[#F0EDE8]">
            {recent.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-[#1B3B2E]">{n.patientName}</p>
                  <p className="text-xs text-[#8A8F8C]">
                    {specialty.modules.find((m) => m.id === n.moduleId)?.title ?? n.moduleId}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-[#8A8F8C]">
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
