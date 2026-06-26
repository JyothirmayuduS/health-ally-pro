import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileText,
  Save,
  Stethoscope,
} from "lucide-react";
import { DoctorClinicalPageHeader } from "@/components/doctor/clinical/DoctorClinicalPageHeader";
import { DoctorClinicalPatientCard } from "@/components/doctor/clinical/DoctorClinicalPatientCard";
import { DoctorLockedPatientSelect } from "@/components/doctor/DoctorLockedPatientSelect";
import { apkDoctor } from "@/lib/doctor-apk-data";
import { NOTE_TEMPLATES } from "@/lib/clinical/note-templates";
import {
  listClinicalPatients,
  resolveDoctorPatient,
  toEncounterPatientId,
} from "@/lib/doctor-patient-context";
import { getPatientTherapy } from "@/lib/doctor-patients-apk-data";
import { useDoctorStore } from "@/lib/doctor-store";
import {
  ENCOUNTERS_EVENT,
  findOpenEncounterForPatient,
  listEncounters,
  openEncounter as createOpenEncounter,
  saveEncounterSoap,
  type Encounter,
} from "@/lib/shared/encounters";
import { listVitalsForPatient, formatVitalsRecordedAt } from "@/lib/shared/vitals-store";
import { mrnFromDoctorPatientId } from "@/lib/shared/clinic-queue";

type NoteForm = {
  complaint: string;
  objective: string;
  assessment: string;
  plan: string;
};

const EMPTY_FORM: NoteForm = { complaint: "", objective: "", assessment: "", plan: "" };

const inputClass =
  "w-full rounded-2xl border border-[#E8E4DF] bg-white px-4 py-3 text-sm leading-relaxed text-[#1B3B2E] placeholder:text-[#ADADAD] focus:border-[#B8735D] focus:outline-none focus:ring-2 focus:ring-[#B8735D]/20";

type Props = {
  searchPatientId?: string;
};

