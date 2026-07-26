import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { loadPatientRegistry } from "@/lib/shared/patient-registry";
import { listVitals } from "@/lib/nursing-desk/vitals";
import { AlertCircle } from "lucide-react";
import { PatientProfileWorkspace } from "@/components/patient-management/PatientProfileWorkspace";
import { parseAllergieSubstances } from "@/lib/patient-allergy";

export default function NursingPatients() {
  const vitals = listVitals();
  const patients = useMemo(() => loadPatientRegistry(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = patients.find((p) => p.id === selectedId);

  return (
    <div className="space-y-5" data-testid="nursing-patients">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patients.map((p) => {
          const last = vitals.find((v) => v.patientId === p.id);
          const allergyList = parseAllergieSubstances(p.allergies);
          const hasAllergy = allergyList.length > 0 && p.allergies !== "—";
          const active = selectedId === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`surface p-5 text-left transition-colors hover:border-clay/40 ${
                active ? "border-clay/50 ring-1 ring-clay/30" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-soft text-[13px] font-medium text-clay">
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-ink-900">{p.name}</h2>
                    <p className="font-mono text-[11px] text-ink-400">{p.mrn}</p>
                  </div>
                </div>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase text-ink-500">
                  {p.gender}
                </span>
              </div>

              <p className="mt-3 text-[12px] text-ink-500">{p.phone}</p>

              {hasAllergy && (
                <div className="mt-3 flex items-center gap-1.5 rounded-md border border-clay/20 bg-clay-soft/50 px-3 py-2 text-[12px] text-clay">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Allergies: {allergyList.join(", ")}
                </div>
              )}

              {last ? (
                <div className="mt-4 rounded-lg border border-ink-200 bg-stone-50 px-3 py-2.5 text-[12px]">
                  <div className="font-mono text-[10px] uppercase text-ink-400">Last vitals</div>
                  <div className="mt-1 font-medium text-ink-800">
                    BP {last.bpSys}/{last.bpDia} · Pulse {last.pulse} · SpO₂ {last.spo2}%
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-[12px] text-ink-400">No vitals recorded</p>
              )}

              <Link
                to="/nursing/vitals"
                search={{ patient: p.id }}
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-flex text-[12px] font-medium text-clay hover:underline"
              >
                Record vitals →
              </Link>
            </button>
          );
        })}
      </div>

      {selected ? (
        <section className="surface p-4" data-testid="nursing-patient-profile">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink-800">Clinical profile</h3>
            <button
              type="button"
              className="text-[12px] text-ink-500 hover:underline"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          <PatientProfileWorkspace
            patientId={selected.id}
            mode="staff"
            sharedPatient={selected}
            embedded
            defaultTab="allergies"
          />
        </section>
      ) : null}
    </div>
  );
}
