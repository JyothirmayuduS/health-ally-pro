import { Link } from "@tanstack/react-router";
import { AlertTriangle, User } from "lucide-react";
import { resolveDoctorPatient } from "@/lib/doctor-patient-context";
import { cn } from "@/lib/utils";

const STATUS_BADGE = {
  Urgent: "bg-[#FCE8E6] text-[#C45C4A]",
  Stable: "bg-[#E8EFE6] text-[#1B3B2E]",
  Monitoring: "bg-[#F5E6B8] text-[#5C4A1E]",
  Critical: "bg-[#FCE8E6] text-[#C45C4A]",
} as const;

type Props = {
  patientId: string;
  className?: string;
};

/** Clinical context card — allergies, condition, chart link */
export function DoctorClinicalPatientCard({ patientId, className }: Props) {
  const patient = resolveDoctorPatient(patientId);
  if (!patient) return null;

  return (
    <article
      className={cn(
        "rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-[0_2px_14px_rgba(27,59,46,0.05)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-[#1B3B2E]"
          style={{ backgroundColor: patient.accent ?? "#F0DDD6" }}
        >
          {patient.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-[#1B3B2E]">{patient.name}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                STATUS_BADGE[patient.status],
              )}
            >
              {patient.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[#8A8F8C]">
            {patient.condition} · {patient.age}y {patient.gender} · {patient.patientRef}
          </p>
          {patient.alert ? (
            <p className="mt-2 text-sm font-medium text-[#C45C4A]">{patient.alert}</p>
          ) : null}
        </div>
        <Link
          to="/doctor/patients/$patientId"
          params={{ patientId: patient.id }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-xs font-semibold text-[#1B3B2E]"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.75} />
          Chart
        </Link>
      </div>
      {patient.allergyWarning ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FCE8E6] px-3 py-2 text-sm font-medium text-[#C45C4A]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Allergy: {patient.allergyWarning}
        </div>
      ) : null}
    </article>
  );
}
