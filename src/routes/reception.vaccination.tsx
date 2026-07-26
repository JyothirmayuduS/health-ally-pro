import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  loadVaccineSchedule,
  loadPatientReminders,
  savePatientReminders,
  type PatientReminder,
} from "@/lib/hospital-masters";
import {
  DeskPanel,
  DeskTable,
  DeskThead,
  DeskTh,
  DeskTd,
  DeskTr,
} from "@/components/desk-shell/ui";
import { Syringe, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reception/vaccination")({
  component: VaccinationDeskPage,
});

function VaccinationDeskPage() {
  const schedule = loadVaccineSchedule();
  const [reminders, setReminders] = useState<PatientReminder[]>(() =>
    loadPatientReminders().filter((r) => r.type === "vaccine"),
  );

  function markDone(id: string) {
    const all = loadPatientReminders();
    const next = all.map((r) => (r.id === id ? { ...r, done: true } : r));
    savePatientReminders(next);
    setReminders(next.filter((r) => r.type === "vaccine" && !r.done));
    toast.success("Vaccine dose marked complete");
  }

  return (
    <div className="space-y-6" data-testid="reception-vaccination">
      <DeskPanel title="Immunization desk" subtitle="Schedule from Masters · stock via Pharmacy">
        <DeskTable>
          <DeskThead>
            <DeskTh>Vaccine</DeskTh>
            <DeskTh>Age</DeskTh>
            <DeskTh>Dose</DeskTh>
            <DeskTh>Route</DeskTh>
          </DeskThead>
          <tbody>
            {schedule.map((v) => (
              <DeskTr key={v.id}>
                <DeskTd className="font-medium">{v.vaccine}</DeskTd>
                <DeskTd>{v.ageLabel}</DeskTd>
                <DeskTd>{v.dose}</DeskTd>
                <DeskTd>{v.route}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>

      <DeskPanel title="Due today / upcoming">
        <DeskTable>
          <DeskThead>
            <DeskTh>Patient</DeskTh>
            <DeskTh>MRN</DeskTh>
            <DeskTh>Due</DeskTh>
            <DeskTh>Note</DeskTh>
            <DeskTh />
          </DeskThead>
          <tbody>
            {reminders.map((r) => (
              <DeskTr key={r.id}>
                <DeskTd>{r.patientName}</DeskTd>
                <DeskTd className="font-mono">{r.mrn}</DeskTd>
                <DeskTd>{r.dueDate}</DeskTd>
                <DeskTd>{r.note}</DeskTd>
                <DeskTd>
                  <button
                    type="button"
                    onClick={() => markDone(r.id)}
                    className="flex items-center gap-1 rounded-md bg-sage px-2 py-1 text-[11px] text-white"
                  >
                    <Check className="h-3 w-3" /> Given
                  </button>
                </DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
        {reminders.length === 0 && (
          <p className="p-6 text-center text-[13px] text-ink-500">No pending vaccine reminders</p>
        )}
      </DeskPanel>
    </div>
  );
}
