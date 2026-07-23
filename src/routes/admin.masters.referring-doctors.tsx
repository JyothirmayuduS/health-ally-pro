import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { loadReferringDoctors, saveReferringDoctors, type ReferringDoctor } from "@/lib/hospital-masters";
import { DeskPanel, DeskTable, DeskThead, DeskTh, DeskTd, DeskTr } from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masters/referring-doctors")({
  component: ReferringDoctorsPage,
});

function ReferringDoctorsPage() {
  const [rows, setRows] = useState<ReferringDoctor[]>(() => loadReferringDoctors());

  function saveAll() {
    saveReferringDoctors(rows);
    toast.success("Referring doctor master saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-referring-doctors">
      <DeskPanel title="Referring doctor master" subtitle="Commission & referral analytics (Accounts → Ref. share)">
        <div className="flex justify-end border-b border-ink-100 p-3">
          <button type="button" onClick={saveAll} className="rounded-md bg-plum px-4 py-2 text-[12px] text-white">
            Save all
          </button>
        </div>
        <DeskTable>
          <DeskThead>
            <DeskTh>Name</DeskTh>
              <DeskTh>Specialty</DeskTh>
              <DeskTh>Clinic</DeskTh>
              <DeskTh>Phone</DeskTh>
              <DeskTh>Commission</DeskTh>
              <DeskTh>Active</DeskTh>
            </DeskThead>
          <tbody>
            {rows.map((r) => (
              <DeskTr key={r.id}>
                <DeskTd>{r.name}</DeskTd>
                <DeskTd>{r.specialty}</DeskTd>
                <DeskTd>{r.clinic}</DeskTd>
                <DeskTd>{r.phone}</DeskTd>
                <DeskTd>{r.commissionPct != null ? `${r.commissionPct}%` : "—"}</DeskTd>
                <DeskTd>{r.active ? "Yes" : "No"}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
