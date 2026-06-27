import { useMemo, useState } from "react";
import { usePharmacyStore, getPatient } from "@/lib/pharmacy-desk/store";
import { SectionLabel, EmptyState, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, CheckCircle, XCircle, Smartphone, User, AlertTriangle, Clock } from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { cn } from "@/lib/utils";

/** Returns the number of days since the given ISO date string. */
function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
}

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

      {/* Compliance notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-mustard/30 bg-mustard-soft/20 px-4 py-3 text-[12.5px] text-ink-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-mustard" />
        <span>
          <strong>Refill eligibility rules:</strong> Prescriptions older than <strong>90 days</strong> are expired and cannot be refilled. Requests with <strong>0 refills remaining</strong> require a new Rx from the prescribing physician.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={RefreshCw} title="No refills" hint="Patient refill requests appear here." /></div>
        ) : (
          filtered.map((rf) => {
            const patient = getPatient(rf.patient_id, patients);
            const drug = findDrug(rf.drug_id);
            const orig = prescriptions.find((r) => r.id === rf.original_rx_id);

            // ── Validation checks ──────────────────────────────────────────
            const isExhausted = rf.refills_remaining <= 0;
            const rxAgeDays = orig ? daysSince(orig.received_at) : 999;
            const isExpired = rxAgeDays > 90;
            const isBlocked = isExhausted || isExpired;

            return (
              <div
                key={rf.id}
                className={cn(
                  "surface p-5 border",
                  isBlocked && rf.status === "pending"
                    ? "border-clay/30 bg-clay-soft/10"
                    : "border-ink-200",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn(
                    "rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase",
                    rf.status === "pending"
                      ? isBlocked ? "bg-clay-soft text-clay" : "bg-mustard-soft text-mustard"
                      : rf.status === "approved"
                      ? "bg-sage-soft text-sage"
                      : "bg-clay-soft text-clay",
                  )}>
                    {rf.status}
                  </span>
                  {rf.source === "patient_app" ? <Smartphone className="h-4 w-4 text-ink-400" /> : <User className="h-4 w-4 text-ink-400" />}
                </div>

                <h3 className="font-heading mt-3 text-[17px] font-semibold text-ink-900">{drug?.generic_name}</h3>
                <p className="text-[12px] text-ink-600">{drug?.strength} · {patient?.name}</p>
                {drug && <div className="mt-2"><LocationChip location={drug.location} /></div>}

                <div className="mt-3 space-y-1 text-[12px] text-ink-500">
                  <div>Due: {rf.due_date}</div>
                  <div className="flex items-center gap-1.5">
                    <span>Refills left:</span>
                    <span className={cn("font-bold", isExhausted ? "text-clay" : "text-ink-900")}>
                      {rf.refills_remaining}
                    </span>
                    {isExhausted && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-clay-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-clay">
                        <XCircle className="h-2.5 w-2.5" /> Exhausted
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Original Rx:</span>
                    <span className="font-mono">{orig?.rx_number ?? rf.original_rx_id}</span>
                    {isExpired && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-clay-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-clay">
                        <Clock className="h-2.5 w-2.5" /> {Math.round(rxAgeDays)}d old — Expired
                      </span>
                    )}
                  </div>
                  {orig && (
                    <div className="text-[11px] text-ink-400">
                      Issued: {new Date(orig.received_at).toLocaleDateString()} · Age: {Math.round(rxAgeDays)}d
                    </div>
                  )}
                </div>

                {/* Block reason banner */}
                {isBlocked && rf.status === "pending" && (
                  <div className="mt-3 rounded bg-clay-soft/40 border border-clay/20 px-3 py-2 text-[11.5px] text-clay font-medium space-y-0.5">
                    {isExhausted && <div>⛔ No refills remaining — new Rx required from physician</div>}
                    {isExpired && <div>⛔ Rx is {Math.round(rxAgeDays)} days old — expired (limit: 90 days)</div>}
                  </div>
                )}

                {rf.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className={cn("flex-1", isBlocked ? "opacity-40 cursor-not-allowed" : "btn-primary")}
                      disabled={isBlocked}
                      title={
                        isBlocked
                          ? isExhausted
                            ? "No refills remaining — new Rx needed"
                            : "Original Rx expired (>90 days)"
                          : "Approve refill"
                      }
                      onClick={() => !isBlocked && approveRefill(rf.id)}
                    >
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
