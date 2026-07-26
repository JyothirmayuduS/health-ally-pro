import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
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
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reception/reminders")({
  component: PatientRemindersPage,
});

function PatientRemindersPage() {
  const [rows, setRows] = useState<PatientReminder[]>(() => loadPatientReminders());

  function markDone(id: string) {
    const next = rows.map((r) => (r.id === id ? { ...r, done: true } : r));
    setRows(next);
    savePatientReminders(next);
    toast.success("Reminder cleared");
  }

  const pending = rows.filter((r) => !r.done);

  return (
    <div className="space-y-4" data-testid="reception-reminders">
      <DeskPanel
        title="Patient reminders"
        subtitle="Follow-ups, vaccines, investigations, birthdays"
      >
        <DeskTable>
          <DeskThead>
            <DeskTh>Patient</DeskTh>
            <DeskTh>Type</DeskTh>
            <DeskTh>Due</DeskTh>
            <DeskTh>Phone</DeskTh>
            <DeskTh>Note</DeskTh>
            <DeskTh />
          </DeskThead>
          <tbody>
            {pending.map((r) => (
              <DeskTr key={r.id}>
                <DeskTd>{r.patientName}</DeskTd>
                <DeskTd className="capitalize">{r.type.replace("-", " ")}</DeskTd>
                <DeskTd>{r.dueDate}</DeskTd>
                <DeskTd>{r.phone}</DeskTd>
                <DeskTd>{r.note}</DeskTd>
                <DeskTd>
                  <button
                    type="button"
                    onClick={() => markDone(r.id)}
                    className="flex items-center gap-1 rounded-md border border-sage px-2 py-1 text-[11px] text-sage"
                  >
                    <Check className="h-3 w-3" /> Done
                  </button>
                </DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
        {pending.length === 0 && (
          <p className="flex items-center justify-center gap-2 p-8 text-[13px] text-ink-500">
            <Bell className="h-4 w-4" /> All reminders cleared
          </p>
        )}
      </DeskPanel>
    </div>
  );
}
