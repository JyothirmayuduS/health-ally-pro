/**
 * Vaccinations — full-page doctor screen (same chrome as Patients):
 * 1. Pick patient (full list)
 * 2. Message listing everything due
 * 3. Give one by one
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Search,
  Syringe,
  User,
} from "lucide-react";
import { PANEL_PATIENTS, type PanelPatient } from "@/lib/doctor-patients-apk-data";
import {
  getSharedPatient,
  resolvePatientId,
  type SharedPatient,
} from "@/lib/shared/patients";
import {
  SCHEDULE_DOSES,
  SITES,
  ageInMonths,
  ageLabelFromMonths,
  classifyDose,
  type DoseStatus,
  type ScheduleDose,
} from "@/lib/immunization/schedule";
import {
  defaultLotFor,
  defaultSiteFor,
  expiresSoon,
  lotsForDose,
} from "@/lib/immunization/stock";
import {
  IMM_STORE_EVENT,
  administerVaccine,
  deferVaccine,
  deferredDoseIds,
  givenDoseIds,
  listImmunizations,
  refuseVaccine,
  refusedDoseIds,
} from "@/lib/immunization/store";
import { cn } from "@/lib/utils";

export type ImmView =
  | "due"
  | "history"
  | "schedule"
  | "administer"
  | "reminders"
  | "aefi"
  | "catchup"
  | "certificate";

type Step = "patient" | "summary" | "give" | "history";

type Props = {
  view?: ImmView;
  initialPatientId?: string;
  doseId?: string;
};

type DoseRow = { dose: ScheduleDose; status: DoseStatus };

function resolvePanelPatient(id?: string): PanelPatient | undefined {
  if (!id) return undefined;
  return (
    PANEL_PATIENTS.find((p) => p.id === id) ||
    PANEL_PATIENTS.find((p) => p.patientRef === id) ||
    PANEL_PATIENTS.find((p) => resolvePatientId(p.id) === resolvePatientId(id))
  );
}

function sharedForPanel(p: PanelPatient): SharedPatient | undefined {
  return getSharedPatient(resolvePatientId(p.id)) ?? getSharedPatient(p.patientRef);
}

function isVisitDose(row: DoseRow, ageMo: number): boolean {
  if (row.dose.program === "travel" || row.dose.program === "risk") return false;
  if (row.status === "due") return true;
  if (row.status !== "overdue") return false;
  return row.dose.ageMonths >= ageMo - 4;
}

function dueRowsFor(patient: SharedPatient): DoseRow[] {
  const ageMo = ageInMonths(patient.dob);
  const given = givenDoseIds(patient.id);
  const deferred = deferredDoseIds(patient.id);
  const refused = refusedDoseIds(patient.id);
  return SCHEDULE_DOSES.map((d) => ({
    dose: d,
    status: classifyDose(
      d,
      ageMo,
      given.has(d.id),
      deferred.has(d.id),
      refused.has(d.id),
      patient.gender,
    ),
  })).filter((row) => isVisitDose(row, ageMo));
}

export function DoctorImmunizationWorkspace({
  view = "due",
  initialPatientId,
  doseId,
}: Props) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [panelId, setPanelId] = useState<string | null>(
    () => resolvePanelPatient(initialPatientId)?.id ?? null,
  );
  const [givingId, setGivingId] = useState<string | null>(doseId || null);
  const [stepOverride, setStepOverride] = useState<Step | null>(null);

  useEffect(() => {
    const resolved = resolvePanelPatient(initialPatientId);
    setPanelId(resolved?.id ?? null);
    setStepOverride(null);
  }, [initialPatientId]);

  useEffect(() => {
    if (doseId) {
      setGivingId(doseId);
      setStepOverride("give");
    }
  }, [doseId]);

  useEffect(() => {
    if (view === "history" && panelId) setStepOverride("history");
  }, [view, panelId]);

  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener(IMM_STORE_EVENT, on);
    return () => window.removeEventListener(IMM_STORE_EVENT, on);
  }, []);

  const panel = panelId ? resolvePanelPatient(panelId) : undefined;
  const patient = panel ? sharedForPanel(panel) : undefined;
  const ageMo = ageInMonths(patient?.dob);

  const dueRows = useMemo(() => {
    if (!patient) return [];
    void tick;
    return dueRowsFor(patient);
  }, [patient, tick]);

  const history = useMemo(
    () =>
      patient
        ? listImmunizations(patient.id).filter(
            (r) => r.status === "administered" || r.status === "historical",
          )
        : [],
    [patient, tick],
  );

  const giving = dueRows.find((r) => r.dose.id === givingId) ?? null;

  const step: Step = (() => {
    if (!panel) return "patient";
    if (stepOverride === "history") return "history";
    if (stepOverride === "give" && giving) return "give";
    return "summary";
  })();

  const subtitle =
    step === "patient"
      ? "Choose a patient to see vaccines due this visit"
      : step === "summary"
        ? `${dueRows.length} due this visit · review then give`
        : step === "give"
          ? `Recording ${giving?.dose.shortName ?? "dose"}`
          : "Administered doses";

  const goPatient = (id: string) => {
    setPanelId(id);
    setGivingId(null);
    setStepOverride("summary");
    setQuery("");
    void navigate({
      to: "/doctor/immunizations",
      search: { patientId: id, view: "due" },
    });
  };

  const clearPatient = () => {
    setPanelId(null);
    setGivingId(null);
    setStepOverride(null);
    void navigate({
      to: "/doctor/immunizations",
      search: { view: "due" },
    });
  };

  const startGiving = (id?: string) => {
    const first = id ?? dueRows[0]?.dose.id ?? null;
    setGivingId(first);
    setStepOverride(first ? "give" : "summary");
    void navigate({
      to: "/doctor/immunizations",
      search: {
        patientId: panelId ?? undefined,
        view: "due",
        doseId: first ?? undefined,
      },
    });
  };

  const backToSummary = () => {
    setGivingId(null);
    setStepOverride("summary");
    void navigate({
      to: "/doctor/immunizations",
      search: { patientId: panelId ?? undefined, view: "due" },
    });
  };

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PANEL_PATIENTS;
    return PANEL_PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientRef.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div
      className="relative mx-auto w-full max-w-[1400px] space-y-4 pb-4 lg:space-y-5 lg:pb-6"
      data-testid="doctor-immunizations"
    >
      {/* Full-page header — same pattern as Patients */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
            Vaccinations
          </h1>
          <p className="mt-0.5 text-sm text-[#8A8F8C]">{subtitle}</p>
        </div>
        {panel ? (
          <nav className="flex gap-2" aria-label="Views">
            <button
              type="button"
              onClick={backToSummary}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                step !== "history"
                  ? "bg-[#1B3B2E] text-white"
                  : "border border-[#E8E4DF] bg-white text-[#5C635F]",
              )}
            >
              Due{dueRows.length > 0 ? ` ${dueRows.length}` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                setStepOverride("history");
                void navigate({
                  to: "/doctor/immunizations",
                  search: { patientId: panel.id, view: "history" },
                });
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                step === "history"
                  ? "bg-[#1B3B2E] text-white"
                  : "border border-[#E8E4DF] bg-white text-[#5C635F]",
              )}
            >
              History
            </button>
          </nav>
        ) : null}
      </header>

      {/* ── STEP 1: Full-page patient list ───────────────────────────── */}
      {step === "patient" ? (
        <PatientStep
          query={query}
          onQuery={setQuery}
          patients={filteredPatients}
          onPick={goPatient}
        />
      ) : null}

      {/* Selected patient — after pick */}
      {panel && step !== "patient" ? (
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F0DDD6] text-sm font-semibold text-[#1B3B2E]">
                {panel.initials}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-[#1B3B2E]">{panel.name}</p>
                <p className="text-sm text-[#8A8F8C]">
                  {patient ? ageLabelFromMonths(ageMo) : `${panel.age}y`} ·{" "}
                  {panel.gender === "M" ? "Male" : "Female"} · {panel.patientRef}
                </p>
                <span className="mt-2 inline-block rounded-full bg-[#E8EFE6] px-2.5 py-0.5 text-xs font-medium text-[#1B3B2E]">
                  {panel.condition}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={clearPatient}
                className="rounded-full border border-[#E8E4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#1B3B2E]"
              >
                Change patient
              </button>
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: panel.id }}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#E8E4DF] bg-white text-[#1B3B2E]"
                aria-label="Open chart"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {panel.allergyWarning ? (
            <div className="mt-3 flex gap-2 rounded-xl border border-[#E9C46A]/40 bg-[#FFFBF0] px-3 py-2 text-xs text-[#92400E]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Known allergy:</span> {panel.allergyWarning}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === "summary" && panel && patient ? (
        <SummaryStep
          patientName={panel.name}
          rows={dueRows}
          onStart={() => startGiving()}
          onGiveOne={(id) => startGiving(id)}
        />
      ) : null}

      {step === "give" && patient && giving ? (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-2">
            <GiveDoseForm
              patient={patient}
              row={giving}
              remaining={dueRows.length}
              onBack={backToSummary}
              onSaved={() => {
                setTick((n) => n + 1);
                toast.success(`${giving.dose.shortName} saved`);
                backToSummary();
              }}
            />
          </div>
          <DoseQueue
            rows={dueRows}
            activeId={giving.dose.id}
            onPick={(id) => startGiving(id)}
          />
        </div>
      ) : null}

      {step === "history" && patient ? <HistoryList records={history} /> : null}
    </div>
  );
}

