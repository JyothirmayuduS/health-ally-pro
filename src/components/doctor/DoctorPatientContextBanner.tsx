import { Link } from "@tanstack/react-router";
import { ChevronLeft, User } from "lucide-react";
import { resolveDoctorPatient } from "@/lib/doctor-patient-context";
import { cn } from "@/lib/utils";

type Props = {
  patientId: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
};

/** Sticky patient context — persists across clinical modules */
export function DoctorPatientContextBanner({
  patientId,
  backTo = "/doctor/patients",
  backLabel = "Back to patients",
  className,
}: Props) {
  const patient = resolveDoctorPatient(patientId);
  if (!patient) return null;

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-2xl border border-[#E8E4DF] bg-white px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      <Link
        to={backTo}
        search={{ view: "panel" }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-[#FAFAF8] text-[#1B3B2E]"
        aria-label={backLabel}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
      </Link>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-[#1B3B2E]"
        style={{ backgroundColor: patient.accent ?? "#F0DDD6" }}
      >
        {patient.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1B3B2E]">{patient.name}</p>
        <p className="truncate text-xs text-[#8A8F8C]">
          {patient.condition} · {patient.patientRef}
        </p>
      </div>
      <Link
        to="/doctor/patients/$patientId"
        params={{ patientId: patient.id.startsWith("p") ? patient.id : patientId }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3 py-2 text-xs font-semibold text-white"
      >
        <User className="h-3.5 w-3.5" strokeWidth={1.75} />
        Chart
      </Link>
    </div>
  );
}
