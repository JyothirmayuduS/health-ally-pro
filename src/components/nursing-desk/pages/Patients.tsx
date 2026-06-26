import { Link } from "@tanstack/react-router";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { listVitals } from "@/lib/nursing-desk/vitals";
import { AlertCircle } from "lucide-react";

export default function NursingPatients() {
  const vitals = listVitals();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="nursing-patients">
      {SHARED_PATIENTS.map((p) => {
        const last = vitals.find((v) => v.patientId === p.id);
        const hasAllergy = p.allergies !== "—";

        return (
          <div key={p.id} className="surface p-5 transition-colors hover:border-clay/40">
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
                Allergies: {p.allergies}
              </div>
            )}

            {last ? (
              <div className="mt-4 rounded-lg border border-ink-200 bg-stone-50 px-3 py-2.5 text-[12px]">
                <div className="font-mono text-[10px] uppercase text-ink-400">Last vitals</div>
                <div className="mt-1 font-medium text-ink-800">
                  BP {last.bpSys}/{last.bpDia} · Pulse {last.pulse} · SpO₂ {last.spo2}%
                </div>
                <div className="mt-0.5 text-[11px] text-ink-400">
                  {new Date(last.at).toLocaleString("en-IN")}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[12px] text-ink-400">No vitals recorded</p>
            )}

            <Link
              to="/nursing/vitals"
              search={{ patient: p.id }}
              className="mt-4 inline-flex text-[12px] font-medium text-clay hover:underline"
            >
              Record vitals →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
