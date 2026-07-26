/**
 * Chart History → Vaccines: compact due preview.
 * Full give flow lives on /doctor/immunizations (same pattern as Rx).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Syringe } from "lucide-react";
import {
  SCHEDULE_DOSES,
  ageInMonths,
  classifyDose,
} from "@/lib/immunization/schedule";
import {
  IMM_STORE_EVENT,
  deferredDoseIds,
  givenDoseIds,
  refusedDoseIds,
} from "@/lib/immunization/store";
import { getSharedPatient, resolvePatientId } from "@/lib/shared/patients";
import { cn } from "@/lib/utils";

type Props = { patientId: string };

function visitDue(patientId: string) {
  const patient =
    getSharedPatient(resolvePatientId(patientId)) ?? getSharedPatient(patientId);
  if (!patient) return [];
  const ageMo = ageInMonths(patient.dob);
  const given = givenDoseIds(patient.id);
  const deferred = deferredDoseIds(patient.id);
  const refused = refusedDoseIds(patient.id);
  return SCHEDULE_DOSES.map((d) => ({
    dose: d,
    status: classifyDose(
      d,
      ageMo,
      given.has(d.id),
      deferred.has(d.id),
      refused.has(d.id),
      patient.gender,
    ),
  })).filter((x) => {
    if (x.status !== "due" && x.status !== "overdue") return false;
    if (x.dose.program === "travel" || x.dose.program === "risk") return false;
    if (x.status === "due") return true;
    return x.dose.ageMonths >= ageMo - 4;
  });
}

export function ChartVaccinesPanel({ patientId }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener(IMM_STORE_EVENT, on);
    return () => window.removeEventListener(IMM_STORE_EVENT, on);
  }, []);

  const visitRows = useMemo(() => visitDue(patientId), [patientId, tick]);
  const preview = visitRows.slice(0, 4);

  return (
    <div className="space-y-3">
      {visitRows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl bg-[#E8EFE6]/50 px-3 py-3.5 text-sm text-[#3D6B45]">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Up to date for this visit
        </div>
      ) : (
        <ul className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[16px] border border-[#EDEAE6]">
          {preview.map(({ dose, status }) => (
            <li key={dose.id} className="flex items-center gap-3 bg-white px-3 py-3">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full",
                  status === "overdue" ? "bg-[#FCE8E6]" : "bg-[#F5F2ED]",
                )}
              >
                <Syringe className="h-4 w-4 text-[#8A8F8C]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1B3B2E]">{dose.shortName}</p>
                <p className="text-[10px] font-semibold uppercase text-[#8A8F8C]">{status}</p>
              </div>
              <Link
                to="/doctor/immunizations"
                search={{ patientId, view: "due", doseId: dose.id }}
                className="rounded-full bg-[#1B3B2E] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Give
              </Link>
            </li>
          ))}
        </ul>
      )}

      {visitRows.length > 4 ? (
        <p className="text-center text-xs text-[#8A8F8C]">+{visitRows.length - 4} more on Vaccinations</p>
      ) : null}

      <Link
        to="/doctor/immunizations"
        search={{ patientId, view: "due" }}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#EDEAE6] bg-white text-sm font-semibold text-[#1B3B2E]"
      >
        Open vaccinations
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function vaccineDueCount(patientId: string): number {
  return visitDue(patientId).length;
}
