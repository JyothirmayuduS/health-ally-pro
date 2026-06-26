import { ChevronRight } from "lucide-react";
import type { ReceptionPatient } from "@/lib/reception-mock-data";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

type PatientListCardProps = {
  patient: ReceptionPatient;
  selected?: boolean;
  date?: string;
  onClick?: () => void;
  className?: string;
};

export function PatientListCard({
  patient,
  selected,
  date,
  onClick,
  className,
}: PatientListCardProps) {
  const displayDate =
    date ??
    new Date(patient.registeredAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] p-3.5 text-left transition-all duration-200",
        selected
          ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-2 ring-[#D4F06D]/40"
          : "bg-white/60 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      <img
        src={patient.photoUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-[#1e293b]">{patient.name}</p>
          <StatusPill status={patient.visitStatus} />
        </div>
        <p className="mt-0.5 truncate text-xs text-[#94A3B8]">{patient.condition}</p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs text-[#94A3B8]">{displayDate}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#CBD5E1]" />
    </button>
  );
}
