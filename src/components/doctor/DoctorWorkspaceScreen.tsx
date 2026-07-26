import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Loader2,
  Pill,
  Scan,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { EmrWorkspace } from "@/components/emr/EmrWorkspace";
import {
  completeDoctorConsultation,
  completeDoctorTask,
  createDoctorReferral,
  createDoctorTask,
  getDoctorConsultation,
  getDoctorWorkspaceBoard,
  orderDoctorLab,
  orderDoctorRadiology,
  orderDoctorRx,
  scheduleDoctorFollowUp,
  startDoctorConsultation,
} from "@/lib/doctor-workspace/client";
import type {
  ConsultationBundle,
  DoctorWorkspaceBoard,
} from "@/lib/doctor-workspace/schemas";
import { saveEmrSoap, addEmrDiagnosis } from "@/lib/emr/client";
import { cn } from "@/lib/utils";

const inputCls =
  "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-[13px] outline-none focus:border-sage focus:ring-1 focus:ring-sage";

type ConsultTab =
  | "timeline"
  | "soap"
  | "rx"
  | "labs"
  | "radiology"
  | "referral"
  | "followup"
  | "tasks";

function patientLabel(row: Record<string, unknown>) {
  const nested = row.patients as Record<string, unknown> | undefined;
  return (
    String(nested?.full_name || row.patient_name || nested?.mrn || row.patient_id || "Patient")
  );
}

function patientIdOf(row: Record<string, unknown>) {
  return String(row.patient_id || "");
}

