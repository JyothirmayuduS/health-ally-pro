import { useMemo, useState } from "react";
import { usePharmacyStore, getPatient } from "@/lib/pharmacy-desk/store";
import { SectionLabel, EmptyState, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, CheckCircle, XCircle, Smartphone, User } from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";

export default function Refills() {
  const { refills, prescriptions, patients, approveRefill, denyRefill } = usePharmacyStore();
  const [filter, setFilter] = useState("pending");
  const [denyId, setDenyId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return refills;
    return refills.filter((r) => r.status === filter);
  }, [refills, filter]);

  return (
    <div className="space-y-6">
      <SectionLabel action={
        <div className="flex gap-2">
          {(["pending", "approved", "denied", "all"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className={filter === f ? "btn-primary" : "border-ink-200"} onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
      }>
        Refill requests
      </SectionLabel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={RefreshCw} title="No refills" hint="Patient refill requests appear here." /></div>
        ) : (
          filtered.map((rf) => {
            const patient = getPatient(rf.patient_id, patients);
            const drug = findDrug(rf.drug_id);
            const orig = prescriptions.find((r) => r.id === rf.original_rx_id);
            return (
              <div key={rf.id} className="surface p-5">
                <div className="flex items-center justify-between">
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase ${rf.status === "pending" ? "bg-mustard-soft text-mustard" : rf.status === "approved" ? "bg-sage-soft text-sage" : "bg-clay-soft text-clay"}`}>
                    {rf.status}
                  </span>
                  {rf.source === "patient_app" ? <Smartphone className="h-4 w-4 text-ink-400" /> : <User className="h-4 w-4 text-ink-400" />}
                </div>
                <h3 className="font-heading mt-3 text-[17px] font-semibold text-ink-900">{drug?.generic_name}</h3>
                <p className="text-[12px] text-ink-600">{drug?.strength} · {patient?.name}</p>
                {drug && <div className="mt-2"><LocationChip location={drug.location} /></div>}
                <div className="mt-3 space-y-1 text-[12px] text-ink-500">
                  <div>Due: {rf.due_date}</div>
                  <div>Refills left: {rf.refills_remaining}</div>
                  <div>Original: {orig?.rx_number}</div>
                </div>
                {rf.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="btn-primary flex-1" onClick={() => approveRefill(rf.id)}>
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-ink-200" onClick={() => setDenyId(rf.id)}>
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Deny
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!denyId} onOpenChange={() => setDenyId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deny refill</DialogTitle></DialogHeader>
          <Textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder="Contact doctor for new Rx…" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDenyId(null)}>Cancel</Button>
            <Button disabled={!denyReason.trim()} onClick={() => { denyRefill(denyId!, denyReason); setDenyId(null); setDenyReason(""); }}>Deny refill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
