import React, { useMemo } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import {
  Stethoscope,
  Coffee,
  CircleDot,
  Clock,
  MapPin,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const STATUS = {
  consulting: {
    chip: "chip-teal",
    dot: "bg-teal animate-pulse-dot",
    text: "In consult",
    bar: "bg-teal",
  },
  waiting: {
    chip: "chip-mustard",
    dot: "bg-mustard",
    text: "Patients waiting",
    bar: "bg-mustard",
  },
  available: {
    chip: "chip-money",
    dot: "bg-money",
    text: "Available",
    bar: "bg-money",
  },
  break: {
    chip: "chip-plum",
    dot: "bg-plum",
    text: "On break",
    bar: "bg-plum",
  },
  off: {
    chip: "chip-ink",
    dot: "bg-ink-400",
    text: "Off duty",
    bar: "bg-ink-400",
  },
};

export default function DoctorBoard() {
  const { doctors, appointments, patients } = useStore();
  const today = appointments.filter((a) => a.date === TODAY_STR);

  const board = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id);
        const current = docToday.find((a) => a.status === "in-progress");
        const waiting = docToday.filter((a) => a.status === "checked-in");
        const completed = docToday.filter((a) => a.status === "completed").length;
        const total = docToday.length;
        const cap = 12;
        const util = Math.min(100, Math.round((total / cap) * 100));
        const status = !d.onDuty
          ? "off"
          : current
            ? "consulting"
            : waiting.length > 0
              ? "waiting"
              : "available";
        return {
          doctor: d,
          current,
          waiting,
          completed,
          total,
          util,
          status,
        };
      }),
    [doctors, today],
  );

  const counts = {
    consulting: board.filter((b) => b.status === "consulting").length,
    waiting: board.filter((b) => b.status === "waiting").length,
    available: board.filter((b) => b.status === "available").length,
    off: board.filter((b) => b.status === "off").length,
  };

  return (
    <div data-testid="board-page" className="space-y-5">
      {/* Hero summary strip */}
      <div className="module-hero bg-teal-soft border-teal/30">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal text-white grid place-items-center">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-[11px] uppercase tracking-[0.14em] font-mono font-medium text-teal">
              Right now
            </div>
            <div className="text-[15px] font-heading font-semibold text-ink-900">
              {counts.consulting} doctor{counts.consulting === 1 ? "" : "s"} consulting · {counts.waiting} have a queue · {counts.available} free
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="chip-teal"><span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-dot" /> {counts.consulting} live</span>
            <span className="chip-mustard"><span className="w-1.5 h-1.5 rounded-full bg-mustard" /> {counts.waiting} queue</span>
            <span className="chip-money"><span className="w-1.5 h-1.5 rounded-full bg-money" /> {counts.available} free</span>
            <span className="chip-ink"><span className="w-1.5 h-1.5 rounded-full bg-ink-400" /> {counts.off} off</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {board.map(({ doctor, current, waiting, completed, total, util, status }) => {
          const cur = current && patients.find((p) => p.id === current.patientId);
          const next = waiting[0];
          const nextP = next && patients.find((p) => p.id === next.patientId);
          const meta = STATUS[status];
          return (
            <div
              key={doctor.id}
              data-testid={`board-card-${doctor.id}`}
              className="surface overflow-hidden"
            >
              <div className={`h-1 ${meta.bar}`} />
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-sage-soft text-sage grid place-items-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-heading font-semibold text-ink-900 truncate">
                        {doctor.name}
                      </div>
                    </div>
                    <div className="text-[11.5px] text-ink-400 mt-0.5 inline-flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Room {doctor.room} · {doctor.specialty}
                    </div>
                  </div>
                  <span className={meta.chip}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.text}
                  </span>
                </div>

                {current ? (
                  <div className="mt-4 rounded-lg border border-teal/30 bg-teal-soft/50 px-3 py-3 flex items-center gap-3">
                    <CircleDot className="w-4 h-4 text-teal animate-pulse-dot" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-teal font-mono">
                        Now
                      </div>
                      <div className="text-[13.5px] font-medium text-ink-900 truncate">
                        #{current.tokenNumber} · {cur?.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-ink-200 px-3 py-3 text-[12px] text-ink-400">
                    {doctor.onDuty ? "Not in consultation yet." : "Off duty today."}
                  </div>
                )}

                {next && (
                  <div className="mt-2 px-3 py-2 text-[12.5px] flex items-center gap-2">
                    <span className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                      Next
                    </span>
                    <span className="font-mono text-ink-900">#{next.tokenNumber}</span>
                    <span className="text-ink-600 truncate">{nextP?.name}</span>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-bone border border-ink-200 py-1.5">
                    <div className="text-[16px] font-heading font-semibold text-mustard tabular-nums">
                      {waiting.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                      Waiting
                    </div>
                  </div>
                  <div className="rounded-md bg-bone border border-ink-200 py-1.5">
                    <div className="text-[16px] font-heading font-semibold text-money tabular-nums">
                      {completed}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                      Done
                    </div>
                  </div>
                  <div className="rounded-md bg-bone border border-ink-200 py-1.5">
                    <div className="text-[16px] font-heading font-semibold text-ink-900 tabular-nums">
                      {util}%
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                      Used
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bone rounded-full overflow-hidden border border-ink-200">
                    <div className={`h-full ${meta.bar}`} style={{ width: `${util}%` }} />
                  </div>
                  <span className="text-[10.5px] text-ink-400 font-mono inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {doctor.shift}
                  </span>
                </div>

                <Link
                  to="/reception/queue"
                  data-testid={`board-open-queue-${doctor.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-[12px] text-sage hover:text-sage-hover font-medium"
                >
                  Open queue <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
