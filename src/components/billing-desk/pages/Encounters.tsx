import { useEffect, useState } from "react";
import { useBillingStore } from "@/lib/billing-desk/store";
import { Route } from "@/routes/billing.encounters";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DeskPanel } from "@/components/desk-shell/ui";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";

export default function BillingEncounters() {
  const { encounter: encounterParam } = Route.useSearch();
  const {
    encounters,
    invoices,
    openPatientEncounter,
    closePatientEncounter,
    linkEncounter,
  } = useBillingStore();
  const [patientId, setPatientId] = useState(SHARED_PATIENTS[0]?.id ?? "");
  const [complaint, setComplaint] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (encounterParam) setSelected(encounterParam);
  }, [encounterParam]);

  const active = encounters.find((e) => e.id === selected);
  const openCount = encounters.filter((e) => e.status === "open").length;

  return (
    <div className="space-y-5" data-testid="billing-encounters">
      <div className="surface flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[200px] flex-1">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
            Patient
          </label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="mt-1.5 border-ink-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHARED_PATIENTS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.mrn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
            Chief complaint
          </label>
          <Input
            className="mt-1.5 border-ink-200 bg-white"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <Button
          className="btn-primary h-10 gap-2"
          onClick={() => {
            const enc = openPatientEncounter(patientId, complaint || undefined);
            toast.success(`Opened ${enc.id}`);
            setComplaint("");
            setSelected(enc.id);
          }}
        >
          <UserPlus className="h-4 w-4" /> Open encounter
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DeskPanel title={`Encounters · ${openCount} open`}>
          <div className="max-h-[480px] divide-y divide-ink-100 overflow-y-auto">
            {encounters.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-ink-400">No encounters yet.</p>
            ) : (
              encounters.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e.id)}
                  className={cn(
                    "w-full px-5 py-4 text-left transition-colors hover:bg-bone/50",
                    selected === e.id && "bg-teal-soft/25",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-500">{e.id}</span>
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase",
                        e.status === "open"
                          ? "bg-status-doneBg text-status-doneText"
                          : "bg-stone-100 text-ink-500",
                      )}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-ink-900">{e.patientName}</div>
                  <div className="mt-0.5 text-[11px] text-ink-400">{e.date}</div>
                </button>
              ))
            )}
          </div>
        </DeskPanel>

        <div className="surface p-5">
          {active ? (
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="font-mono text-[10px] uppercase text-ink-400">Encounter</div>
                <h2 className="font-heading text-lg font-semibold">{active.id}</h2>
                <p className="text-ink-500">
                  {active.patientName} · {active.mrn}
                </p>
                {active.chiefComplaint && (
                  <p className="mt-2 rounded-md bg-stone-50 px-3 py-2 text-ink-700">
                    {active.chiefComplaint}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-ink-200 bg-stone-50 py-3">
                  <div className="font-heading text-xl font-semibold">{active.invoiceIds.length}</div>
                  <div className="text-[10px] uppercase text-ink-400">Invoices</div>
                </div>
                <div className="rounded-lg border border-ink-200 bg-stone-50 py-3">
                  <div className="font-heading text-xl font-semibold">{active.labOrderIds.length}</div>
                  <div className="text-[10px] uppercase text-ink-400">Lab</div>
                </div>
                <div className="rounded-lg border border-ink-200 bg-stone-50 py-3">
                  <div className="font-heading text-xl font-semibold">{active.rxIds.length}</div>
                  <div className="text-[10px] uppercase text-ink-400">Rx</div>
                </div>
              </div>
              {active.status === "open" && (
                <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                  <Select
                    onValueChange={(invId) => {
                      linkEncounter(active.id, { invoiceId: invId });
                      toast.success("Invoice linked");
                    }}
                  >
                    <SelectTrigger className="w-48 border-ink-200 bg-white">
                      <SelectValue placeholder="Link invoice…" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices
                        .filter((i) => i.patientId === active.patientId)
                        .map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="border-ink-200"
                    onClick={() => {
                      closePatientEncounter(active.id);
                      toast.success("Encounter closed");
                      setSelected(null);
                    }}
                  >
                    Close encounter
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-[13px] text-ink-400">
              Select an encounter to view linked charges
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