/* ─── Step 1 — Patients-style full list ──────────────────────────────── */

function PatientStep({
  query,
  onQuery,
  patients,
  onPick,
}: {
  query: string;
  onQuery: (q: string) => void;
  patients: PanelPatient[];
  onPick: (id: string) => void;
}) {
  return (
    <>
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A8F8C]"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search name, condition, or ID"
          autoFocus
          className="h-11 w-full rounded-2xl border border-[#E8E4DF] bg-white pl-10 pr-4 text-sm text-[#1B3B2E] placeholder:text-[#ADADAD] outline-none focus:border-[#B8735D]/40"
        />
      </label>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
          {patients.length} patient{patients.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-[#8A8F8C]">Vaccines due shown per row</p>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-2xl border border-[#EDEAE6] bg-white px-6 py-12 text-center text-sm text-[#8A8F8C]">
          No patients match.
        </div>
      ) : (
        <ul className="space-y-3">
          {patients.map((p) => {
            const shared = sharedForPanel(p);
            const due = shared ? dueRowsFor(shared).length : 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p.id)}
                  className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white p-4 pl-5 text-left shadow-sm transition-colors hover:bg-[#FAF9F7]"
                >
                  <div
                    className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full"
                    style={{ backgroundColor: p.accent }}
                    aria-hidden
                  />
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F0DDD6] text-xs font-semibold text-[#1B3B2E]">
                    {p.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-[#1B3B2E]">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#8A8F8C]">
                          {p.condition} · {p.age}y {p.gender} · {p.patientRef}
                        </span>
                      </span>
                      {due > 0 ? (
                        <span className="shrink-0 rounded-full bg-[#FCE8E6] px-2.5 py-0.5 text-[10px] font-semibold text-[#C45C4A]">
                          {due} due
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[#E8EFE6] px-2.5 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
                          Up to date
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block text-xs text-[#B8735D]">{p.timeline}</span>
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1B3B2E] text-white">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ─── Step 2 ───────────────────────────────────────────────────────────── */

function SummaryStep({
  patientName,
  rows,
  onStart,
  onGiveOne,
}: {
  patientName: string;
  rows: DoseRow[];
  onStart: () => void;
  onGiveOne: (id: string) => void;
}) {
  const overdue = rows.filter((r) => r.status === "overdue").length;
  const names = rows.map((r) => r.dose.shortName);

  if (rows.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-6 py-14 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E8EFE6] text-[#3D6B45]">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-base font-semibold text-[#1B3B2E]">Up to date</p>
          <p className="mt-1 text-sm text-[#8A8F8C]">
            {patientName} has nothing due for this visit.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="rounded-2xl border border-[#EDEAE6] bg-white p-5 shadow-sm sm:p-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FCE8E6] text-[#C45C4A]">
          <Syringe className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h2 className="mt-4 font-serif text-xl font-semibold text-[#1B3B2E] sm:text-2xl">
          {rows.length} vaccine{rows.length === 1 ? "" : "s"} due this visit
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C635F]">
          For <span className="font-semibold text-[#1B3B2E]">{patientName}</span>, these are all due
          today
          {overdue > 0 ? (
            <>
              {" "}
              — including <span className="font-semibold text-[#C45C4A]">{overdue} overdue</span>
            </>
          ) : null}
          : <span className="font-medium text-[#1B3B2E]">{names.join(", ")}</span>.
        </p>
        <p className="mt-2 text-xs text-[#8A8F8C]">
          Give them one at a time. Lot number is required for each.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1B3B2E] px-6 text-sm font-semibold text-white sm:min-w-[240px]"
        >
          Start with {rows[0]!.dose.shortName}
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1B3B2E]">All due</h3>
            <p className="text-xs text-[#8A8F8C]">Or tap any to give now</p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
            {rows.length} doses
          </p>
        </div>
        <ul className="divide-y divide-[#F0EDE8]">
          {rows.map(({ dose, status }, i) => (
            <li
              key={dose.id}
              className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F5F2ED] text-[11px] font-bold text-[#8A8F8C]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1B3B2E] sm:text-base">{dose.shortName}</p>
                <p className="text-xs text-[#8A8F8C]">
                  {dose.vaccine} · {dose.doseLabel} · {dose.route} {dose.doseVolume}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    status === "overdue" ? "text-[#C45C4A]" : "text-[#8A8F8C]",
                  )}
                >
                  {status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGiveOne(dose.id)}
                className="shrink-0 rounded-full bg-[#1B3B2E] px-4 py-2 text-xs font-semibold text-white sm:px-5 sm:text-sm"
              >
                Give
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ─── Step 3 ───────────────────────────────────────────────────────────── */

function DoseQueue({
  rows,
  activeId,
  onPick,
}: {
  rows: DoseRow[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-[#EDEAE6] px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-[#1B3B2E]">This visit</h3>
        <p className="text-xs text-[#8A8F8C]">{rows.length} to give</p>
      </div>
      <ul className="divide-y divide-[#F0EDE8]">
        {rows.map(({ dose, status }, i) => {
          const active = dose.id === activeId;
          return (
            <li key={dose.id}>
              <button
                type="button"
                onClick={() => onPick(dose.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:px-5",
                  active ? "bg-[#E8EFE6]" : "hover:bg-[#FAF9F7]",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    active ? "bg-[#1B3B2E] text-white" : "bg-[#F5F2ED] text-[#8A8F8C]",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#1B3B2E]">
                    {dose.shortName}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] font-semibold uppercase tracking-wide",
                      status === "overdue" ? "text-[#C45C4A]" : "text-[#8A8F8C]",
                    )}
                  >
                    {status}
                  </span>
                </span>
                {active ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase text-[#1B3B2E]">
                    Now
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function GiveDoseForm({
  patient,
  row,
  remaining,
  onBack,
  onSaved,
}: {
  patient: SharedPatient;
  row: DoseRow;
  remaining: number;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { dose, status } = row;
  const ageMo = ageInMonths(patient.dob);
  const lots = useMemo(() => lotsForDose(dose), [dose]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lot, setLot] = useState(() => defaultLotFor(dose)?.lotNumber ?? "");
  const [manualLot, setManualLot] = useState(false);
  const [site, setSite] = useState<string>(() => defaultSiteFor(dose, ageMo));
  const [siteOpen, setSiteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New dose selected → reset to its stock defaults
  useEffect(() => {
    setLot(defaultLotFor(dose)?.lotNumber ?? "");
    setSite(defaultSiteFor(dose, ageMo));
    setManualLot(false);
    setSiteOpen(false);
    setDate(new Date().toISOString().slice(0, 10));
  }, [dose, ageMo]);

  const save = () => {
    if (!lot.trim()) {
      toast.error("Pick a lot");
      return;
    }
    setSaving(true);
    try {
      administerVaccine({
        patientId: patient.id,
        dose,
        administeredAt: date,
        route: dose.route,
        site,
        lotNumber: lot.trim(),
        manufacturer: lots.find((l) => l.lotNumber === lot)?.manufacturer,
        consentObtained: true,
        contraindicationsCleared: true,
        observationMins: 30,
      });
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const siteOptions = Array.from(new Set([defaultSiteFor(dose, ageMo), ...SITES]));

  return (
    <section className="rounded-2xl border border-[#EDEAE6] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#5C635F] hover:text-[#1B3B2E]"
      >
        <ArrowLeft className="h-4 w-4" />
        All due ({remaining})
      </button>

      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E8EFE6]">
          <Syringe className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xl font-semibold text-[#1B3B2E]">{dose.shortName}</p>
          <p className="text-sm text-[#8A8F8C]">
            {dose.vaccine} · {dose.doseLabel} · {dose.route} {dose.doseVolume}
          </p>
          <p
            className={cn(
              "mt-1 text-[10px] font-semibold uppercase tracking-wide",
              status === "overdue" ? "text-[#C45C4A]" : "text-[#8A8F8C]",
            )}
          >
            {status}
          </p>
        </div>
      </div>

      {/* Lot — tap a vial from the fridge, no typing */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#8A8F8C]">Vial in stock</span>
          <button
            type="button"
            onClick={() => {
              setManualLot((v) => !v);
              if (!manualLot) setLot("");
              else setLot(defaultLotFor(dose)?.lotNumber ?? "");
            }}
            className="text-[11px] font-semibold text-[#8A8F8C] underline-offset-2 hover:text-[#1B3B2E] hover:underline"
          >
            {manualLot ? "Pick from stock" : "Type lot"}
          </button>
        </div>

        {manualLot ? (
          <input
            autoFocus
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            placeholder="LOT-…"
            className="mt-2 h-11 w-full rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 text-sm text-[#1B3B2E] outline-none placeholder:text-[#B4B8B4] focus:border-[#1B3B2E]/40"
          />
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {lots.map((l) => {
              const on = l.lotNumber === lot;
              return (
                <button
                  key={l.lotNumber}
                  type="button"
                  onClick={() => setLot(l.lotNumber)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    on
                      ? "border-[#1B3B2E] bg-[#E8EFE6]"
                      : "border-[#EDEAE6] bg-[#FAF9F7] hover:border-[#1B3B2E]/30",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-[#1B3B2E]">
                      {l.lotNumber}
                    </span>
                    {on ? <Check className="h-4 w-4 shrink-0 text-[#1B3B2E]" strokeWidth={2.5} /> : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#8A8F8C]">
                    {l.manufacturer} · {l.dosesLeft} left
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px] font-medium",
                      expiresSoon(l) ? "text-[#C45C4A]" : "text-[#8A8F8C]",
                    )}
                  >
                    Exp {l.expiry}
                    {expiresSoon(l) ? " · use first" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Site — prefilled for age, one tap to change */}
      <div className="mt-4">
        <span className="text-xs font-medium text-[#8A8F8C]">Site</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(siteOpen ? siteOptions : [site]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSite(s);
                setSiteOpen(false);
              }}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                s === site
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                  : "border-[#EDEAE6] bg-[#FAF9F7] text-[#5C635F] hover:border-[#1B3B2E]/30",
              )}
            >
              {s}
            </button>
          ))}
          {!siteOpen ? (
            <button
              type="button"
              onClick={() => setSiteOpen(true)}
              className="text-[11px] font-semibold text-[#8A8F8C] underline-offset-2 hover:text-[#1B3B2E] hover:underline"
            >
              Change
            </button>
          ) : null}
        </div>
      </div>

      {/* Date — today by default */}
      <div className="mt-4">
        <span className="text-xs font-medium text-[#8A8F8C]">Given on</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[
            { label: "Today", value: today },
            { label: "Yesterday", value: yesterday },
          ].map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                date === d.value
                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                  : "border-[#EDEAE6] bg-[#FAF9F7] text-[#5C635F] hover:border-[#1B3B2E]/30",
              )}
            >
              {d.label}
            </button>
          ))}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 text-xs text-[#5C635F] outline-none focus:border-[#1B3B2E]/40"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-[#8A8F8C]">Observe 30 min after · consent assumed for visit</p>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1B3B2E] text-sm font-semibold text-white disabled:opacity-60"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
        Save {dose.shortName}
      </button>

      <div className="mt-3 flex justify-center gap-4 text-xs font-medium text-[#8A8F8C]">
        <button
          type="button"
          onClick={() => {
            deferVaccine({ patientId: patient.id, dose, reason: "Deferred this visit" });
            toast.message(`${dose.shortName} deferred`);
            onBack();
          }}
          className="hover:text-[#1B3B2E]"
        >
          Defer
        </button>
        <button
          type="button"
          onClick={() => {
            refuseVaccine({ patientId: patient.id, dose, reason: "Guardian refused" });
            toast.message(`${dose.shortName} marked refused`);
            onBack();
          }}
          className="hover:text-[#C45C4A]"
        >
          Refusal
        </button>
      </div>
    </section>
  );
}

function HistoryList({
  records,
}: {
  records: ReturnType<typeof listImmunizations>;
}) {
  if (records.length === 0) {
    return (
      <section className="rounded-2xl border border-[#EDEAE6] bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-[#8A8F8C]">No doses recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
      <div className="border-b border-[#EDEAE6] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-[#1B3B2E]">Given</h2>
        <p className="text-xs text-[#8A8F8C]">{records.length} recorded</p>
      </div>
      <ul className="divide-y divide-[#F0EDE8]">
        {records.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8EFE6]">
              <Check className="h-4 w-4 text-[#3D6B45]" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1B3B2E]">{r.shortName}</p>
              <p className="text-xs text-[#8A8F8C]">
                {r.administeredAt.slice(0, 10)}
                {r.lotNumber ? ` · Lot ${r.lotNumber}` : ""}
                {r.site ? ` · ${r.site}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
