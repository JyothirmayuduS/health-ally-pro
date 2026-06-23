import React, { useMemo, useState } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/pharmacy-desk/StatusBadge";
import PrescriptionDrawer from "@/components/pharmacy-desk/PrescriptionDrawer";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import { Printer, Tag, Boxes, ArrowRight, CheckCircle2 } from "lucide-react";

const LANES = [
  { key: "ready_to_dispense", label: "Cleared · ready", color: "border-emerald-300" },
  { key: "dispensing",        label: "Being dispensed", color: "border-violet-300" },
  { key: "dispensed",         label: "Ready for pickup",color: "border-teal-300" },
];

export default function Dispense() {
  const ph = usePharmacy();
  const [openRx, setOpenRx] = useState(null);
  const [labelPreview, setLabelPreview] = useState(null);

  const grouped = useMemo(() => {
    const out = { ready_to_dispense: [], dispensing: [], dispensed: [] };
    ph.prescriptions.forEach((rx) => {
      if (out[rx.status]) out[rx.status].push(rx);
    });
    Object.values(out).forEach((arr) =>
      arr.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      }),
    );
    return out;
  }, [ph.prescriptions]);

  return (
    <div data-testid="dispense-page">
      <PageHeader
        title="Dispense counter"
        subtitle="Pick from batches, print labels, hand over to patients."
      />

      <div className="max-w-[1500px] mx-auto px-8 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {LANES.map((lane) => (
            <div key={lane.key} data-testid={`lane-${lane.key}`} className="flex flex-col">
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className={classNames("h-2 w-2 rounded-full", {
                    "bg-emerald-500": lane.key === "ready_to_dispense",
                    "bg-violet-500":  lane.key === "dispensing",
                    "bg-teal-500":    lane.key === "dispensed",
                  })} />
                  <h3 className="font-display text-[16px] text-[hsl(var(--ink))]">{lane.label}</h3>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums" data-testid={`lane-count-${lane.key}`}>
                  {grouped[lane.key].length}
                </span>
              </div>
              <div
                className={classNames(
                  "pharm-card p-3 flex-1 min-h-[60vh] border-t-2 space-y-2.5",
                  lane.color,
                )}
              >
                {grouped[lane.key].length === 0 && (
                  <div className="text-center text-[12px] text-muted-foreground/70 py-8">Nothing here</div>
                )}
                {grouped[lane.key].map((rx, idx) => {
                  const patient = ph.getPatient(rx.patientId);
                  return (
                    <article
                      key={rx.id}
                      data-testid={`dispense-card-${lane.key}-${idx}`}
                      className="rounded-md border border-border/70 bg-card p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-[hsl(var(--ink))] truncate">{patient?.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{patient?.mrn} · {rx.id.toUpperCase()}</div>
                        </div>
                        <PriorityBadge priority={rx.priority} />
                      </div>
                      <div className="mt-2 text-[13px] text-[hsl(var(--ink))]/90">
                        {rx.items[0].medicationName} · {rx.items[0].dosage}
                        {rx.items.length > 1 && <span className="ml-1 text-[11px] text-muted-foreground">+{rx.items.length - 1}</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{rx.items[0].frequency} · qty {rx.items[0].quantity}</div>

                      <div className="mt-3 flex items-center gap-1.5">
                        {lane.key === "ready_to_dispense" && (
                          <button
                            data-testid={`start-dispense-${rx.id}`}
                            onClick={() => ph.startDispensing(rx.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))] transition-colors"
                          >
                            Start <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                        {lane.key === "dispensing" && (
                          <>
                            <button
                              data-testid={`label-${rx.id}`}
                              onClick={() => setLabelPreview(rx.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--paper-200))]/60 transition-colors"
                              title="Preview label"
                            >
                              <Tag className="h-3 w-3" /> Label
                            </button>
                            <button
                              data-testid={`complete-${rx.id}`}
                              onClick={() => ph.completeDispense(rx.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))] transition-colors"
                            >
                              Dispensed
                            </button>
                          </>
                        )}
                        {lane.key === "dispensed" && (
                          <button
                            data-testid={`collected-${rx.id}`}
                            onClick={() => ph.markCollected(rx.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))] transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Collected
                          </button>
                        )}
                        <button
                          data-testid={`open-${rx.id}`}
                          onClick={() => setOpenRx(rx.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60 transition-colors"
                        >
                          Open
                        </button>
                      </div>

                      {/* Stock indicator */}
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Boxes className="h-3 w-3" />
                        <StockChip drugId={rx.items[0].drugId} need={rx.items[0].quantity} />
                        <span className="ml-auto">{fmt.relative(rx.createdAt)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openRx && <PrescriptionDrawer rxId={openRx} onClose={() => setOpenRx(null)} />}

      {labelPreview && (
        <LabelPreview rxId={labelPreview} onClose={() => setLabelPreview(null)} />
      )}
    </div>
  );
}

function StockChip({ drugId, need }) {
  const ph = usePharmacy();
  const onHand = ph.drugOnHand(drugId);
  const short = onHand < need;
  return (
    <span className={classNames("font-mono", short ? "text-amber-700" : "text-emerald-700/80")}>
      {onHand} on hand{short ? " · short" : ""}
    </span>
  );
}

function LabelPreview({ rxId, onClose }) {
  const ph = usePharmacy();
  const rx = ph.prescriptions.find((r) => r.id === rxId);
  if (!rx) return null;
  const p = ph.getPatient(rx.patientId);
  const item = rx.items[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" data-testid="label-preview">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[420px] p-0 overflow-hidden animate-rise">
        <div className="px-5 py-3 border-b border-border/70 flex items-center justify-between bg-[hsl(var(--paper-100))]/60">
          <div className="font-display text-[14px]">Label preview</div>
          <button onClick={onClose} data-testid="label-close" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 bg-white border-2 border-dashed border-[hsl(var(--sage-300))]/60 m-5 rounded-md font-mono text-[12px] leading-relaxed">
          <div className="font-display text-[16px] font-medium mb-1">Oakhaven Pharmacy</div>
          <div className="text-[10px] text-muted-foreground mb-3">Rx {rx.id.toUpperCase()} · {fmt.date(new Date().toISOString())}</div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div><span className="text-muted-foreground">Patient:</span> {p?.name}</div>
          <div><span className="text-muted-foreground">MRN:</span> {p?.mrn}</div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div className="font-bold">{item.medicationName} {item.dosage}</div>
          <div>Qty: {item.quantity} · {item.frequency}</div>
          <div className="mt-1 text-[11px]">{item.instructions}</div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div className="text-[10px] text-muted-foreground">
            Prescribed by {ph.getStaff(rx.prescribedByStaffId)?.name}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/70 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Close</button>
          <button
            data-testid="label-print"
            onClick={() => { window.print(); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--sage-700))]"
          >
            <Printer className="h-3.5 w-3.5" /> Print (mock)
          </button>
        </div>
      </div>
    </div>
  );
}
