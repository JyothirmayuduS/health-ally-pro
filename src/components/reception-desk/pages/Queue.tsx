import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { toast } from "sonner";
import StatusPill from "@/components/reception-desk/StatusPill";
import {
  PhoneCall,
  SkipForward,
  Check,
  XCircle,
  ArrowRightLeft,
  Stethoscope,
  Clock,
  MonitorPlay,
} from "lucide-react";

const mins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const nowMins = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export default function Queue() {
  const {
    appointments,
    patients,
    doctors,
    updateAppointmentStatus,
    transferAppointment,
  } = useStore();
  const [transferFor, setTransferFor] = useState(null);

  const queuesByDoctor = useMemo(() => {
    return doctors
      .filter((d) => d.onDuty)
      .map((d) => {
        const docApts = appointments
          .filter(
            (a) =>
              a.date === TODAY_STR &&
              a.doctorId === d.id &&
              (a.status === "checked-in" || a.status === "in-progress"),
          )
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
        const current = docApts.find((a) => a.status === "in-progress");
        const waiting = docApts.filter((a) => a.status === "checked-in");
        return { doctor: d, current, waiting };
      });
  }, [doctors, appointments]);

  const callNext = (doctorId) => {
    const q = queuesByDoctor.find((x) => x.doctor.id === doctorId);
    if (!q) return;
    if (q.current) {
      updateAppointmentStatus(q.current.id, "completed");
    }
    const next = q.waiting[0];
    if (next) {
      updateAppointmentStatus(next.id, "in-progress");
      const p = patients.find((x) => x.id === next.patientId);
      toast.success(`Token #${next.tokenNumber} called`, {
        description: `${p?.name} → ${q.doctor.name}`,
      });
    } else if (q.current) {
      toast.success("Last patient marked complete");
    }
  };

  const recall = (apt) => {
    toast(`Re-calling #${apt.tokenNumber}`);
  };

  return (
    <div data-testid="queue-page" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-ink-200 rounded-sm">
        <div>
          <h1 className="text-[16px] font-heading font-semibold text-ink-900">Clinic Queue Management</h1>
          <p className="text-[12px] text-ink-400">Call, skip, or transfer checked-in patients to active doctors.</p>
        </div>
        <button
          onClick={() => window.open("/reception/token-board", "_blank")}
          className="btn-outline flex items-center gap-2 h-9 shrink-0 self-start sm:self-auto"
        >
          <MonitorPlay className="w-4 h-4" /> Open Waiting Board (TV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {queuesByDoctor.map(({ doctor, current, waiting }) => {
          const currentPatient = current
            ? patients.find((p) => p.id === current.patientId)
            : null;
          return (
            <section
              key={doctor.id}
              data-testid={`queue-card-${doctor.id}`}
              className="surface"
            >
              {/* Header */}
              <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-sage-soft text-sage grid place-items-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-ink-900 truncate">
                    {doctor.name}
                  </div>
                  <div className="text-[11px] text-ink-400 font-mono">
                    {doctor.specialty} · Room {doctor.room} · {doctor.shift}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                    Waiting
                  </div>
                  <div className="text-[22px] font-heading font-semibold text-ink-900 tabular-nums leading-none">
                    {waiting.length}
                  </div>
                </div>
              </div>

              {/* Current */}
              <div className="px-5 py-4 border-b border-ink-200 bg-bone">
                {current ? (
                  <div className="flex items-center gap-4">
                    <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                      Now
                    </div>
                    <div className="text-[40px] leading-none font-heading font-semibold text-sage tabular-nums">
                      #{current.tokenNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-ink-900 truncate">
                        {currentPatient?.name}
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {currentPatient?.id} · {current.type}
                      </div>
                    </div>
                    <StatusPill status="in-progress" />
                  </div>
                ) : (
                  <div className="text-[13px] text-ink-400 italic">No patient in consultation.</div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-b border-ink-200 flex gap-2 flex-wrap">
                <button
                  data-testid={`queue-callnext-${doctor.id}`}
                  onClick={() => callNext(doctor.id)}
                  disabled={waiting.length === 0 && !current}
                  className="btn-primary"
                >
                  <PhoneCall className="w-4 h-4" /> Call next
                </button>
                {current && (
                  <button
                    data-testid={`queue-complete-${doctor.id}`}
                    onClick={() => updateAppointmentStatus(current.id, "completed")}
                    className="btn-outline"
                  >
                    <Check className="w-4 h-4 text-status-doneText" /> Mark complete
                  </button>
                )}
                {current && (
                  <button
                    data-testid={`queue-skip-${doctor.id}`}
                    onClick={() => updateAppointmentStatus(current.id, "checked-in")}
                    className="btn-ghost"
                  >
                    <SkipForward className="w-4 h-4" /> Skip
                  </button>
                )}
              </div>

              {/* Waiting list */}
              <ul className="divide-y divide-ink-200 max-h-72 overflow-y-auto">
                {waiting.map((a, idx) => {
                  const p = patients.find((x) => x.id === a.patientId);
                  const wait = Math.max(0, nowMins() - mins(a.time));
                  return (
                    <li
                      key={a.id}
                      data-testid={`queue-waiting-${a.id}`}
                      className="px-5 py-2.5 flex items-center gap-3"
                    >
                      <div className="font-mono text-[16px] font-semibold text-ink-900 tabular-nums w-12">
                        #{a.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink-900 truncate">
                          {p?.name}
                        </div>
                        <div className="text-[11px] text-ink-400 font-mono">
                          {a.time} · {a.type}
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded-sm border ${
                          wait > 30
                            ? "border-status-noshowBorder bg-status-noshowBg/50 text-status-noshowText"
                            : "border-ink-200 bg-white text-ink-600"
                        }`}
                      >
                        <Clock className="w-3 h-3" /> {wait}m
                      </div>
                      <button
                        data-testid={`queue-recall-${a.id}`}
                        onClick={() => recall(a)}
                        className="h-7 px-2 text-[11.5px] text-ink-600 hover:text-ink-900 hover:bg-bone rounded-sm font-medium"
                      >
                        Re-call
                      </button>
                      <button
                        data-testid={`queue-transfer-${a.id}`}
                        onClick={() => setTransferFor(a)}
                        className="h-7 w-7 inline-flex items-center justify-center text-ink-600 hover:text-ink-900 hover:bg-bone rounded-sm"
                        title="Transfer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`queue-noshow-${a.id}`}
                        onClick={() => updateAppointmentStatus(a.id, "no-show")}
                        className="h-7 w-7 inline-flex items-center justify-center text-ink-600 hover:text-status-noshowText rounded-sm"
                        title="No-show"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
                {waiting.length === 0 && (
                  <li className="px-5 py-8 text-center text-[12.5px] text-ink-400">
                    No one waiting.
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Transfer dialog */}
      {transferFor && (
        <div
          data-testid="transfer-modal"
          className="fixed inset-0 z-30 bg-black/30 grid place-items-center p-4"
          onClick={() => setTransferFor(null)}
        >
          <div
            className="bg-white border border-ink-200 rounded-sm w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-ink-200 text-[14px] font-medium text-ink-900">
              Transfer token #{transferFor.tokenNumber}
            </div>
            <ul className="divide-y divide-ink-200 max-h-64 overflow-y-auto">
              {doctors
                .filter((d) => d.id !== transferFor.doctorId && d.onDuty)
                .map((d) => (
                  <li key={d.id}>
                    <button
                      data-testid={`transfer-to-${d.id}`}
                      onClick={() => {
                        transferAppointment(transferFor.id, d.id);
                        toast.success(`Transferred to ${d.name}`);
                        setTransferFor(null);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-bone flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-sm bg-sage-soft text-sage grid place-items-center">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-ink-900">{d.name}</div>
                        <div className="text-[11px] text-ink-400">
                          {d.specialty} · Room {d.room}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
            <div className="px-5 py-3 border-t border-ink-200 flex justify-end">
              <button
                onClick={() => setTransferFor(null)}
                className="h-8 px-3 text-[12.5px] text-ink-600 hover:bg-bone rounded-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
