import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { loadServiceFees, updateServiceFee, type ServiceFee } from "@/lib/shared/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IndianRupee, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";

export const Route = createFileRoute("/admin/services")({
  component: AdminServices,
});

function AdminServices() {
  const [services, setServices] = useState<ServiceFee[]>(() => loadServiceFees());
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  function save(doctorId: string) {
    const fee = drafts[doctorId];
    if (fee == null) return;
    setServices(updateServiceFee(doctorId, fee, services));
    toast.success("Consultation fee updated");
  }

  function saveAll() {
    let next = services;
    for (const [doctorId, fee] of Object.entries(drafts)) {
      if (fee != null) next = updateServiceFee(doctorId, fee, next);
    }
    setServices(next);
    setDrafts({});
    toast.success("All fees saved");
  }

  return (
    <div className="space-y-5" data-testid="admin-services">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-ink-500">
          <Briefcase className="h-4 w-4 text-plum" />
          Fees apply to reception auto-invoicing immediately after save.
        </div>
        <Button size="sm" className="btn-primary h-9" onClick={saveAll}>
          Save all
        </Button>
      </div>
      <DeskPanel title="Consultation & service fees">
        <DeskTable>
          <DeskThead>
            <DeskTh>Doctor</DeskTh>
            <DeskTh>Specialty</DeskTh>
            <DeskTh align="right">Fee (₹)</DeskTh>
            <DeskTh align="right">Actions</DeskTh>
          </DeskThead>
          <tbody>
            {services.map((s) => (
              <tr key={s.doctorId} className="border-b border-stone-100">
                <td className="px-4 py-3 font-medium">{s.doctorName}</td>
                <td className="px-4 py-3 text-ink-500">{s.specialty}</td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <IndianRupee className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                    <Input
                      type="number"
                      className="h-8 w-28 border-ink-200 bg-white pl-7 text-right font-mono"
                      defaultValue={s.fee}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [s.doctorId]: Number(e.target.value) }))
                      }
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="border-ink-200 bg-white" onClick={() => save(s.doctorId)}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
