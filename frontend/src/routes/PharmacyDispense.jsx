import React, { useMemo, useState, useEffect } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/pharmacy-desk/StatusBadge";
import LocationChip from "@/components/pharmacy-desk/LocationChip";
import PrescriptionDrawer from "@/components/pharmacy-desk/PrescriptionDrawer";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import { Printer, Tag, ArrowRight, CheckCircle2, Check, MapPin, ScanBarcode, X } from "lucide-react";

const LANES = [
  { key: "ready_to_dispense", label: "Cleared · ready",   color: "border-emerald-300" },
  { key: "dispensing",        label: "Picking & checking",color: "border-violet-300"  },
  { key: "dispensed",         label: "Ready for pickup",  color: "border-teal-300"    },
];

export default function Dispense() {
  const ph = usePharmacy();
  const [openRx, setOpenRx] = useState(null);
  const [labelRxId, setLabelRxId] = useState(null);
  const [pickRxId, setPickRxId] = useState(null);

  const grouped = useMemo(() => {
    const out = { ready_to_dispense: [], dispensing: [], dispensed: [] };
    ph.prescriptions.forEach((rx) => { if (out[rx.status]) out[rx.status].push(rx); });
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
        subtitle="Pick from FEFO batches, scan, verify, label, bag and hand over."
      />

      <div className="max-w-[1600px] mx-auto px-8 py-7">
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
              <div className={classNames("pharm-card p-3 flex-1 min-h-[60vh] border-t-2 space-y-2.5", lane.color)}>
                {grouped[lane.key].length === 0 && (
                  <div className="text-center text-[12px] text-muted-foreground/70 py-8">Nothing here</div>
                )}
                {grouped[lane.key].map((rx, idx) => {
                  const patient = ph.getPatient(rx.patientId);
                  const total = rx.items.length;
                  return (
                    <article key={rx.id} data-testid={`dispense-card-${lane.key}-${idx}`} className="rounded-md border border-border/70 bg-card p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-[hsl(var(--ink))] truncate">{patient?.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{patient?.mrn} · {(rx.rxNumber || rx.id).toUpperCase()}</div>
                        </div>
                        <PriorityBadge priority={rx.priority} />
                      </div>
                      <ul className="mt-2 space-y-1">
                        {rx.items.slice(0, 3).map((item, ii) => {
                          const drug = ph.getDrug(item.drugId);
                          return (
                            <li key={ii} className="flex items-center justify-between gap-2 text-[12px]">
                              <span className="truncate">
                                <span className="text-[hsl(var(--ink))]/90">{item.medicationName}</span>
                                <span className="text-muted-foreground"> · {item.dosage} × {item.quantity}</span>
                              </span>
                              {drug && <LocationChip location={drug.location} compact />}
                            </li>
                          );
                        })}
                        {total > 3 && <li className="text-[11px] text-muted-foreground">+ {total - 3} more line{total - 3 > 1 ? "s" : ""}</li>}
                      </ul>

                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {lane.key === "ready_to_dispense" && (
                          <button
                            data-testid={`start-dispense-${rx.id}`}
                            onClick={() => { ph.startDispensing(rx.id); setPickRxId(rx.id); }}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))]"
                          >
                            Start pick <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                        {lane.key === "dispensing" && (
                          <>
                            <button
                              data-testid={`open-pick-${rx.id}`}
                              onClick={() => setPickRxId(rx.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))]"
                            >
                              <ScanBarcode className="h-3 w-3" /> Pick path
                            </button>
                            <button
                              data-testid={`label-${rx.id}`}
                              onClick={() => setLabelRxId(rx.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--paper-200))]/60"
                              title="Preview label"
                            >
                              <Tag className="h-3 w-3" /> Label
                            </button>
                          </>
                        )}
                        {lane.key === "dispensed" && (
                          <>
                            <button
                              data-testid={`label-${rx.id}`}
                              onClick={() => setLabelRxId(rx.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--paper-200))]/60"
                            >
                              <Tag className="h-3 w-3" /> Label
                            </button>
                            <button
                              data-testid={`collected-${rx.id}`}
                              onClick={() => ph.markCollected(rx.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))]"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Collected
                            </button>
                          </>
                        )}
                        <button
                          data-testid={`open-rx-${rx.id}`}
                          onClick={() => setOpenRx(rx.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60"
                        >
                          Open Rx
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center text-[10px] text-muted-foreground">
                        <span>{total} line{total > 1 ? "s" : ""}</span>
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
      {labelRxId && <LabelPreview rxId={labelRxId} onClose={() => setLabelRxId(null)} />}
      {pickRxId && <PickPathDialog rxId={pickRxId} onClose={() => setPickRxId(null)} />}
    </div>
  );
}

/* ----------------------- Pick path & multi-batch dispense ----------------------- */

function PickPathDialog({ rxId, onClose }) {
  const ph = usePharmacy();
  const rx = ph.prescriptions.find((r) => r.id === rxId);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState(() =>
    rx?.items.map((it) => {
      const { plan } = ph.planFEFO(it.drugId, it.quantity);
      return { drugId: it.drugId, lots: plan.map((p) => ({ lot: p.lot, take: p.take, picked: false })) };
    }) || []
  );
  const [scanInput, setScanInput] = useState("");
  const [partialAllowed, setPartialAllowed] = useState(false);

  useEffect(() => { setStep(0); setScanInput(""); }, [rxId]);

  if (!rx) return null;

  const item = rx.items[step];
  const drug = ph.getDrug(item.drugId);
  const itemPicks = picks[step]?.lots || [];
  const itemDone = itemPicks.every((l) => l.picked);
  const allDone = picks.every((p) => p.lots.every((l) => l.picked));

  const togglePick = (lotIdx, picked) => {
    setPicks((ps) => ps.map((p, i) => i === step ? {
      ...p,
      lots: p.lots.map((l, j) => j === lotIdx ? { ...l, picked } : l),
    } : p));
  };

  const onScan = () => {
    const txt = scanInput.trim().toUpperCase();
    const idx = itemPicks.findIndex((l) => l.lot.toUpperCase() === txt);
    if (idx >= 0) {
      togglePick(idx, true);
      setScanInput("");
    }
  };

  const onComplete = () => {
    const payload = picks.map((p) => ({
      drugId: p.drugId,
      lots: p.lots.filter((l) => l.picked).map(({ lot, take }) => ({ lot, take })),
    }));
    ph.completeDispense(rx.id, { picks: payload, partial: partialAllowed });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" data-testid="pick-path-dialog">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[760px] p-0 overflow-hidden animate-rise flex flex-col max-h-[90vh]">
        <header className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-[hsl(var(--paper-100))]/60">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[hsl(var(--sage-500))]" />
              <h2 className="font-display text-[18px]">Pick path · {(rx.rxNumber || rx.id).toUpperCase()}</h2>
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">Step {step + 1} of {rx.items.length}</div>
          </div>
          <button onClick={onClose} data-testid="pick-close" className="rounded-md border border-border/70 bg-card p-1.5 hover:bg-[hsl(var(--paper-200))]/60">
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Step indicator */}
        <div className="px-6 pt-3" data-testid="pick-progress">
          <div className="flex items-center gap-1">
            {rx.items.map((_, i) => {
              const done = picks[i]?.lots?.every((l) => l.picked);
              return (
                <div key={i} className={classNames(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i === step ? "bg-[hsl(var(--sage-500))]" : done ? "bg-emerald-400" : "bg-border",
                )} />
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="pharm-card p-4 bg-[hsl(var(--paper-100))]/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Next medicine</div>
                <div className="font-display text-[22px] text-[hsl(var(--ink))] leading-tight mt-0.5">
                  {item.medicationName} <span className="text-muted-foreground text-[15px]">· {item.dosage}</span>
                </div>
                <div className="text-[12px] text-muted-foreground">{item.frequency} · qty {item.quantity}</div>
                <div className="mt-2"><LocationChip location={drug?.location} /></div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  Go to <strong>Aisle {drug?.location.aisle} → Rack {drug?.location.rack} → Tray T{String(drug?.location.tray).padStart(2, "0")} → Slot {drug?.location.slot}</strong>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">On hand</div>
                <div className="font-display text-[22px] tabular-nums">{ph.drugOnHand(item.drugId)}</div>
              </div>
            </div>
          </div>

          {/* Scan + pick batches */}
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Pick batches (FEFO)</div>
            <ul className="space-y-2">
              {itemPicks.length === 0 && (
                <li className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  No stock available — partial dispense will result in 0 picked.
                </li>
              )}
              {itemPicks.map((lot, lotIdx) => (
                <li key={lot.lot} data-testid={`pick-lot-${lot.lot}`} className={classNames(
                  "flex items-center gap-3 rounded-md border bg-card px-3 py-2",
                  lot.picked ? "border-emerald-300 bg-emerald-50/40" : "border-border/70",
                )}>
                  <input
                    type="checkbox"
                    checked={lot.picked}
                    onChange={(e) => togglePick(lotIdx, e.target.checked)}
                    data-testid={`pick-checkbox-${lot.lot}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[12px]">{lot.lot}</div>
                    <div className="text-[11px] text-muted-foreground">Take {lot.take} unit{lot.take > 1 ? "s" : ""}</div>
                  </div>
                  {lot.picked && <Check className="h-4 w-4 text-emerald-700" />}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onScan()}
                placeholder="Scan lot (e.g. AMX-7A21) and press Enter"
                data-testid="pick-scan-input"
                className="pharm-input"
              />
              <button onClick={onScan} data-testid="pick-scan-btn" className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-[12px] hover:bg-[hsl(var(--paper-200))]/60">
                <ScanBarcode className="h-3.5 w-3.5" /> Scan
              </button>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-border/70 bg-[hsl(var(--paper-100))]/40 flex items-center justify-between gap-2">
          <label className="text-[12px] flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" data-testid="allow-partial" checked={partialAllowed} onChange={(e) => setPartialAllowed(e.target.checked)} />
            Allow partial
          </label>
          <div className="flex gap-2">
            <button
              data-testid="pick-prev"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-3 py-2 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60 disabled:opacity-40"
            >
              Prev
            </button>
            {step < rx.items.length - 1 ? (
              <button
                data-testid="pick-next"
                onClick={() => setStep((s) => Math.min(rx.items.length - 1, s + 1))}
                disabled={!itemDone && !partialAllowed}
                className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))] disabled:opacity-50"
              >
                Next item <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                data-testid="pick-complete"
                onClick={onComplete}
                disabled={!allDone && !partialAllowed}
                className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Complete dispense
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function LabelPreview({ rxId, onClose }) {
  const ph = usePharmacy();
  const rx = ph.prescriptions.find((r) => r.id === rxId);
  if (!rx) return null;
  const p = ph.getPatient(rx.patientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" data-testid="label-preview">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[460px] p-0 overflow-hidden animate-rise">
        <div className="px-5 py-3 border-b border-border/70 flex items-center justify-between bg-[hsl(var(--paper-100))]/60">
          <div className="font-display text-[14px]">Label preview (multi-item)</div>
          <button onClick={onClose} data-testid="label-close" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 bg-white border-2 border-dashed border-[hsl(var(--sage-300))]/60 m-5 rounded-md font-mono text-[11px] leading-relaxed">
          <div className="font-display text-[16px] font-medium mb-1">Oakhaven Pharmacy</div>
          <div className="text-[10px] text-muted-foreground mb-3">{(rx.rxNumber || rx.id).toUpperCase()} · {fmt.date(new Date().toISOString())}</div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          <div><span className="text-muted-foreground">Patient:</span> {p?.name}</div>
          <div><span className="text-muted-foreground">MRN:</span> {p?.mrn}</div>
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          {rx.items.map((item, i) => (
            <div key={i} className="mb-2">
              <div className="font-bold">{i + 1}. {item.medicationName} {item.dosage}</div>
              <div>Qty: {item.quantity} · {item.frequency}</div>
              <div className="text-[10px]">{item.instructions}</div>
            </div>
          ))}
          <div className="border-t border-dashed border-muted-foreground/30 my-2" />
          {rx.labelBatchLots && (
            <div className="text-[10px] text-muted-foreground">Batches: {rx.labelBatchLots.join(", ")}</div>
          )}
          <div className="text-[10px] text-muted-foreground">
            Prescribed by {ph.getStaff(rx.prescribedByStaffId)?.name || "Walk-in counter"}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/70 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Close</button>
          <button data-testid="label-print" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--sage-700))]">
            <Printer className="h-3.5 w-3.5" /> Print (mock)
          </button>
        </div>
      </div>
    </div>
  );
}
