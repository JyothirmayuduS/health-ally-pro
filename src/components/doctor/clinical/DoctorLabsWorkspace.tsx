import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock, FlaskConical, Search, Send, AlertCircle } from "lucide-react";
import { DoctorClinicalPageHeader } from "@/components/doctor/clinical/DoctorClinicalPageHeader";
import { DoctorClinicalPatientCard } from "@/components/doctor/clinical/DoctorClinicalPatientCard";
import { DoctorLockedPatientSelect } from "@/components/doctor/DoctorLockedPatientSelect";
import { apkDoctor } from "@/lib/doctor-apk-data";
import { LAB_ORDER_SETS, suggestedOrderSets } from "@/lib/clinical/lab-order-sets";
import {
  listClinicalPatients,
  resolveDoctorPatient,
  toEncounterPatientId,
} from "@/lib/doctor-patient-context";
import { doctorPatients } from "@/lib/doctor-mock-data";
import { loadLabCatalog } from "@/lib/shared/lab-catalog";
import { getSharedPatient, resolvePatientId, calcAge } from "@/lib/shared/patients";
import {
  pushLabOrder,
  nextLabOrderId,
  type DoctorLabLine,
} from "@/lib/lab-desk/order-bridge";
import type { LabPriority } from "@/lib/lab-desk/mockData";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE: Record<LabPriority, string> = {
  routine: "border-[#E8E4DF] bg-white text-[#1B3B2E]",
  urgent: "border-[#F5E6B8] bg-[#FFFBF0] text-[#5C4A1E]",
  stat: "border-[#F5C4BC] bg-[#FCE8E6] text-[#C45C4A]",
};

const SECTION_LABEL: Record<string, string> = {
  hematology: "Hematology",
  biochemistry: "Biochemistry",
  endocrinology: "Endocrinology",
  urinalysis: "Urinalysis",
  general: "General",
  collection: "Collection",
  all: "All",
};

type Props = {
  searchPatientId?: string;
};

