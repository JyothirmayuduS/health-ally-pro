import React, { useState } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import LocationChip from "./LocationChip";
import ClinicalChecks from "./ClinicalChecks";
import { runClinicalChecks } from "@/lib/pharmacy-desk/interactions";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import {
  X, History, ArrowRight, Pause, Ban, Boxes, ShieldAlert, AlertTriangle, Repeat,
} from "lucide-react";

export default function PrescriptionDrawer({ rxId, onClose }) {
  const ph = usePharmacy();
  const [holdReason, setHoldReason] = useState("");

  if (!rxId) return null;
  const rx = ph.prescriptions.find((r) => r.id === rxId);
  if (!rx) return null;

  const patient = ph.getPatient(rx.patientId);
  const doctor = ph.getStaff(rx.prescribedByStaffId);
  const findings = runClinicalChecks({ prescription: rx, patient, inventory: ph.inventory });
  const blocking = findings.some((f) => f.severity === "major");
  const stockOk = rx.items.every((it) => ph.drugOnHand(it.drugId) >= it.quantity);
  const shortItems = rx.items.filter((it) => ph.drugOnHand(it.drugId) < it.quantity);

  return (
    <div data-testid="rx-drawer" className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/30 backdrop-blur-[2px] animate-rise" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[680px] bg-background border-l border-border/70 shadow-2xl flex flex-col animate-rise">
        {/* header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/70">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-muted-foreground">{(rx.rxNumber || rx.id).toUpperCase()}</span>
                <PriorityBadge priority={rx.priority} />
                <StatusBadge status={rx.status} />
                {rx.walkIn && <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800">Walk-in</span>}
              </div>
              <h2 className="font-display text-[24px] mt-1 leading-tight text-[hsl(var(--ink))] truncate">{patient?.name || "Unknown patient"}</h2>
              <div className="text-[12px] text-muted-foreground">
                MRN {patient?.mrn} · {patient?.sex} · DOB {fmt.date(patient?.dob)} · {patient?.phone}
              </div>
              {doctor && (
                <div className="text-[12px] text-muted-foreground mt-1">
                  Prescribed by <span className="text-foreground">{doctor.name}</span> · {fmt.relative(rx.createdAt)}
                </div>
              )}
            </div>
            <button data-testid="drawer-close-btn" onClick={onClose} className="rounded-md border border-border/70 bg-card p-1.5 hover:bg-[hsl(var(--paper-200))]/60 transition-colors" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {patient?.allergies?.length > 0 && (
              <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800">
                <ShieldAlert className="h-3 w-3" /> Allergies: {patient.allergies.join(", ")}
              </span>
            )}
            {(patient?.conditions || []).length > 0 && (
              <span className="pharm-pill bg-sky-50 border-sky-200 text-sky-800">
                Conditions: {patient.conditions.join(", ")}
              </span>
            )}
            {!stockOk && (
              <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800" data-testid="stock-warning">
                <AlertTriangle className="h-3 w-3" /> Short stock — {shortItems.map((s) => s.medicationName).join(", ")}
              </span>
            )}
            {blocking && (
              <span className="pharm-pill bg-rose-100 border-rose-300 text-rose-900" data-testid="blocking-warning">
                Major clinical alert — review before dispense
              </span>
            )}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">
          <ClinicalChecks prescription={rx} />

          <section>
            <h3 className="font-display text-[15px] mb-2 text-muted-foreground uppercase tracking-[0.12em]">
              Medication{rx.items.length > 1 ? "s" : ""} <span className="opacity-60">({rx.items.length})</span>
            </h3>
            <ul className="space-y-3">
              {rx.items.map((item, idx) => {
                const drug = ph.getDrug(item.drugId);
                const onHand = ph.drugOnHand(item.drugId);
                const short = onHand < item.quantity;
                const { plan } = ph.planFEFO(item.drugId, item.quantity);
                return (
                  <li key={idx} className="pharm-card p-4" data-testid={`rx-item-${idx}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-[18px] text-[hsl(var(--ink))]">
                          {item.medicationName} <span className="text-muted-foreground text-[14px]">· {item.dosage}</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground mt-0.5">
                          {item.frequency} · {item.duration} {drug?.form ? `· ${drug.form}` : ""}
                        </div>
                        {drug && <div className="mt-1.5"><LocationChip location={drug.location} /></div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Qty</div>
                        <div className="font-display text-[22px] leading-none tabular-nums">{item.quantity}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-[13px] leading-relaxed border-l-2 border-[hsl(var(--sage-300))]/60 pl-3 text-[hsl(var(--ink))]/85">{item.instructions}</div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] flex-wrap">
                      <span className={classNames("font-mono inline-flex items-center gap-1", short ? "text-amber-700" : "text-emerald-700")}>
                        <Boxes className="h-3 w-3" /> On hand {onHand} {short && "· short"}
                      </span>
                      {plan.length > 0 && (
                        <span className="font-mono text-muted-foreground">
                          FEFO: {plan.map((p) => `${p.lot}×${p.take}`).join(" + ")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {rx.notes && (
            <section>
              <h3 className="font-display text-[15px] mb-2 text-muted-foreground uppercase tracking-[0.12em]">Notes</h3>
              <div className="pharm-card p-4 text-[13px] whitespace-pre-wrap text-[hsl(var(--ink))]/85">{rx.notes}</div>
            </section>
          )}

          <section className="grid grid-cols-3 gap-3 text-[13px]">
            <div className="pharm-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Refills allowed</div>
              <div className="font-display text-[20px] tabular-nums">{rx.refillsAllowed}</div>
            </div>
            <div className="pharm-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Refills used</div>
              <div className="font-display text-[20px] tabular-nums">{rx.refillsUsed}</div>
            </div>
            <div className="pharm-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Payment</div>
              <div className="text-[14px] capitalize">{rx.paymentStatus || "—"}</div>
            </div>
          </section>

          <section>
            <h3 className="font-display text-[15px] mb-2 text-muted-foreground uppercase tracking-[0.12em]">
              <History className="h-4 w-4 inline -mt-0.5 mr-1" /> Audit trail
            </h3>
            <ol className="space-y-2.5 border-l border-border/70 ml-2 pl-4">
              {(rx.history || []).map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--sage-500))]" />
                  <div className="text-[13px] text-[hsl(var(--ink))]">{h.action}</div>
                  <div className="text-[11px] text-muted-foreground">{h.by} · {fmt.relative(h.at)}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* footer actions */}
        <div className="px-6 py-4 border-t border-border/70 bg-[hsl(var(--paper-100))]/40">
          {rx.status === "new" && (
            <div className="flex gap-2">
              <button data-testid="action-begin-review" onClick={() => ph.beginReview(rx.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors">
                Begin review <ArrowRight className="h-4 w-4" />
              </button>
              <button data-testid="action-hold" onClick={() => ph.holdRx(rx.id, "Verifying details")}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2.5 text-sm hover:bg-[hsl(var(--paper-200))]/60 transition-colors">
                <Pause className="h-4 w-4" /> Hold
              </button>
              <button data-testid="action-reject" onClick={() => ph.rejectRx(rx.id, "Rejected at intake")}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-card px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 transition-colors">
                <Ban className="h-4 w-4" /> Reject
              </button>
            </div>
          )}

          {rx.status === "in_review" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button data-testid="action-send-to-dispense" onClick={() => ph.sendToDispense(rx.id)}
                  className={classNames(
                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-medium transition-colors",
                    blocking ? "bg-rose-700 text-white hover:bg-rose-800" : "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] hover:bg-[hsl(var(--sage-700))]",
                  )}
                  title={blocking ? "Override major alert and send" : "Send to dispense"}>
                  {blocking ? "Override & send" : "Send to dispense"} <ArrowRight className="h-4 w-4" />
                </button>
                <input data-testid="hold-reason-input" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Hold reason…" className="pharm-input flex-1" />
                <button data-testid="action-hold-with-reason" onClick={() => ph.holdRx(rx.id, holdReason || "Pending verification")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2.5 text-sm hover:bg-[hsl(var(--paper-200))]/60 transition-colors">
                  <Pause className="h-4 w-4" /> Hold
                </button>
              </div>
              <button data-testid="action-reject-rx" onClick={() => ph.rejectRx(rx.id, "Rejected after review")}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-card py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors">
                <Ban className="h-4 w-4" /> Reject prescription
              </button>
            </div>
          )}

          {rx.status === "ready_to_dispense" && (
            <button data-testid="action-start-dispensing" onClick={() => ph.startDispensing(rx.id)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors">
              Move to dispense counter <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {rx.status === "dispensing" && (
            <div className="text-center text-sm text-muted-foreground py-2">
              Use the <strong>Dispense counter</strong> for the pick path & multi-batch dispense.
            </div>
          )}

          {rx.status === "dispensed" && (
            <button data-testid="action-mark-collected" onClick={() => ph.markCollected(rx.id)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors">
              Mark collected
            </button>
          )}

          {rx.status === "on_hold" && (
            <button data-testid="action-resume-review" onClick={() => ph.beginReview(rx.id)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors">
              <Repeat className="h-4 w-4" /> Resume review
            </button>
          )}

          {(rx.status === "collected" || rx.status === "cancelled") && (
            <div className="text-center text-sm text-muted-foreground py-2">No further actions — Rx {rx.status}.</div>
          )}
        </div>
      </div>
    </div>
  );
}
