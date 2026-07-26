import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  loadCommsTemplates,
  saveCommsTemplates,
  type CommunicationTemplate,
} from "@/lib/hospital-masters";
import { DeskPanel } from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masters/comms")({
  component: CommsTemplatesPage,
});

function CommsTemplatesPage() {
  const [rows, setRows] = useState<CommunicationTemplate[]>(() => loadCommsTemplates());

  function saveAll() {
    saveCommsTemplates(rows);
    toast.success("Communication templates saved");
  }

  return (
    <div className="space-y-4" data-testid="admin-comms-templates">
      <p className="text-[13px] text-ink-500">
        Template placeholders: {"{{patient}}"}, {"{{date}}"}, {"{{doctor}}"}, {"{{link}}"} — gateway
        integration (Twilio / WhatsApp Business) is ops-configured.
      </p>
      <DeskPanel title="SMS / Email / WhatsApp templates">
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
                <span className="font-medium">{r.name}</span>
                <span className="rounded bg-teal-soft px-2 py-0.5 font-mono text-[10px] uppercase text-teal">
                  {r.channel}
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
