import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { loadServiceFees, updateServiceFee, type ServiceFee } from "@/lib/shared/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IndianRupee, Briefcase, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";

export const Route = createFileRoute("/admin/services")({
  component: AdminServices,
});

function AdminServices() {
  const [services, setServices] = useState<ServiceFee[]>(() => loadServiceFees());
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [savedRow, setSavedRow] = useState<string | null>(null);
  const [savedAll, setSavedAll] = useState(false);

  function save(doctorId: string) {
    const fee = drafts[doctorId];
    if (fee == null) return;
    setServices(updateServiceFee(doctorId, fee, services));
    setSavedRow(doctorId);
    toast.success("Consultation fee updated successfully");
    setTimeout(() => setSavedRow(null), 1500);
  }

  function saveAll() {
    let next = services;
    for (const [doctorId, fee] of Object.entries(drafts)) {
      if (fee != null) next = updateServiceFee(doctorId, fee, next);
    }
    setServices(next);
    setDrafts({});
    setSavedAll(true);
    toast.success("All doctor consultation fees saved");
    setTimeout(() => setSavedAll(false), 2000);
  }

  return (
    <div className="space-y-6" data-testid="admin-services">
      {/* Top Action Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-bone/30 p-4 border border-ink-100 rounded-lg surface">
        <div className="flex items-center gap-2.5 text-[13px] text-ink-500">
          <Briefcase className="h-4.5 w-4.5 text-plum shrink-0" />
          <span>Consultation rates sync instantly with receptionist billing invoices.</span>
        </div>
        <button
          onClick={saveAll}
          disabled={Object.keys(drafts).length === 0}
          className="rounded-md bg-plum disabled:opacity-50 px-4 py-2 text-[12px] font-medium text-white hover:bg-plum-soft hover:text-plum transition flex items-center gap-1.5 shrink-0"
        >
          {savedAll ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {savedAll ? "All Saved" : "Save All Changes"}
        </button>
      </div>

      {/* Main Grid Panel */}
      <div className="surface overflow-hidden shadow-soft">
        <div className="border-b border-ink-100 px-5 py-3.5 bg-bone/25 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Consultation & Service Rates Manager
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="border-b border-ink-100 bg-bone/40 font-mono">
              <tr>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Doctor</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Specialty</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-400 w-44">Consultation Rate (₹)</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-400 w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services.map((s) => {
                const isDraft = drafts[s.doctorId] !== undefined;
                const isSaved = savedRow === s.doctorId;

                return (
                  <tr key={s.doctorId} className="hover:bg-bone/10 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink-950">{s.doctorName}</div>
                      <div className="text-[11px] text-ink-400 font-mono mt-0.5">{s.doctorId}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-600 font-medium">{s.specialty}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="relative inline-flex items-center">
                        <IndianRupee className="absolute left-2.5 h-3.5 w-3.5 text-ink-400 shrink-0" />
                        <input
                          type="number"
                          className="h-9 w-32 rounded border border-stone-200 bg-white pl-8 pr-3 text-right font-mono font-medium focus:ring-plum focus:border-plum text-[13.5px]"
                          defaultValue={s.fee}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [s.doctorId]: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => save(s.doctorId)}
                        disabled={!isDraft}
                        className={`rounded px-3 py-1.5 text-[12px] font-medium border transition ${
                          isSaved
                            ? "bg-status-doneBg border-status-doneBorder text-status-doneText"
                            : isDraft
                            ? "bg-plum text-white border-plum hover:bg-plum-soft hover:text-plum"
                            : "bg-white border-stone-200 text-ink-400 cursor-not-allowed"
                        }`}
                      >
                        {isSaved ? "Saved" : "Save Row"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
