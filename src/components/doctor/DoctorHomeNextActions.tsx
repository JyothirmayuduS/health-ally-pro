import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  ChevronRight,
  ClipboardList,
  FlaskConical,
} from "lucide-react";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { computeClinicOverview } from "@/lib/doctor-clinic-overview";
import { buildHomeNextActions, type HomeActionItem } from "@/lib/doctor-home-data";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<
  HomeActionItem["kind"],
  { bg: string; Icon: typeof AlertTriangle; label: string; labelColor: string }
> = {
  urgent: { bg: "#FCE8E6", Icon: AlertTriangle, label: "URGENT", labelColor: "#C45C4A" },
  booking: { bg: "#F5E6B8", Icon: Briefcase, label: "BOOKING", labelColor: "#5C4A1E" },
  results: { bg: "#E8EFE6", Icon: FlaskConical, label: "RESULTS INBOX", labelColor: "#1B3B2E" },
  task: { bg: "#F0DDD6", Icon: ClipboardList, label: "TASK", labelColor: "#B8735D" },
};

export function DoctorHomeNextActions({ className }: { className?: string }) {
  const { entries, bookingRequests, accepting, room } = useLiveQueue();
  const overview = computeClinicOverview({ accepting, room, entries, bookingRequests });
  const actions = buildHomeNextActions(overview);

  return (
    <section className={cn("rounded-2xl border border-[#EDEAE6] bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-sm font-semibold text-[#1B3B2E]">Next actions</h2>
        <span className="text-xs text-[#8A8F8C]">Prioritized for clinic hours</span>
      </div>
      {actions.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#8A8F8C] sm:px-5">
          Nothing urgent — you&apos;re on track for today.
        </p>
      ) : (
        <ul className="divide-y divide-[#F0EDE9]">
          {actions.map((item) => {
            const style = KIND_STYLE[item.kind];
            const Icon = style.Icon;
            return (
              <li key={item.id}>
                <Link
                  to={item.to}
                  search={item.search}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAF8] sm:gap-4 sm:px-5"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: style.bg }}
                  >
                    <Icon className="h-4 w-4 text-[#1B3B2E]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[10px] font-bold tracking-wide"
                      style={{ color: style.labelColor }}
                    >
                      {style.label}
                    </p>
                    <p className="font-semibold text-[#1B3B2E]">{item.title}</p>
                    <p className="truncate text-sm text-[#8A8F8C]">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#B8735D]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
