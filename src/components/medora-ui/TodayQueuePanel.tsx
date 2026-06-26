import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { getDoctorPatient } from "@/lib/doctor-mock-data";
import type { QueueItem } from "@/lib/doctor-mock-data";

type Props = {
  queue: QueueItem[];
};

const statusLabel: Record<QueueItem["status"], string> = {
  waiting: "Waiting",
  "in-consultation": "In consult",
  completed: "Done",
};

const statusColor: Record<QueueItem["status"], string> = {
  waiting: "bg-[#FFF4D6] text-[#92680A]",
  "in-consultation": "bg-[#D4F064] text-[#1C2A2E]",
  completed: "bg-[#E8ECED] text-[#64748B]",
};

export function TodayQueuePanel({ queue }: Props) {
  const active = queue.filter((q) => q.status !== "completed").slice(0, 5);

  return (
    <SectionCard
      variant="white"
      title="Today's Queue"
      subtitle="Patients checked in and waiting for consultation"
      className="min-h-[420px]"
    >
      {active.length === 0 ? (
        <p className="text-sm font-medium text-[#64748B]">No patients in queue right now.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {active.map((item) => {
            const patient = getDoctorPatient(item.patientId);
            if (!patient) return null;
            return (
              <li key={item.id}>
                <Link
                  to="/doctor/queue"
                  className="group flex items-center gap-3 rounded-[18px] border border-[#EEF6D4] bg-[#FAFCF5] p-3 transition-all hover:border-[#D4F064]/50 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1C2A2E] text-xs font-bold text-white">
                    {item.tokenNumber}
                  </span>
                  <img
                    src={patient.photoUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1C2A2E]">{patient.name}</p>
                    <p className="truncate text-xs text-[#64748B]">{patient.condition}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor[item.status]}`}
                  >
                    {statusLabel[item.status]}
                  </span>
                  {item.status === "waiting" && (
                    <span className="hidden items-center gap-1 text-xs text-[#94A3B8] sm:flex">
                      <Clock className="h-3 w-3" />
                      {item.waitMinutes}m
                    </span>
                  )}
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#CBD5E1] group-hover:text-[#1C2A2E]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
