import { useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { recordVitals } from "@/lib/nursing-desk/vitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export default function NursingVitals() {
  const search = useSearch({ strict: false }) as { patient?: string };
  const [patientId, setPatientId] = useState(search.patient ?? SHARED_PATIENTS[0]?.id ?? "");
  const [bpSys, setBpSys] = useState("120");
  const [bpDia, setBpDia] = useState("80");
  const [pulse, setPulse] = useState("72");
  const [temp, setTemp] = useState("37.0");
  const [spo2, setSpo2] = useState("98");
  const [notes, setNotes] = useState("");

  const patient = SHARED_PATIENTS.find((p) => p.id === patientId);

  const submit = () => {
    recordVitals({
      patientId,
      bpSys: Number(bpSys),
      bpDia: Number(bpDia),
      pulse: Number(pulse),
      temp: Number(temp),
      spo2: Number(spo2),
      notes: notes || undefined,
      nurse: "Sunita Pillai",
    });
    toast.success("Vitals saved");
    setNotes("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5" data-testid="nursing-vitals">
      <div className="surface p-6 lg:col-span-3">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="h-4 w-4 text-clay" />
          <h2 className="font-heading text-[15px] font-semibold">Vitals entry</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
              Patient
            </label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="mt-1.5 border-ink-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHARED_PATIENTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.mrn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "BP systolic", value: bpSys, set: setBpSys },
              { label: "BP diastolic", value: bpDia, set: setBpDia },
              { label: "Pulse (bpm)", value: pulse, set: setPulse },
              { label: "Temp (°C)", value: temp, set: setTemp },
              { label: "SpO₂ (%)", value: spo2, set: setSpo2 },
            ].map((f) => (
              <div key={f.label}>
                <label className="font-mono text-[10px] uppercase text-ink-400">{f.label}</label>
                <Input
                  className="mt-1 border-ink-200 bg-white font-mono"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase text-ink-400">Notes</label>
            <Input
              className="mt-1 border-ink-200 bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional clinical note"
            />
          </div>

          <Button className="btn-primary h-10 px-6" onClick={submit}>
            Save vitals
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        {patient && (
          <div className="surface p-5">
            <div className="font-mono text-[10px] uppercase text-ink-400">Selected patient</div>
            <h3 className="font-heading mt-1 text-lg font-semibold">{patient.name}</h3>
            <p className="font-mono text-[11px] text-ink-400">{patient.mrn}</p>
            {patient.bloodGroup && (
              <p className="mt-3 text-[12px] text-ink-600">Blood group: {patient.bloodGroup}</p>
            )}
            {patient.allergies !== "—" && (
              <p className="mt-2 text-[12px] text-clay">Allergies: {patient.allergies}</p>
            )}
          </div>
        )}
        <div className="rounded-lg border border-sage/30 bg-sage-soft/40 px-4 py-3 text-[12px] text-ink-600">
          Vitals are stored locally for this demo and appear on the nursing dashboard immediately after save.
        </div>
      </div>
    </div>
  );
}