export function DoctorLabsWorkspace({ searchPatientId }: Props) {
  const catalog = useMemo(() => loadLabCatalog(), []);
  const clinicalPatients = listClinicalPatients();
  const [patientId, setPatientId] = useState(
    searchPatientId ? toEncounterPatientId(searchPatientId) : doctorPatients[0]?.id ?? "",
  );
  const [priority, setPriority] = useState<LabPriority>("routine");
  const [selectedTests, setSelectedTests] = useState<string[]>(["CBC"]);
  const [indication, setIndication] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (searchPatientId) setPatientId(toEncounterPatientId(searchPatientId));
  }, [searchPatientId]);

  const panelSelectionId =
    clinicalPatients.find((p) => p.encounterId === patientId)?.id ??
    searchPatientId ??
    clinicalPatients[0]?.id ??
    "";

  const panelPatient = resolveDoctorPatient(panelSelectionId);
  const patient = useMemo(() => doctorPatients.find((p) => p.id === patientId), [patientId]);

  const suggestions = useMemo(
    () => (panelPatient ? suggestedOrderSets(panelPatient.condition) : LAB_ORDER_SETS.slice(0, 2)),
    [panelPatient],
  );

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = catalog.filter(
      (t) =>
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q),
    );
    const map = new Map<string, typeof catalog>();
    for (const test of filtered) {
      const list = map.get(test.section) ?? [];
      list.push(test);
      map.set(test.section, list);
    }
    return [...map.entries()];
  }, [catalog, search]);

  const selectedDetails = useMemo(
    () => catalog.filter((t) => selectedTests.includes(t.code)),
    [catalog, selectedTests],
  );

  const fastingRequired = selectedDetails.some((t) => t.fasting);
  const estimatedTotal = selectedDetails.reduce((s, t) => s + t.price, 0);
  const maxTat = selectedDetails.reduce((m, t) => Math.max(m, t.tat_hours ?? 0), 0);

  function toggleTest(code: string) {
    setSelectedTests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function applyOrderSet(codes: string[]) {
    const valid = codes.filter((c) => catalog.some((t) => t.code === c));
    setSelectedTests(valid);
    toast.message("Panel applied", { description: `${valid.length} test(s) selected` });
  }

  async function handleSubmit() {
    if (!patient || selectedTests.length === 0) return;
    setSending(true);
    const shared = getSharedPatient(resolvePatientId(patient.id));
    const lines: DoctorLabLine[] = selectedTests.map((code) => {
      const cat = catalog.find((t) => t.code === code);
      return {
        test_code: code,
        test_name: cat?.name ?? code,
        fasting: Boolean(cat?.fasting),
      };
    });
    pushLabOrder({
      id: nextLabOrderId(),
      patient: {
        id: shared?.id ?? patient.id,
        name: shared?.name ?? patient.name,
        mrn: shared?.mrn ?? `MRN-${patient.id}`,
        age: shared ? calcAge(shared.dob) : patient.age,
        sex: patient.gender.startsWith("M") ? "M" : "F",
        phone: shared?.phone ?? "",
      },
      doctor_id: "d-tyra",
      doctor_name: apkDoctor.name,
      doctor_specialty: apkDoctor.specialty,
      priority,
      lines,
      notes: indication || undefined,
      sent_at: new Date().toISOString(),
      source: "doctor",
    });
    toast.success("Lab order sent to desk", {
      description: `${lines.length} test(s) · ${priority.toUpperCase()}`,
    });
    setSending(false);
    setIndication("");
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      <DoctorClinicalPageHeader
        eyebrow="ORDERS · LAB"
        title="Lab orders"
        description="Order diagnostics with clinical indication and priority. Suggested panels are based on the patient's active problems."
        icon={FlaskConical}
        steps={["Confirm patient", "Select tests", "Set priority", "Send to lab desk"]}
      />

      {searchPatientId ? (
        <DoctorClinicalPatientCard patientId={searchPatientId} />
      ) : (
        <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4">
          <DoctorLockedPatientSelect
            label="Patient"
            value={panelSelectionId}
            options={clinicalPatients.map((p) => ({
              id: p.id,
              name: `${p.name} · ${resolveDoctorPatient(p.id)?.patientRef ?? p.id}`,
            }))}
            lockedPatientId={searchPatientId}
            lockedLabel={resolveDoctorPatient(searchPatientId ?? "")?.name}
            onChange={(id) => setPatientId(toEncounterPatientId(id))}
          />
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#1B3B2E]">Suggested panels</h2>
            <p className="mt-0.5 text-xs text-[#8A8F8C]">
              {panelPatient ? `Based on ${panelPatient.condition}` : "Common order sets"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((set) => (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => applyOrderSet(set.codes)}
                  className="rounded-2xl border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-left transition-colors hover:border-[#B8735D]/40 hover:bg-[#FFF8F5]"
                >
                  <p className="text-sm font-semibold text-[#1B3B2E]">{set.label}</p>
                  <p className="text-[11px] text-[#8A8F8C]">{set.hint}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#1B3B2E]">Test catalog</h2>
              <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F8C]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests…"
                  className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FAFAF8] pl-9 pr-3 text-sm outline-none focus:border-[#B8735D]/40"
                />
              </label>
            </div>

            <div className="mt-4 space-y-4">
              {grouped.map(([section, tests]) => (
                <div key={section}>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">
                    {(SECTION_LABEL[section] ?? section).toUpperCase()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tests.map((t) => {
                      const selected = selectedTests.includes(t.code);
                      return (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => toggleTest(t.code)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                            selected
                              ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                              : "border-[#E8E4DF] bg-white text-[#1B3B2E] hover:bg-[#F5F2ED]",
                          )}
                        >
                          <span className="font-bold">{t.code}</span>
                          <span className={cn("ml-1.5", selected ? "text-white/80" : "text-[#8A8F8C]")}>
                            {t.name}
                          </span>
                          {t.fasting ? (
                            <span className={cn("mt-0.5 block text-[10px]", selected ? "text-[#F5E6B8]" : "text-[#B8735D]")}>
                              Fasting
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-[#8A8F8C]">Clinical indication</span>
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-2xl border border-[#E8E4DF] px-4 py-3 text-sm outline-none focus:border-[#B8735D]/40 focus:ring-2 focus:ring-[#B8735D]/15"
                placeholder="Why are you ordering these tests? (e.g. diabetes follow-up, rule out infection)"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                rows={3}
              />
            </label>
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase text-[#8A8F8C]">Priority</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["routine", "urgent", "stat"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-semibold capitalize sm:flex-none",
                      priority === p ? PRIORITY_STYLE[p] : "border-[#E8E4DF] bg-[#FAFAF8] text-[#8A8F8C]",
                      priority === p && p === "stat" && "ring-2 ring-[#C45C4A]/30",
                    )}
                  >
                    {p === "stat" ? "STAT" : p}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-[20px] border border-[#EDEAE6] bg-[#F7FAF6] p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#1B3B2E]">Order summary</h2>
            {patient ? (
              <p className="mt-1 text-sm text-[#8A8F8C]">
                {patient.name} · {getSharedPatient(resolvePatientId(patient.id))?.mrn}
              </p>
            ) : null}

            <ul className="mt-4 space-y-2">
              {selectedDetails.length === 0 ? (
                <li className="text-sm text-[#8A8F8C]">No tests selected</li>
              ) : (
                selectedDetails.map((t) => (
                  <li key={t.code} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1B3B2E]">{t.code}</p>
                      <p className="truncate text-xs text-[#8A8F8C]">{t.name}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[#1B3B2E]">₹{t.price}</span>
                  </li>
                ))
              )}
            </ul>

            {selectedDetails.length > 0 ? (
              <>
                <div className="mt-4 flex items-center justify-between border-t border-[#E8E4DF] pt-3 text-sm font-semibold text-[#1B3B2E]">
                  <span>Estimated total</span>
                  <span className="font-mono">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                </div>
                {maxTat > 0 ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8A8F8C]">
                    <Clock className="h-3.5 w-3.5" />
                    Turnaround up to {maxTat}h
                  </p>
                ) : null}
              </>
            ) : null}

            {fastingRequired ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFFBF0] px-3 py-2.5 text-xs text-[#5C4A1E]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Patient must fast before collection for highlighted tests.
              </div>
            ) : null}

            <button
              type="button"
              disabled={sending || selectedTests.length === 0}
              onClick={handleSubmit}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#1B3B2E] text-sm font-semibold text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Send to lab desk
            </button>
            <p className="mt-3 text-[11px] leading-relaxed text-[#8A8F8C]">
              Order appears in the lab queue. Unpaid charges route to reception billing.
            </p>
          </section>

          {searchPatientId ? (
            <Link
              to="/doctor/reports"
              className="block rounded-[20px] border border-[#EDEAE6] bg-white p-4 text-sm font-semibold text-[#B8735D] hover:bg-[#FAFAF8]"
            >
              View results inbox →
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