export function DoctorWorkspaceScreen() {
  const [board, setBoard] = useState<DoctorWorkspaceBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ConsultationBundle | null>(null);
  const [tab, setTab] = useState<ConsultTab>("soap");

  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [dxCode, setDxCode] = useState("");
  const [dxDisplay, setDxDisplay] = useState("");
  const [rx, setRx] = useState({ name: "", dosage: "", frequency: "", duration: "" });
  const [lab, setLab] = useState({ testName: "", priority: "routine" as const });
  const [rad, setRad] = useState({
    studyName: "",
    modality: "xray" as const,
    priority: "routine" as const,
  });
  const [ref, setRef] = useState({ specialty: "", reason: "" });
  const [follow, setFollow] = useState({ when: "", reason: "" });
  const [taskTitle, setTaskTitle] = useState("");

  const reloadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getDoctorWorkspaceBoard();
    if (!res.ok) {
      setError(res.error);
      setBoard(null);
    } else {
      setBoard(res.data);
      if (res.data.activeConsultation?.id && !bundle) {
        // keep local bundle if already loaded
      }
    }
    setLoading(false);
  }, [bundle]);

  useEffect(() => {
    void reloadBoard();
    const t = setInterval(() => void reloadBoard(), 20000);
    return () => clearInterval(t);
  }, [reloadBoard]);

  const selectedPatientId = bundle?.patientId ?? null;
  const consultationId = bundle ? String(bundle.consultation.id) : null;
  const encounterId = bundle?.encounterId ?? null;
  const doctorStaffId = bundle?.consultation.doctor_staff_id
    ? String(bundle.consultation.doctor_staff_id)
    : "";

  const refreshBundle = useCallback(async (id: string) => {
    const res = await getDoctorConsultation(id);
    if (res.ok) setBundle(res.data);
  }, []);

  const waiting = useMemo(
    () =>
      (board?.queue ?? []).filter((q) =>
        ["waiting", "called", "in_progress"].includes(String(q.status)),
      ),
    [board],
  );

  async function beginConsult(row: Record<string, unknown>, from: "queue" | "appointment") {
    setBusy(true);
    const res = await startDoctorConsultation({
      patientId: patientIdOf(row),
      queueEntryId: from === "queue" ? String(row.id) : undefined,
      appointmentId:
        from === "appointment"
          ? String(row.id)
          : row.appointment_id
            ? String(row.appointment_id)
            : undefined,
      chiefComplaint: String(row.reason || row.chief_complaint || ""),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setBundle(res.data);
    setTab("soap");
    toast.success("Consultation started");
    await reloadBoard();
  }

  return (
    <div data-testid="doctor-workspace" className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-gradient-to-br from-white via-white to-sage-soft/40 px-5 py-4">
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-sage">
            Doctor · Workspace
          </p>
          <h1 className="font-heading text-[22px] font-semibold text-ink-900">
            Enterprise consult board
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-ink-500">
            Today’s appointments, live queue, and a single consultation surface for SOAP, orders,
            referrals, follow-ups and tasks — with tenant isolation and audit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Stat label="Today" value={board?.appointments.length ?? 0} />
          <Stat label="Queue" value={waiting.length} tone="sage" />
          <Stat label="Tasks" value={board?.tasks.length ?? 0} />
        </div>
      </header>

      {loading && !board ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading workspace…
        </div>
      ) : error && !board ? (
        <div className="rounded-xl border border-status-noshowBorder bg-status-noshowBg/40 p-6 text-center text-status-noshowText">
          {error}
          <button type="button" className="mt-2 block w-full font-semibold text-sage" onClick={() => void reloadBoard()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left: today + queue + tasks */}
          <aside className="space-y-4">
            <Panel title="Today’s appointments" icon={CalendarDays} count={board?.appointments.length ?? 0}>
              <ul className="divide-y divide-ink-100" data-testid="dw-appointments">
                {(board?.appointments ?? []).length === 0 ? (
                  <li className="px-3 py-6 text-center text-[12.5px] text-ink-400">No appointments today</li>
                ) : null}
                {(board?.appointments ?? []).slice(0, 12).map((a) => (
                  <li key={String(a.id)} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-ink-900">
                        {patientLabel(a)}
                      </div>
                      <div className="font-mono text-[11px] text-ink-400">
                        {String(a.scheduled_at || "").slice(11, 16)} · {String(a.status)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void beginConsult(a, "appointment")}
                      className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Start
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Patient queue" icon={Activity} count={waiting.length}>
              <ul className="divide-y divide-ink-100" data-testid="dw-queue">
                {waiting.length === 0 ? (
                  <li className="px-3 py-6 text-center text-[12.5px] text-ink-400">Queue clear</li>
                ) : null}
                {waiting.slice(0, 12).map((q) => (
                  <li key={String(q.id)} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-ink-900">
                        {patientLabel(q)}
                      </div>
                      <div className="font-mono text-[11px] text-ink-400">{String(q.status)}</div>
                    </div>
                    <button
                      type="button"
                      data-testid="dw-start-from-queue"
                      disabled={busy}
                      onClick={() => void beginConsult(q, "queue")}
                      className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Consult
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Clinical tasks" icon={ClipboardList} count={board?.tasks.length ?? 0}>
              <ul className="divide-y divide-ink-100" data-testid="dw-tasks">
                {(board?.tasks ?? []).length === 0 ? (
                  <li className="px-3 py-6 text-center text-[12.5px] text-ink-400">No open tasks</li>
                ) : null}
                {(board?.tasks ?? []).slice(0, 8).map((t) => (
                  <li key={String(t.id)} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1 truncate text-[12.5px] text-ink-800">
                      {String(t.title)}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void (async () => {
                          const res = await completeDoctorTask(String(t.id));
                          if (!res.ok) toast.error(res.error);
                          else {
                            toast.success("Task done");
                            await reloadBoard();
                          }
                        })()
                      }
                      className="text-sage"
                      aria-label="Complete task"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>

          {/* Right: consultation */}
          <section className="min-w-0 space-y-4">
            {!bundle ? (
              <div className="flex h-[min(60vh,520px)] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-bone/20 text-center">
                <Stethoscope className="h-10 w-10 text-ink-300" />
                <p className="font-heading text-[17px] font-semibold text-ink-700">
                  Select a patient to consult
                </p>
                <p className="max-w-sm text-[13px] text-ink-400">
                  Start from today’s list or the live queue. Opening a consult creates an EMR
                  encounter and keeps orders audited.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 bg-sage px-5 py-3.5 text-white">
                    <UserRound className="h-5 w-5 opacity-80" />
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-[17px] font-semibold">
                        In consultation
                      </div>
                      <div className="font-mono text-[11px] text-white/70">
                        Patient {selectedPatientId?.slice(0, 8)}… · Encounter{" "}
                        {encounterId?.slice(0, 8) || "—"}
                      </div>
                    </div>
                    <Link
                      to="/doctor/emr/$patientId"
                      params={{ patientId: selectedPatientId! }}
                      className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/25"
                    >
                      Full EMR
                    </Link>
                    <button
                      type="button"
                      data-testid="dw-complete-consult"
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          if (!consultationId) return;
                          setBusy(true);
                          const res = await completeDoctorConsultation(consultationId);
                          setBusy(false);
                          if (!res.ok) {
                            toast.error(res.error);
                            return;
                          }
                          toast.success("Consultation completed");
                          setBundle(null);
                          await reloadBoard();
                        })()
                      }
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-sage"
                    >
                      Complete
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-b border-ink-100 px-4 py-2.5">
                    {(
                      [
                        ["soap", "SOAP"],
                        ["timeline", "Timeline"],
                        ["rx", "Rx"],
                        ["labs", "Labs"],
                        ["radiology", "Radiology"],
                        ["referral", "Referral"],
                        ["followup", "Follow-up"],
                        ["tasks", "Tasks"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        data-testid={`dw-tab-${id}`}
                        onClick={() => setTab(id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[11.5px] font-semibold",
                          tab === id ? "bg-sage text-white" : "bg-bone text-ink-600",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 sm:p-5">
                    {tab === "timeline" && selectedPatientId ? (
                      <EmrWorkspace patientId={selectedPatientId} embedded canWrite={false} />
                    ) : null}

                    {tab === "soap" ? (
                      <div className="space-y-3" data-testid="dw-soap">
                        {(
                          [
                            ["subjective", "Subjective"],
                            ["objective", "Objective"],
                            ["assessment", "Assessment"],
                            ["plan", "Plan"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="block space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-400">
                              {label}
                            </span>
                            <textarea
                              className={cn(inputCls, "h-auto py-2")}
                              rows={2}
                              value={soap[key]}
                              onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                            />
                          </label>
                        ))}
                        <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                          <input
                            className={inputCls}
                            placeholder="ICD-10"
                            value={dxCode}
                            onChange={(e) => setDxCode(e.target.value)}
                          />
                          <input
                            className={inputCls}
                            placeholder="Diagnosis"
                            value={dxDisplay}
                            onChange={(e) => setDxDisplay(e.target.value)}
                          />
                          <button
                            type="button"
                            className="h-9 rounded-full border border-ink-200 px-3 text-[12px] font-semibold"
                            onClick={() =>
                              void (async () => {
                                if (!selectedPatientId || !dxCode || !dxDisplay) return;
                                const res = await addEmrDiagnosis(selectedPatientId, {
                                  encounterId,
                                  icd10Code: dxCode,
                                  icd10Display: dxDisplay,
                                });
                                if (!res.ok) toast.error(res.error);
                                else {
                                  toast.success("Diagnosis added");
                                  setDxCode("");
                                  setDxDisplay("");
                                }
                              })()
                            }
                          >
                            Add Dx
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="h-9 rounded-full border border-ink-200 px-4 text-[12.5px] font-semibold"
                            onClick={() =>
                              void (async () => {
                                if (!selectedPatientId) return;
                                const res = await saveEmrSoap(selectedPatientId, {
                                  encounterId: encounterId ?? undefined,
                                  ...soap,
                                  sign: false,
                                });
                                if (!res.ok) toast.error(res.error);
                                else toast.success("SOAP draft saved");
                              })()
                            }
                          >
                            Save draft
                          </button>
                          <button
                            type="button"
                            data-testid="dw-sign-soap"
                            className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white"
                            onClick={() =>
                              void (async () => {
                                if (!selectedPatientId) return;
                                const res = await saveEmrSoap(selectedPatientId, {
                                  encounterId: encounterId ?? undefined,
                                  ...soap,
                                  sign: true,
                                });
                                if (!res.ok) toast.error(res.error);
                                else toast.success("Note signed");
                              })()
                            }
                          >
                            Sign note
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {tab === "rx" ? (
                      <OrderForm
                        testId="dw-rx-form"
                        icon={Pill}
                        title="Prescription"
                        onSubmit={() =>
                          void (async () => {
                            if (!selectedPatientId) return;
                            const res = await orderDoctorRx({
                              patientId: selectedPatientId,
                              consultationId,
                              encounterId,
                              medicationName: rx.name,
                              dosage: rx.dosage,
                              frequency: rx.frequency,
                              duration: rx.duration,
                              allergyChecked: true,
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Rx ordered");
                              setRx({ name: "", dosage: "", frequency: "", duration: "" });
                              if (consultationId) await refreshBundle(consultationId);
                            }
                          })()
                        }
                      >
                        <input className={inputCls} placeholder="Medication" value={rx.name} onChange={(e) => setRx((r) => ({ ...r, name: e.target.value }))} required />
                        <input className={inputCls} placeholder="Dose" value={rx.dosage} onChange={(e) => setRx((r) => ({ ...r, dosage: e.target.value }))} />
                        <input className={inputCls} placeholder="Frequency" value={rx.frequency} onChange={(e) => setRx((r) => ({ ...r, frequency: e.target.value }))} />
                        <input className={inputCls} placeholder="Duration" value={rx.duration} onChange={(e) => setRx((r) => ({ ...r, duration: e.target.value }))} />
                        <OrderList
                          items={(bundle.prescriptions ?? []).map((p) => `${p.medication_name} ${p.dosage || ""}`)}
                        />
                      </OrderForm>
                    ) : null}

                    {tab === "labs" ? (
                      <OrderForm
                        testId="dw-lab-form"
                        icon={FlaskConical}
                        title="Lab order"
                        onSubmit={() =>
                          void (async () => {
                            if (!selectedPatientId) return;
                            const res = await orderDoctorLab({
                              patientId: selectedPatientId,
                              consultationId,
                              encounterId,
                              testName: lab.testName,
                              priority: lab.priority,
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Lab ordered");
                              setLab({ testName: "", priority: "routine" });
                              if (consultationId) await refreshBundle(consultationId);
                            }
                          })()
                        }
                      >
                        <input className={inputCls} placeholder="Test name" value={lab.testName} onChange={(e) => setLab((l) => ({ ...l, testName: e.target.value }))} required />
                        <OrderList items={(bundle.labOrders ?? []).map((o) => String(o.test_name))} />
                      </OrderForm>
                    ) : null}

                    {tab === "radiology" ? (
                      <OrderForm
                        testId="dw-rad-form"
                        icon={Scan}
                        title="Radiology order"
                        onSubmit={() =>
                          void (async () => {
                            if (!selectedPatientId) return;
                            const res = await orderDoctorRadiology({
                              patientId: selectedPatientId,
                              consultationId,
                              encounterId,
                              studyName: rad.studyName,
                              modality: rad.modality,
                              priority: rad.priority,
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Imaging ordered");
                              setRad({ studyName: "", modality: "xray", priority: "routine" });
                              if (consultationId) await refreshBundle(consultationId);
                            }
                          })()
                        }
                      >
                        <input className={inputCls} placeholder="Study" value={rad.studyName} onChange={(e) => setRad((r) => ({ ...r, studyName: e.target.value }))} required />
                        <select className={inputCls} value={rad.modality} onChange={(e) => setRad((r) => ({ ...r, modality: e.target.value as typeof rad.modality }))}>
                          <option value="xray">X-ray</option>
                          <option value="ct">CT</option>
                          <option value="mri">MRI</option>
                          <option value="us">Ultrasound</option>
                          <option value="other">Other</option>
                        </select>
                        <OrderList items={(bundle.radiologyOrders ?? []).map((o) => String(o.study_name))} />
                      </OrderForm>
                    ) : null}

                    {tab === "referral" ? (
                      <OrderForm
                        testId="dw-referral-form"
                        icon={Send}
                        title="Referral"
                        onSubmit={() =>
                          void (async () => {
                            if (!selectedPatientId) return;
                            const res = await createDoctorReferral({
                              patientId: selectedPatientId,
                              consultationId,
                              encounterId,
                              toSpecialty: ref.specialty,
                              reason: ref.reason,
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Referral created");
                              setRef({ specialty: "", reason: "" });
                              if (consultationId) await refreshBundle(consultationId);
                            }
                          })()
                        }
                      >
                        <input className={inputCls} placeholder="Specialty" value={ref.specialty} onChange={(e) => setRef((r) => ({ ...r, specialty: e.target.value }))} required />
                        <input className={inputCls} placeholder="Reason" value={ref.reason} onChange={(e) => setRef((r) => ({ ...r, reason: e.target.value }))} required />
                        <OrderList items={(bundle.referrals ?? []).map((o) => `${o.to_specialty}: ${o.reason}`)} />
                      </OrderForm>
                    ) : null}

                    {tab === "followup" ? (
                      <OrderForm
                        testId="dw-followup-form"
                        icon={CalendarDays}
                        title="Schedule follow-up"
                        onSubmit={() =>
                          void (async () => {
                            if (!selectedPatientId || !follow.when) return;
                            const res = await scheduleDoctorFollowUp({
                              patientId: selectedPatientId,
                              doctorId: doctorStaffId || selectedPatientId,
                              scheduledAt: new Date(follow.when).toISOString(),
                              reason: follow.reason || "Follow-up",
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Follow-up booked");
                              setFollow({ when: "", reason: "" });
                              await reloadBoard();
                            }
                          })()
                        }
                      >
                        <input className={inputCls} type="datetime-local" value={follow.when} onChange={(e) => setFollow((f) => ({ ...f, when: e.target.value }))} required />
                        <input className={inputCls} placeholder="Reason" value={follow.reason} onChange={(e) => setFollow((f) => ({ ...f, reason: e.target.value }))} />
                      </OrderForm>
                    ) : null}

                    {tab === "tasks" ? (
                      <OrderForm
                        testId="dw-task-form"
                        icon={ClipboardList}
                        title="Add clinical task"
                        onSubmit={() =>
                          void (async () => {
                            const res = await createDoctorTask({
                              patientId: selectedPatientId,
                              consultationId,
                              encounterId,
                              title: taskTitle,
                              taskType: "general",
                            });
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("Task created");
                              setTaskTitle("");
                              if (consultationId) await refreshBundle(consultationId);
                              await reloadBoard();
                            }
                          })()
                        }
                      >
                        <input className={inputCls} placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                        <OrderList items={(bundle.tasks ?? []).map((t) => String(t.title))} />
                      </OrderForm>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "sage";
}) {
  return (
    <div
      className={cn(
        "min-w-[72px] rounded-xl border px-3 py-2 text-center",
        tone === "sage" ? "border-sage/20 bg-sage-soft/50" : "border-ink-200 bg-white",
      )}
    >
      <div className={cn("font-heading text-[18px] font-semibold tabular-nums", tone === "sage" && "text-sage")}>
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof CalendarDays;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
        <Icon className="h-4 w-4 text-sage" />
        <span className="text-[13px] font-semibold text-ink-900">{title}</span>
        <span className="ml-auto rounded-full bg-bone px-2 py-0.5 text-[10px] font-mono text-ink-500">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function OrderForm({
  title,
  icon: Icon,
  onSubmit,
  children,
  testId,
}: {
  title: string;
  icon: typeof Pill;
  onSubmit: () => void;
  children: ReactNode;
  testId: string;
}) {
  return (
    <form
      data-testid={testId}
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-800">
        <Icon className="h-4 w-4 text-sage" /> {title}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
      <button type="submit" className="h-9 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white">
        Submit
      </button>
    </form>
  );
}

function OrderList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="col-span-full divide-y divide-ink-100 rounded-lg border border-ink-100">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="px-3 py-2 text-[12.5px] text-ink-700">
          {item}
        </li>
      ))}
    </ul>
  );
}
