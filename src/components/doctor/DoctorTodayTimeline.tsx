import { Link } from "@tanstack/react-router";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { formatDisplayToken, getQueuePatient } from "@/lib/doctor-live-queue";
import { buildTodayTimeline } from "@/lib/doctor-patient-queue";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  serving: "bg-[#1B3B2E] text-white",
  waiting: "bg-[#F5E6B8] text-[#5C4A1E]",
  completed: "bg-[#E8EFE6] text-[#1B3B2E]",
  booking: "bg-[#FCE8E6] text-[#C45C4A]",
} as const;

export function DoctorTodayTimeline() {
  const { entries, bookingRequests } = useLiveQueue();
  const items = buildTodayTimeline({ accepting: true, room: "", entries, bookingRequests });

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#E8E4DF] bg-white/60 px-4 py-8 text-center text-sm text-[#8A8F8C]">
        No visits on today&apos;s timeline yet.
      </p>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, i) => {
        const patient = getQueuePatient(item.patientId);
        if (!patient) return null;
        const href =
          item.status === "booking"
            ? "/doctor/queue"
            : "/doctor/patients/$patientId";
        const params =
          item.status === "booking" ? undefined : { patientId: item.patientId };

        return (
          <li
            key={item.id}
            className="grid grid-cols-[46px_12px_minmax(0,1fr)] items-stretch"
          >
            <div className="flex items-start justify-end pr-2 pt-4">
              <span className="text-[12px] font-bold tabular-nums text-[#B8735D]">{item.time}</span>
            </div>
            <div className="relative flex justify-center self-stretch">
              {i > 0 && (
                <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-[#E0DCD6]" aria-hidden />
              )}
              {i < items.length - 1 && (
                <div className="absolute bottom-0 left-1/2 top-4 w-px -translate-x-1/2 bg-[#E0DCD6]" aria-hidden />
              )}
              <span className="relative z-10 mt-4 h-[9px] w-[9px] rounded-full bg-[#B8735D] ring-[4px] ring-[#F7F5F2]" />
            </div>
            <div className="min-w-0 pb-4 pl-3">
              <Link
                to={href}
                params={params}
                className="block rounded-[18px] bg-white p-3.5 shadow-[0_2px_14px_rgba(27,59,46,0.06)] transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EDEAE6] text-[10px] font-semibold">
                      {patient.initials}
                    </span>
                    <p className="truncate font-semibold text-[#1B3B2E]">{patient.name}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATUS_STYLE[item.status],
                    )}
                  >
                    {item.label}
                    {item.token != null ? ` · ${formatDisplayToken(item.token)}` : ""}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-[#8A8F8C]">{item.reason}</p>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
