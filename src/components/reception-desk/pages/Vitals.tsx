import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { VitalsCaptureWorkspace } from "@/components/clinical/VitalsCaptureWorkspace";
import { calcAge, getSharedPatient, SHARED_PATIENTS } from "@/lib/shared/patients";

type Props = {
  searchPatientId?: string;
};

export function ReceptionVitalsWorkspace({ searchPatientId }: Props) {
  const [patientId, setPatientId] = useState(searchPatientId ?? SHARED_PATIENTS[0]?.id ?? "");

  useEffect(() => {
    if (searchPatientId) setPatientId(searchPatientId);
  }, [searchPatientId]);

  const patient = getSharedPatient(patientId);

  return (
    <VitalsCaptureWorkspace
      portal="reception"
      patientId={patientId}
      recordedBy="Reception desk"
      patientCard={
        patient ? (
          <article className="surface rounded-md p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sm font-medium text-sage">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[15px] font-semibold text-ink-900">{patient.name}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">
                  {patient.bloodGroup ? `${patient.bloodGroup} · ` : ""}
                  {calcAge(patient.dob)}y {patient.gender} · {patient.id}
                </p>
              </div>
              <Link
                to="/reception/patients"
                className="shrink-0 rounded-sm border border-ink-200 bg-bone px-3 py-1.5 text-[12px] font-medium text-ink-900 hover:bg-white"
              >
                Patient file
              </Link>
            </div>
            {patient.allergies && patient.allergies !== "—" ? (
              <div className="mt-3 flex items-center gap-2 rounded-sm bg-[#FCE8E6] px-3 py-2 text-[13px] font-medium text-[#C45C4A]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Allergy: {patient.allergies}
              </div>
            ) : null}
          </article>
        ) : null
      }
      patientSelect={
        searchPatientId ? undefined : (
          <section className="surface rounded-md p-4">
            <label className="block text-[10.5px] font-mono font-medium uppercase tracking-[0.14em] text-ink-400">
              Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-2 h-10 w-full rounded-sm border border-ink-200 bg-bone px-3 text-[13px] text-ink-900 focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            >
              {SHARED_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.id}
                </option>
              ))}
            </select>
          </section>
        )
      }
    />
  );
}
