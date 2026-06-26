import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { DoctorPanel } from "@/components/doctor/ui/DoctorPanel";
import { getDoctorPatient } from "@/lib/doctor-mock-data";
import type { QueueItem } from "@/lib/doctor-mock-data";

const statusLabel: Record<QueueItem["status"], string> = {
  waiting: "Waiting",
  "in-consultation": "In consult",
  completed: "Done",
};

export function DoctorQueuePanel({ queue }: { queue: QueueItem[] }) {
  const active = queue.filter((q) => q.status !== "completed").slice(0, 5);

  return (
    <DoctorPanel
      variant="white"
      title="Today's Queue"
      subtitle="Patients checked in and waiting"
      showArrow={false}
    >
      {active.length === 0 ? (
        <p className="text-sm text-[#8A8F8C]">No patients in queue.</p>
      ) : (
        <ul className="space-y-2.5">
          {active.map((item) => {
            const patient = getDoctorPatient(item.patientId);
            if (!patient) return null;
            return (
              <li key={item.id}>
                <Link
                  to="/doctor/queue"
                  className="group flex items-center gap-3 rounded-[18px] border border-[#F5F2ED] bg-[#FFFFFF] p-3 hover:border-[#B8735D]/50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B3B2E] text-xs font-bold text-[#F0DDD6]">
                    {item.tokenNumber}
                  </span>
                  <img src={patient.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{patient.name}</p>
                    <p className="truncate text-xs text-[#8A8F8C]">{patient.condition}</p>
                  </div>
                  <span className="rounded-full bg-[#F5F2ED] px-2.5 py-1 text-[10px] font-bold text-[#1B3B2E]">
                    {statusLabel[item.status]}
                  </span>
                  {item.waitMinutes > 0 && (
                    <span className="hidden items-center gap-1 text-xs text-[#8A8F8C] sm:flex">
                      <Clock className="h-3 w-3" />
                      {item.waitMinutes}m
                    </span>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#1B3B2E]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DoctorPanel>
  );
}