export function DoctorNoteWorkspace({ searchPatientId }: Props) {
  const { queue } = useDoctorStore();
  const inConsult = queue.find((q) => q.status === "in-consultation");
  const clinicalPatients = listClinicalPatients();

  const initialId = searchPatientId
    ? toEncounterPatientId(searchPatientId)
    : inConsult?.patientId ?? clinicalPatients[0]?.encounterId ?? "";

  const [patientId, setPatientId] = useState(initialId);
  const [form, setForm] = useState<NoteForm>(EMPTY_FORM);
  const [encounters, setEncounters] = useState<Encounter[]>(() => listEncounters());
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const panelId =
    searchPatientId ??
    clinicalPatients.find((p) => p.encounterId === patientId)?.id ??
    "";

  useEffect(() => {
    const refresh = () => setEncounters(listEncounters());
    window.addEventListener(ENCOUNTERS_EVENT, refresh);
    return () => window.removeEventListener(ENCOUNTERS_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (searchPatientId) setPatientId(toEncounterPatientId(searchPatientId));
    else if (inConsult) setPatientId(inConsult.patientId);
  }, [searchPatientId, inConsult]);

  const mrn = mrnFromDoctorPatientId(patientId);
  const activeEncounter = useMemo(() => {
    const fromList = encounters.find(
      (e) => (e.patientId === mrn || e.patientId === patientId) && e.status === "open",
    );
    if (fromList) return fromList;
    return findOpenEncounterForPatient(patientId);
  }, [encounters, mrn, patientId]);

  useEffect(() => {
    if (activeEncounter) {
      setForm({
        complaint: activeEncounter.soap?.complaint ?? activeEncounter.chiefComplaint ?? "",
        objective: activeEncounter.soap?.objective ?? "",
        assessment: activeEncounter.soap?.assessment ?? "",
        plan: activeEncounter.soap?.plan ?? "",
      });
    }
  }, [activeEncounter?.id]);

  const therapy = panelId ? getPatientTherapy(panelId) : undefined;
  const latestVitals = panelId ? listVitalsForPatient(panelId)[0] : undefined;
  const recentEncounters = useMemo(
    () =>
      encounters
        .filter((e) => e.patientId === mrn || e.patientId === patientId)
        .slice(0, 3),
    [encounters, mrn, patientId],
  );

  const ensureEncounter = (): Encounter | null => {
    if (activeEncounter) return activeEncounter;
    if (!searchPatientId && !patientId) return null;
    const panel = resolveDoctorPatient(panelId || searchPatientId || "");
    const created = createOpenEncounter({
      patientId,
      doctorName: apkDoctor.name,
      chiefComplaint: panel?.alert ?? panel?.condition,
    });
    setEncounters(listEncounters());
    toast.message("Visit opened", { description: created.id });
    return created;
  };

  const saveDraft = () => {
    const enc = ensureEncounter();
    if (!enc) {
      toast.error("Select a patient first");
      return;
    }
    saveEncounterSoap(enc.id, form);
    setDraftSavedAt(new Date().toISOString());
    setEncounters(listEncounters());
    toast.success("Draft saved");
  };

  const signEncounter = () => {
    const enc = ensureEncounter();
    if (!enc) {
      toast.error("Select a patient first");
      return;
    }
    if (!form.complaint.trim() && !form.assessment.trim()) {
      toast.error("Add at least chief complaint or assessment before signing");
      return;
    }
    saveEncounterSoap(
      enc.id,
      { ...form, signedAt: new Date().toISOString() },
      true,
    );
    toast.success(`Encounter ${enc.id} signed and closed`);
    setEncounters(listEncounters());
    setDraftSavedAt(null);
  };

  const applyTemplate = (id: string) => {
    const t = NOTE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setForm({
      complaint: t.complaint,
      objective: t.objective,
      assessment: t.assessment,
      plan: t.plan,
    });
    toast.message(`Template: ${t.label}`);
  };

  const insertVitals = () => {
    if (!latestVitals) {
      toast.message("No vitals on file", { description: "Record vitals first" });
      return;
    }
    const line = [
      latestVitals.bp && `BP ${latestVitals.bp}`,
      latestVitals.hr && `HR ${latestVitals.hr} bpm`,
      latestVitals.temp,
      latestVitals.weight && `Weight ${latestVitals.weight} kg`,
      `(${formatVitalsRecordedAt(latestVitals.recordedAt)})`,
    ]
      .filter(Boolean)
      .join(" · ");
    setForm((f) => ({
      ...f,
      objective: f.objective ? `${f.objective}\n${line}` : line,
    }));
  };

  const bannerPatientId = searchPatientId ?? panelId;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-24 lg:pb-8">
      <DoctorClinicalPageHeader
        eyebrow="DOCUMENTATION · SOAP"
        title="Clinical note"
        description="Document the visit in SOAP format. Drafts autosave to the open encounter — sign when the consult is complete."
        icon={Stethoscope}
        steps={["Chief complaint", "Objective findings", "Assessment", "Plan"]}
      />

      {bannerPatientId ? (
        <DoctorClinicalPatientCard patientId={bannerPatientId} />
      ) : (
        <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4">
          <DoctorLockedPatientSelect
            label="Patient"
            className="lg:col-span-2"
            value={patientId}
            options={clinicalPatients.map((p) => ({
              id: p.encounterId,
              name: p.name,
            }))}
            lockedPatientId={searchPatientId}
            lockedLabel={resolveDoctorPatient(searchPatientId ?? "")?.name}
            onChange={setPatientId}
          />
        </section>
      )}

      {activeEncounter ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E8EFE6] bg-[#F7FAF6] px-4 py-3 text-sm text-[#1B3B2E]">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#2C7873]" />
            Open encounter
          </span>
          <span className="font-mono text-xs text-[#8A8F8C]">{activeEncounter.id}</span>
          {draftSavedAt ? (
            <span className="text-xs text-[#8A8F8C]">
              · Draft saved {new Date(draftSavedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E8E4DF] bg-white px-4 py-3 text-sm text-[#8A8F8C]">
          No open encounter — saving will open a visit for this patient.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#B8735D]">QUICK START</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {NOTE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="rounded-full border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-1.5 text-xs font-semibold text-[#1B3B2E] hover:border-[#B8735D]/40"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <form className="space-y-4 rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5" onSubmit={(e) => e.preventDefault()}>
            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-[#8A8F8C]">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-[#F0DDD6] text-[10px] font-bold text-[#B8735D]">S</span>
                Subjective · Chief complaint
              </span>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Patient's story in their words — onset, duration, severity, relieving factors"
                value={form.complaint}
                onChange={(e) => setForm({ ...form, complaint: e.target.value })}
              />
            </label>

            <label>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-[#8A8F8C]">
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-[#E8EFE6] text-[10px] font-bold text-[#1B3B2E]">O</span>
                  Objective · Exam &amp; vitals
                </span>
                <button
                  type="button"
                  onClick={insertVitals}
                  className="text-xs font-semibold text-[#B8735D]"
                >
                  Insert latest vitals
                </button>
              </div>
              <textarea
                className={inputClass}
                rows={4}
                placeholder="Physical exam, vitals, labs reviewed, imaging findings"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-[#8A8F8C]">
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-[#F5E6B8] text-[10px] font-bold text-[#5C4A1E]">A</span>
                  Assessment
                </span>
                <textarea
                  className={inputClass}
                  rows={5}
                  placeholder="Diagnosis, differential, clinical reasoning"
                  value={form.assessment}
                  onChange={(e) => setForm({ ...form, assessment: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-[#8A8F8C]">
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-[#1B3B2E] text-[10px] font-bold text-white">P</span>
                  Plan
                </span>
                <textarea
                  className={inputClass}
                  rows={5}
                  placeholder="Medications, labs, referrals, patient instructions, follow-up"
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                />
              </label>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {therapy ? (
            <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4">
              <h3 className="text-xs font-semibold uppercase text-[#8A8F8C]">Active therapy</h3>
              <ul className="mt-2 space-y-1 text-sm text-[#1B3B2E]">
                {therapy.lines.slice(0, 3).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {therapy?.problems.length ? (
            <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4">
              <h3 className="text-xs font-semibold uppercase text-[#8A8F8C]">Problem list</h3>
              <ul className="mt-2 space-y-1 text-sm text-[#1B3B2E]">
                {therapy.problems.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {recentEncounters.length > 0 ? (
            <section className="rounded-[20px] border border-[#EDEAE6] bg-[#FAFAF8] p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[#8A8F8C]">
                <FileText className="h-3.5 w-3.5" />
                Recent notes
              </h3>
              <ul className="mt-2 space-y-2">
                {recentEncounters.map((e) => (
                  <li key={e.id} className="text-xs">
                    <p className="font-mono font-semibold text-[#1B3B2E]">{e.id}</p>
                    <p className="text-[#8A8F8C]">
                      {e.status === "closed" ? "Signed" : "Open"} · {e.date}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {panelId ? (
            <Link
              to="/doctor/prescriptions"
              search={{ patientId: panelId, view: "write" }}
              className="block rounded-[20px] border border-[#EDEAE6] bg-white p-4 text-sm font-semibold text-[#B8735D] hover:bg-[#FAFAF8]"
            >
              Write prescription →
            </Link>
          ) : null}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[var(--doctor-tab-offset,4.5rem)] z-30 border-t border-[#EDEAE6] bg-white/95 px-4 py-3 backdrop-blur-md lg:static lg:mt-2 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-[#E8E4DF] bg-white text-sm font-semibold text-[#1B3B2E]"
          >
            <Save className="h-4 w-4" />
            Save draft
          </button>
          <button
            type="button"
            onClick={signEncounter}
            className="inline-flex min-h-[48px] flex-[1.2] items-center justify-center gap-2 rounded-full bg-[#1B3B2E] text-sm font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sign &amp; complete
          </button>
        </div>
      </div>
    </div>
  );
}
