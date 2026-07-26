import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { loadIcdMaster, saveIcdMaster, type IcdDiagnosis } from "@/lib/hospital-masters";
import {
  DeskPanel,
  DeskTable,
  DeskThead,
  DeskTh,
  DeskTd,
  DeskTr,
} from "@/components/desk-shell/ui";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";

export const Route = createFileRoute("/admin/masters/diagnosis")({
  component: DiagnosisMasterPage,
});

function DiagnosisMasterPage() {
  const [rows, setRows] = useState<IcdDiagnosis[]>(() => loadIcdMaster());
  const [draft, setDraft] = useState({ code: "", description: "", category: "" });

  function add() {
    if (!draft.code.trim() || !draft.description.trim()) {
      toast.error("Code and description required");
      return;
    }
    const next = [...rows, { ...draft, code: draft.code.trim().toUpperCase() }];
    setRows(next);
    saveIcdMaster(next);
    setDraft({ code: "", description: "", category: "" });
    toast.success("ICD entry added");
  }

  function saveAll() {
    saveIcdMaster(rows);
    toast.success("Diagnosis master saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-diagnosis-master">
      <DeskPanel
        title="ICD-10 diagnosis master"
        subtitle="Used in doctor Rx, pre-auth, and morbidity reports"
      >
        <div className="flex flex-wrap gap-2 border-b border-ink-100 p-4">
          <input
            placeholder="ICD code"
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            className="h-9 w-28 rounded-md border border-ink-200 px-2 text-[13px]"
          />
          <input
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="h-9 min-w-[200px] flex-1 rounded-md border border-ink-200 px-2 text-[13px]"
          />
          <input
            placeholder="Category"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="h-9 w-36 rounded-md border border-ink-200 px-2 text-[13px]"
          />
          <button
            type="button"
            onClick={add}
            className="flex h-9 items-center gap-1 rounded-md bg-plum px-3 text-[12px] text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          <button
            type="button"
            onClick={saveAll}
            className="flex h-9 items-center gap-1 rounded-md border border-plum px-3 text-[12px] text-plum"
          >
            <Save className="h-4 w-4" /> Save all
          </button>
        </div>
        <DeskTable>
          <DeskThead>
            <DeskTh>Code</DeskTh>
            <DeskTh>Description</DeskTh>
            <DeskTh>Category</DeskTh>
          </DeskThead>
          <tbody>
            {rows.map((r) => (
              <DeskTr key={r.code}>
                <DeskTd className="font-mono font-medium">{r.code}</DeskTd>
                <DeskTd>{r.description}</DeskTd>
                <DeskTd>{r.category ?? "—"}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
