import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { loadVaccineSchedule, saveVaccineSchedule, type VaccineScheduleEntry } from "@/lib/hospital-masters";
import { DeskPanel, DeskTable, DeskThead, DeskTh, DeskTd, DeskTr } from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masters/vaccines")({
  component: VaccineSchedulePage,
});

function VaccineSchedulePage() {
  const [rows, setRows] = useState<VaccineScheduleEntry[]>(() => loadVaccineSchedule());

  function saveAll() {
    saveVaccineSchedule(rows);
    toast.success("Vaccine schedule saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-vaccine-schedule">
      <DeskPanel title="National immunization schedule" subtitle="Drives reception vaccination desk & reminders">
        <div className="flex justify-end border-b border-ink-100 p-3">
          <button type="button" onClick={saveAll} className="rounded-md bg-plum px-4 py-2 text-[12px] text-white">
            Save all
          </button>
        </div>
        <DeskTable>
          <DeskThead>
            <DeskTh>Vaccine</DeskTh>
              <DeskTh>Age</DeskTh>
              <DeskTh>Dose</DeskTh>
              <DeskTh>Route</DeskTh>
            </DeskThead>
          <tbody>
            {rows.map((r) => (
              <DeskTr key={r.id}>
                <DeskTd className="font-medium">{r.vaccine}</DeskTd>
                <DeskTd>{r.ageLabel}</DeskTd>
                <DeskTd>{r.dose}</DeskTd>
                <DeskTd>{r.route}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
