import React, { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { BLOOD_GROUPS, GENDERS } from "@/lib/reception-desk/mockData";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import type { ManagedPatient, RegisterPatientInput } from "@/lib/patient-management/schemas";
import { registerPatient as apiRegisterPatient } from "@/lib/patient-management/client";
import { managedToSharedPatient } from "@/lib/patient-management/compat";
import { registerPatient as registryRegister } from "@/lib/shared/patient-registry";
import {
  DuplicateCandidatesBanner,
  type DuplicateCandidate,
} from "@/components/patient-management/DuplicateCandidatesBanner";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  className?: string;
}

const Field = ({ label, required, children, hint, className }: FieldProps) => (
  <label className={cn("block min-w-0", className)}>
    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-600 font-mono">
      {label} {required ? <span className="text-status-noshowText">*</span> : null}
    </div>
    {children}
    {hint ? <div className="mt-1 text-[11px] leading-snug text-ink-400">{hint}</div> : null}
  </label>
);

const inputCls =
  "w-full h-10 px-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 placeholder:text-ink-400 transition-shadow";

const STEPS = [
  {
    id: "identity",
    label: "Identity",
    title: "Who is the patient?",
    blurb: "Capture the basics reception needs to open a hospital record.",
    icon: User,
  },
  {
    id: "contacts",
    label: "Contacts",
    title: "Emergency contact",
    blurb: "Optional but recommended for walk-ins and admissions.",
    icon: Users,
  },
  {
    id: "clinical",
    label: "Clinical",
    title: "Clinical & insurance",
    blurb: "Allergies and coverage help the next desk act safely.",
    icon: HeartPulse,
  },
  {
    id: "consent",
    label: "Consent",
    title: "Consent & documents",
    blurb: "Confirm notice was reviewed before the record is created.",
    icon: ShieldCheck,
  },
  {
    id: "review",
    label: "Review",
    title: "Confirm and register",
    blurb: "Quick check before the MRN and patient ID are issued.",
    icon: ClipboardList,
  },
] as const;

type Step = (typeof STEPS)[number]["id"];

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 py-2.5 last:border-0">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-ink-400 font-mono">
        {label}
      </span>
      <span className="text-right text-[13px] font-medium text-ink-900 break-words">{value}</span>
    </div>
  );
}

