import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  loadInvestigationMaster,
  saveInvestigationMaster,
  type InvestigationMaster,
} from "@/lib/hospital-masters";
import {
  DeskPanel,
  DeskTable,
  DeskThead,
  DeskTh,
  DeskTd,
  DeskTr,
} from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masters/investigations")({
  component: InvestigationsMasterPage,
});

function InvestigationsMasterPage() {
  const [rows, setRows] = useState<InvestigationMaster[]>(() => loadInvestigationMaster());

  function saveAll() {
    saveInvestigationMaster(rows);
    toast.success("Investigation master saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-investigations-master">
      <DeskPanel
        title="Investigation master"
        subtitle="Lab, radiology & cardiology — orders from doctor & reception"
      >
        <div className="flex justify-end border-b border-ink-100 p-3">
          <button
            type="button"
            onClick={saveAll}
            className="rounded-md bg-plum px-4 py-2 text-[12px] text-white"
          >
            Save all
          </button>
        </div>
        <DeskTable>
          <DeskThead>
            <DeskTh>Code</DeskTh>
            <DeskTh>Test name</DeskTh>
            <DeskTh>Department</DeskTh>
            <DeskTh>Default ₹</DeskTh>
          </DeskThead>
          <tbody>
            {rows.map((r) => (
              <DeskTr key={r.code}>
                <DeskTd className="font-mono">{r.code}</DeskTd>
                <DeskTd>{r.name}</DeskTd>
                <DeskTd className="capitalize">{r.department}</DeskTd>
                <DeskTd>{r.defaultPrice != null ? `₹${r.defaultPrice}` : "—"}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
