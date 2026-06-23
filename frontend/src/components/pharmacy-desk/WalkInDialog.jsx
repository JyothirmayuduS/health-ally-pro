import React, { useState } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import { X, UserPlus, Plus, Trash2, Send } from "lucide-react";

// Walk-in counter dialog — pharmacist creates an Rx without a doctor handoff.
// Supports multi-line, OTC (skip review) and Rx (requires review).
export default function WalkInDialog({ open, onClose, onCreated }) {
  const ph = usePharmacy();
  const [patientId, setPatientId] = useState(ph.patients[0]?.id || "");
  const [priority, setPriority] = useState("routine");
  const [skipReview, setSkipReview] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([newLine(ph.inventory[0])]);

  if (!open) return null;

  function newLine(drug) {
    return {
      drugId: drug?.id || "",
      medicationName: drug?.name || "",
      dosage: drug?.strength || "",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: 10,
      instructions: "Take as directed.",
    };
  }

  const updateLine = (idx, patch) => {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const updateDrug = (idx, drugId) => {
    const drug = ph.inventory.find((d) => d.id === drugId);
    if (!drug) return;
    updateLine(idx, { drugId, medicationName: drug.name, dosage: drug.strength });
  };

  const onAddLine = () => setLines((ls) => [...ls, newLine(ph.inventory[0])]);
  const onRemoveLine = (idx) => setLines((ls) => ls.length > 1 ? ls.filter((_, i) => i !== idx) : ls);

  const onSubmit = () => {
    const rx = ph.submitWalkInRx({
      patientId, priority, notes, skipReview,
      items: lines,
      refillsAllowed: 0,
    });
    onCreated?.(rx);
    onClose();
    // reset
    setLines([newLine(ph.inventory[0])]);
    setNotes("");
    setPriority("routine");
    setSkipReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" data-testid="walkin-dialog">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[760px] p-0 overflow-hidden animate-rise max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-[hsl(var(--paper-100))]/60">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[hsl(var(--sage-500))]" />
            <h2 className="font-display text-[18px]">Walk-in prescription</h2>
          </div>
          <button onClick={onClose} data-testid="walkin-close" className="rounded-md border border-border/70 bg-card p-1.5 hover:bg-[hsl(var(--paper-200))]/60">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient</label>
              <select data-testid="walkin-patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="pharm-input mt-1">
                {ph.patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Priority</label>
              <select data-testid="walkin-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="pharm-input mt-1">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent / STAT</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Lines</label>
              <button onClick={onAddLine} data-testid="walkin-add-line" className="text-[12px] inline-flex items-center gap-1 text-[hsl(var(--sage-500))] hover:underline">
                <Plus className="h-3 w-3" /> Add another medicine
              </button>
            </div>
            <ul className="space-y-3">
              {lines.map((line, idx) => (
                <li key={idx} className="pharm-card p-4" data-testid={`walkin-line-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Line {idx + 1}</div>
                    {lines.length > 1 && (
                      <button onClick={() => onRemoveLine(idx)} className="text-muted-foreground hover:text-rose-700" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <select
                        data-testid={`walkin-drug-${idx}`}
                        value={line.drugId}
                        onChange={(e) => updateDrug(idx, e.target.value)}
                        className="pharm-input"
                      >
                        {ph.inventory.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} · {d.strength} ({d.form})</option>
                        ))}
                      </select>
                    </div>
                    <input className="pharm-input" placeholder="Frequency" value={line.frequency} onChange={(e) => updateLine(idx, { frequency: e.target.value })} />
                    <input className="pharm-input" placeholder="Duration"  value={line.duration}  onChange={(e) => updateLine(idx, { duration: e.target.value })} />
                    <input className="pharm-input" type="number" placeholder="Quantity" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })} />
                    <input className="pharm-input" placeholder="Instructions" value={line.instructions} onChange={(e) => updateLine(idx, { instructions: e.target.value })} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</label>
            <input data-testid="walkin-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="pharm-input mt-1" placeholder="Optional notes" />
          </div>

          <label className="flex items-center gap-2 text-[13px]" data-testid="walkin-skip-review-label">
            <input type="checkbox" data-testid="walkin-skip-review" checked={skipReview} onChange={(e) => setSkipReview(e.target.checked)} />
            Counter sale / OTC — skip review, send straight to dispense queue
          </label>
        </div>

        <footer className="px-6 py-4 border-t border-border/70 bg-[hsl(var(--paper-100))]/40 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
          <button
            onClick={onSubmit}
            data-testid="walkin-submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--sage-700))]"
          >
            <Send className="h-4 w-4" /> Create Rx
          </button>
        </footer>
      </div>
    </div>
  );
}