export default function Register() {
  const { addPatient, findDuplicate } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("identity");
  const [submitting, setSubmitting] = useState(false);
  const [apiDuplicates, setApiDuplicates] = useState<ManagedPatient[]>([]);
  const [forceCreate, setForceCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "Female",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    bloodGroup: "O+",
    allergies: "",
    insuranceProvider: "",
    policyId: "",
    consentAck: false,
  });

  const localDuplicate = useMemo(() => {
    if (!form.phone && !form.name) return null;
    return findDuplicate(form.phone, form.name, form.dob) || null;
  }, [findDuplicate, form.phone, form.name, form.dob]);

  const duplicateCandidates: DuplicateCandidate[] = useMemo(() => {
    if (apiDuplicates.length) return apiDuplicates;
    return localDuplicate ? [localDuplicate] : [];
  }, [apiDuplicates, localDuplicate]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setApiDuplicates([]);
      setForceCreate(false);
    };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[stepIndex]!;
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  const identityComplete = Boolean(form.name && form.phone && form.dob);
  const stepComplete = (id: Step) => {
    if (id === "identity") return identityComplete;
    if (id === "contacts") return Boolean(form.emergencyName && form.emergencyPhone);
    if (id === "clinical") return Boolean(form.bloodGroup);
    if (id === "consent") return form.consentAck;
    if (id === "review") return identityComplete && form.consentAck;
    return false;
  };

  const buildPayload = (forceCreateDespiteDuplicates: boolean): RegisterPatientInput => ({
    fullName: form.name.trim(),
    dateOfBirth: form.dob,
    gender: form.gender,
    phone: form.phone.trim(),
    email: form.email || undefined,
    addressLine1: form.address || undefined,
    bloodGroup: form.bloodGroup,
    allergiesSummary: form.allergies || undefined,
    insuranceProvider: form.insuranceProvider || undefined,
    insurancePolicyId: form.policyId || undefined,
    emergencyContacts:
      form.emergencyName && form.emergencyPhone
        ? [
            {
              fullName: form.emergencyName,
              phone: form.emergencyPhone,
              relation: form.emergencyRelation || undefined,
              isPrimary: true,
            },
          ]
        : undefined,
    allergies: form.allergies
      ? form.allergies
          .split(/[,;]/)
          .map((s) => ({
            substance: s.trim(),
            severity: "unknown" as const,
            status: "active" as const,
          }))
          .filter((a) => a.substance)
      : undefined,
    forceCreateDespiteDuplicates,
  });

  const dualWriteLocal = (managed?: ManagedPatient) => {
    const shared = managed ? managedToSharedPatient(managed) : undefined;
    if (shared) {
      registryRegister({
        ...shared,
        id: shared.id,
        mrn: shared.mrn,
        emergency: form.emergencyName
          ? {
              name: form.emergencyName,
              phone: form.emergencyPhone,
              relation: form.emergencyRelation,
            }
          : undefined,
      });
      return shared.id;
    }
    const newP = addPatient({
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      phone: form.phone,
      email: form.email || "—",
      address: form.address,
      emergencyName: form.emergencyName,
      emergencyPhone: form.emergencyPhone,
      emergencyRelation: form.emergencyRelation,
      bloodGroup: form.bloodGroup,
      allergies: form.allergies || "—",
      insuranceProvider: form.insuranceProvider || "Self-pay",
      policyId: form.policyId || "—",
    });
    registryRegister(newP);
    return newP.id;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.dob) {
      toast.error("Name, DOB and phone are required");
      setStep("identity");
      return;
    }
    if (!form.consentAck) {
      toast.error("Confirm consent acknowledgment on the consent step");
      setStep("consent");
      return;
    }

    setSubmitting(true);
    const payload = buildPayload(forceCreate);
    const api = await apiRegisterPatient(payload);

    if (api.ok && api.data.needsConfirmation && api.data.duplicates?.length && !forceCreate) {
      setApiDuplicates(api.data.duplicates);
      setSubmitting(false);
      toast.message("Duplicates found", { description: "Review matches or continue anyway." });
      return;
    }

    let patientId: string;
    if (api.ok && api.data.patient && !api.data.needsConfirmation) {
      const shared = managedToSharedPatient(api.data.patient);
      registryRegister({
        ...shared,
        emergency: form.emergencyName
          ? {
              name: form.emergencyName,
              phone: form.emergencyPhone,
              relation: form.emergencyRelation,
            }
          : undefined,
      });
      patientId = api.data.patient.mrn || api.data.patient.id;
      toast.success(`${api.data.patient.fullName} registered`, {
        description: `MRN ${api.data.patient.mrn}`,
      });
    } else {
      patientId = dualWriteLocal();
      if (api.ok === false) {
        toast.message("Saved locally", {
          description: api.error || "Hospital API unavailable — reception store updated.",
        });
      } else {
        toast.success("Patient registered locally");
      }
    }

    setSubmitting(false);
    nav({ to: "/reception/patients", search: { patient: patientId } });
  };

  const next = () => {
    if (step === "identity" && (!form.name || !form.phone || !form.dob)) {
      toast.error("Complete required identity fields");
      return;
    }
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]!.id);
  };
  const prev = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]!.id);

  return (
    <form
      data-testid="register-page"
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-28 lg:pb-8"
    >
      {/* Page header */}
      <header className="rounded-2xl border border-ink-200 bg-gradient-to-br from-white via-white to-sage-soft/40 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono font-medium uppercase tracking-[0.16em] text-sage">
              Reception · Registration
            </p>
            <h1 className="mt-1 font-heading text-[22px] font-semibold tracking-tight text-ink-900 sm:text-[24px]">
              Register a new patient
            </h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-500">
              Five short steps. Required fields are marked. You can jump ahead, but registration
              only completes after identity and consent.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] font-medium text-ink-400 transition-colors hover:text-status-noshowText sm:hidden"
            >
              Cancel
            </button>
            <div className="rounded-xl border border-sage/20 bg-white/80 px-4 py-3 text-right shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400">
                Step {stepIndex + 1} of {STEPS.length}
              </div>
              <div className="mt-0.5 text-[15px] font-heading font-semibold text-ink-900">
                {current.label}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-sage transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Registration steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = stepComplete(s.id) && i < stepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-sage bg-sage text-white shadow-sm"
                    : done
                      ? "border-sage/30 bg-sage-soft/70 text-sage"
                      : "border-ink-200 bg-white text-ink-500 hover:border-ink-300",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : done
                        ? "bg-sage text-white"
                        : "bg-ink-100 text-ink-500",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold">{s.label}</span>
                  <span
                    className={cn(
                      "hidden truncate text-[10px] sm:block",
                      active ? "text-white/75" : "text-ink-400",
                    )}
                  >
                    {s.title}
                  </span>
                </span>
                {!active ? <Icon className="ml-auto hidden h-3.5 w-3.5 opacity-50 lg:block" /> : null}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {duplicateCandidates.length > 0 && !forceCreate ? (
            <DuplicateCandidatesBanner
              candidates={duplicateCandidates}
              onOpenExisting={(id) => nav({ to: "/reception/patients", search: { patient: id } })}
              onContinueAnyway={() => {
                setForceCreate(true);
                setApiDuplicates([]);
                toast.message("Will create new record on submit");
              }}
            />
          ) : null}

          <section className="surface overflow-hidden rounded-2xl border border-ink-200 shadow-sm">
            <div className="border-b border-ink-100 bg-bone/40 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-soft text-sage">
                  <current.icon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-heading text-[17px] font-semibold text-ink-900">
                    {current.title}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-500">{current.blurb}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {step === "identity" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" required className="sm:col-span-2">
                    <input
                      data-testid="reg-name"
                      value={form.name}
                      onChange={set("name")}
                      className={inputCls}
                      placeholder="As on ID document"
                      autoFocus
                    />
                  </Field>
                  <Field label="Date of birth" required>
                    <input
                      data-testid="reg-dob"
                      type="date"
                      value={form.dob}
                      onChange={set("dob")}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Gender" required>
                    <select
                      data-testid="reg-gender"
                      value={form.gender}
                      onChange={set("gender")}
                      className={inputCls}
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Phone" required hint="Primary mobile for OTP and reminders">
                    <input
                      data-testid="reg-phone"
                      value={form.phone}
                      onChange={set("phone")}
                      className={inputCls}
                      placeholder="+91 …"
                      inputMode="tel"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      data-testid="reg-email"
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      className={inputCls}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <input
                      data-testid="reg-address"
                      value={form.address}
                      onChange={set("address")}
                      className={inputCls}
                      placeholder="Street, locality, city"
                    />
                  </Field>
                </div>
              ) : null}

              {step === "contacts" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed border-ink-200 bg-bone/30 px-4 py-3 text-[12.5px] text-ink-500">
                    Skip if the patient declines — you can add contacts later from the patient
                    profile.
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Contact name" className="sm:col-span-1">
                      <input
                        data-testid="reg-em-name"
                        value={form.emergencyName}
                        onChange={set("emergencyName")}
                        className={inputCls}
                        placeholder="Full name"
                      />
                    </Field>
                    <Field label="Contact phone">
                      <input
                        data-testid="reg-em-phone"
                        value={form.emergencyPhone}
                        onChange={set("emergencyPhone")}
                        className={inputCls}
                        placeholder="Mobile"
                        inputMode="tel"
                      />
                    </Field>
                    <Field label="Relation">
                      <input
                        data-testid="reg-em-relation"
                        value={form.emergencyRelation}
                        onChange={set("emergencyRelation")}
                        className={inputCls}
                        placeholder="Spouse, parent…"
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === "clinical" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Blood group">
                    <select
                      data-testid="reg-blood"
                      value={form.bloodGroup}
                      onChange={set("bloodGroup")}
                      className={inputCls}
                    >
                      {BLOOD_GROUPS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Allergies" hint="Comma-separated substances">
                    <input
                      data-testid="reg-allergies"
                      value={form.allergies}
                      onChange={set("allergies")}
                      className={inputCls}
                      placeholder="e.g. Penicillin, peanuts"
                    />
                  </Field>
                  <Field label="Insurance provider">
                    <input
                      data-testid="reg-ins-provider"
                      value={form.insuranceProvider}
                      onChange={set("insuranceProvider")}
                      className={inputCls}
                      placeholder="Self-pay if none"
                    />
                  </Field>
                  <Field label="Policy ID">
                    <input
                      data-testid="reg-policy"
                      value={form.policyId}
                      onChange={set("policyId")}
                      className={inputCls}
                      placeholder="Policy / member ID"
                    />
                  </Field>
                </div>
              ) : null}

              {step === "consent" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-ink-200 bg-white p-4 text-[13px] leading-relaxed text-ink-600">
                    Patient (or guardian) acknowledges treatment, billing, and privacy notice.
                    Physical ID and insurance cards can be attached from the patient profile after
                    registration.
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-bone/40 px-4 py-3.5 transition-colors hover:border-sage/40 has-[:checked]:border-sage has-[:checked]:bg-sage-soft/50">
                    <input
                      type="checkbox"
                      checked={form.consentAck}
                      onChange={(e) => setForm((f) => ({ ...f, consentAck: e.target.checked }))}
                      data-testid="reg-consent-ack"
                      className="mt-0.5 h-4 w-4 rounded border-ink-300 text-sage focus:ring-sage"
                    />
                    <span className="text-[13px] text-ink-800">
                      <span className="font-medium text-ink-900">
                        Consent and privacy notice reviewed with patient
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-500">
                        Required before the hospital record is created.
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    data-testid="reg-upload-id"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white py-8 text-[12.5px] text-ink-500 transition-colors hover:border-sage/40 hover:bg-sage-soft/30 hover:text-sage"
                  >
                    <FileText className="h-4 w-4" />
                    Attach ID / insurance card after registration
                  </button>
                </div>
              ) : null}

              {step === "review" ? (
                <div className="space-y-3">
                  {(
                    [
                      {
                        title: "Identity",
                        step: "identity" as Step,
                        body: `${form.name || "—"} · ${form.dob || "—"} · ${form.gender} · ${form.phone || "—"}`,
                        extra: form.email || form.address || null,
                      },
                      {
                        title: "Emergency contact",
                        step: "contacts" as Step,
                        body: form.emergencyName
                          ? `${form.emergencyName} · ${form.emergencyPhone}${form.emergencyRelation ? ` · ${form.emergencyRelation}` : ""}`
                          : "Not provided",
                        extra: null,
                      },
                      {
                        title: "Clinical & insurance",
                        step: "clinical" as Step,
                        body: `Blood ${form.bloodGroup} · Allergies: ${form.allergies || "None noted"}`,
                        extra: `${form.insuranceProvider || "Self-pay"} / ${form.policyId || "—"}`,
                      },
                      {
                        title: "Consent",
                        step: "consent" as Step,
                        body: form.consentAck ? "Acknowledged" : "Not confirmed",
                        extra: null,
                      },
                    ] as const
                  ).map((block) => (
                    <div
                      key={block.title}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 bg-bone/20 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-ink-400">
                          {block.title}
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-ink-900">{block.body}</div>
                        {block.extra ? (
                          <div className="mt-0.5 text-[12px] text-ink-500">{block.extra}</div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(block.step)}
                        className="shrink-0 text-[12px] font-semibold text-sage hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

          </section>
        </div>

        {/* Live summary rail */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
            <div className="border-b border-ink-100 bg-sage px-5 py-4 text-white">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/70">
                Live draft
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-[15px] font-heading font-semibold">
                  {initialsFromName(form.name)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-heading font-semibold">
                    {form.name.trim() || "New patient"}
                  </div>
                  <div className="truncate text-[12px] text-white/75">
                    {form.phone || "Phone pending"}
                    {form.dob ? ` · ${form.dob}` : ""}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-2">
              <SummaryRow label="Gender" value={form.gender} />
              <SummaryRow label="Blood" value={form.bloodGroup} />
              <SummaryRow
                label="Emergency"
                value={form.emergencyName || "Not set"}
              />
              <SummaryRow
                label="Allergies"
                value={form.allergies || "None noted"}
              />
              <SummaryRow
                label="Cover"
                value={form.insuranceProvider || "Self-pay"}
              />
              <SummaryRow
                label="Consent"
                value={form.consentAck ? "Ready" : "Pending"}
              />
            </div>
            {forceCreate ? (
              <div className="mx-5 mb-4 rounded-lg border border-status-waitBorder bg-status-waitBg/50 px-3 py-2 text-[11px] text-status-waitText">
                Creating despite possible duplicates.
              </div>
            ) : null}
          </div>

          <div className="hidden rounded-2xl border border-ink-200 bg-bone/40 p-4 text-[12.5px] leading-relaxed text-ink-500 lg:block">
            Creates a hospital-scoped patient with QR ID when the API is available, and always syncs
            the local registry for desk workflows.
          </div>
        </aside>
      </div>

      {/* Action bar — sticky on mobile, card on larger screens */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(28,40,35,0.35)] backdrop-blur lg:static lg:z-auto lg:rounded-2xl lg:border lg:bg-white lg:px-5 lg:py-3.5 lg:shadow-sm lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {/* Back — secondary, outlined; icon-only on mobile */}
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            aria-label="Previous step"
            className={cn(
              "inline-flex h-11 shrink-0 select-none items-center justify-center gap-1.5 rounded-full border text-[13px] font-medium transition-all",
              "w-11 px-0 sm:w-auto sm:px-5",
              stepIndex === 0
                ? "pointer-events-none border-ink-100 text-ink-300"
                : "border-ink-200 bg-white text-ink-700 hover:border-ink-400 hover:bg-bone active:scale-[0.98]",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Step context — desktop only */}
          <div className="hidden min-w-0 flex-col md:flex">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <span className="truncate text-[13px] font-medium text-ink-900">{current.title}</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {/* Cancel — quiet text action, clearly distinct from Back */}
            <button
              type="button"
              data-testid="reg-cancel"
              onClick={() => window.history.back()}
              className="hidden h-11 select-none items-center rounded-full px-3 text-[12.5px] font-medium text-ink-400 transition-colors hover:text-status-noshowText sm:inline-flex"
            >
              Cancel
            </button>

            {step !== "review" ? (
              <>
                {(step === "contacts" || step === "clinical") && (
                  <button
                    type="button"
                    onClick={next}
                    className="hidden h-11 select-none items-center rounded-full px-3 text-[12.5px] font-medium text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline sm:inline-flex"
                  >
                    Skip for now
                  </button>
                )}
                {/* Primary — labeled with the next step so it reads as a destination */}
                <button
                  type="button"
                  onClick={next}
                  className="group inline-flex h-11 min-w-[150px] select-none items-center justify-center gap-2 rounded-full bg-sage px-6 text-[13px] font-semibold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_-4px_rgba(44,94,78,0.5)] transition-all hover:bg-sage-hover active:scale-[0.98] sm:min-w-[190px]"
                >
                  <span className="hidden sm:inline">Next: {STEPS[stepIndex + 1]!.label}</span>
                  <span className="sm:hidden">Continue</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </>
            ) : (
              <button
                type="submit"
                data-testid="reg-submit"
                disabled={submitting}
                className="inline-flex h-11 min-w-[170px] select-none items-center justify-center gap-2 rounded-full bg-sage px-6 text-[13px] font-semibold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_-4px_rgba(44,94,78,0.5)] transition-all hover:bg-sage-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px]"
              >
                <UserPlus className="h-4 w-4" />
                {submitting ? "Registering…" : "Register patient"}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
