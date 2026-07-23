import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  loadAdviseTemplates,
  saveAdviseTemplates,
  type AdviseTemplate,
} from "@/lib/hospital-masters";
import { DeskPanel } from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masters/advise")({
  component: AdviseTemplatesPage,
});

function AdviseTemplatesPage() {
  const [rows, setRows] = useState<AdviseTemplate[]>(() => loadAdviseTemplates());

  function saveAll() {
    saveAdviseTemplates(rows);
    toast.success("Advise templates saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-advise-templates">
      <DeskPanel
        title="Advise templates"
        subtitle="Doctor → View Rx → Advise (multilingual snippets)"
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
        <ul className="divide-y divide-ink-100">
          {rows.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink-900">{r.label}</span>
                <span className="rounded bg-ink-100 px-2 py-0.5 font-mono text-[10px] uppercase">
                  {r.locale}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-ink-600">{r.body}</p>
            </li>
          ))}
        </ul>
      </DeskPanel>
    </div>
  );
}
