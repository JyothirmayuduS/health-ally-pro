import { cn } from "@/lib/utils";
import type { DoctorPatient } from "@/lib/doctor-mock-data";

type Props = {
  patient: DoctorPatient;
  selected?: boolean;
  onClick?: () => void;
};

export function DoctorPatientCard({ patient, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[20px] p-3.5 text-left transition-all",
        selected
          ? "bg-white shadow-[0_4px_16px_rgba(28,42,46,0.08)] ring-2 ring-[#B8735D]/50"
          : "bg-white/75 hover:bg-white hover:shadow-[0_4px_12px_rgba(28,42,46,0.06)]",
      )}
    >
      <img
        src={patient.photoUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[#1B3B2E]">{patient.name}</p>
        <p className="truncate text-xs text-[#8A8F8C]">{patient.condition}</p>
        <p className="text-[11px] text-[#8A8F8C]">Last visit {patient.lastVisit}</p>
      </div>
    </button>
  );
}
