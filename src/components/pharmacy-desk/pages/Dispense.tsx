import { useMemo, useState } from "react";
import {
  usePharmacyStore,
  getPatient,
  fefoBatch,
  availableQty,
  formatRelative,
} from "@/lib/pharmacy-desk/store";
import {
  SectionLabel,
  RxStatusPill,
  PriorityPill,
  LocationChip,
  PickPath,
  EmptyState,
} from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Package, Printer, CheckCircle, MapPin, ScanLine } from "lucide-react";

export default function Dispense() {
  const { prescriptions, patients, batches, findDrug, pickLine, completeDispense, markCollected, startDispense } = usePharmacyStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [counseling, setCounseling] = useState("");
  const [witness, setWitness] = useState("");

  const queue = useMemo(
    () =>
      prescriptions.filter((r) =>
        ["ready_to_dispense", "dispensing", "ready_pickup"].includes(r.status),
      ),
    [prescriptions],
  );

  const selected = queue.find((r) => r.id === selectedId) ?? queue[0];
  const patient = selected && getPatient(selected, patients);
  const hasControlled = selected?.lines.some((l) => findDrug(l.drug_id)?.controlled_schedule);

  function printLabel() {
    if (!selected || !patient) return;
    const html = `<html><head><title>Label ${selected.bag_id || selected.rx_number}</title>
      <style>body{font-family:'IBM Plex Mono',monospace;padding:1rem;}
      .label{border:2px solid #1a2924;padding:1rem;width:360px;}
      h3{margin:0 0 8px;font-size:14px;}
      .row{font-size:11px;margin:4px 0;display:flex;justify-content:space-between;}
      </style></head><body><div class="label">
      <h3>MEDORA PHARMACY · DISPENSE LABEL</h3>
      <div class="row"><span>Patient</span><b>${patient.name}</b></div>
      <div class="row"><span>MRN</span><b>${patient.mrn}</b></div>
      <div class="row"><span>Rx</span><b>${selected.rx_number}</b></div>
      <div class="row"><span>Bag</span><b>${selected.bag_id || "Pending"}</b></div>
      </div><script>window.print();</script></body></html>`;
    const w = window.open("", "_blank", "width=420,height=560");
    if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <div className="space-y-6" data-testid="dispense-counter">
      <SectionLabel action={
        <Button variant="outline" size="sm" className="border-ink-200">
          <Package className="mr-1.5 h-3.5 w-3.5" /> {queue.length} in queue
        </Button>
      }>
        Dispense counter
      </SectionLabel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface lg:col-span-1">
          <div className="border-b border-ink-200 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-400">
            Pick queue
          </div>
          <div className="divide-y divide-ink-100">
            {queue.length === 0 ? (
              <EmptyState icon={Package} title="Queue empty" hint="Accept prescriptions from inbox first." />
            ) : (
              queue.map((rx) => {
                const p = getPatient(rx, patients);
                return (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => setSelectedId(rx.id)}
                    className={`w-full px-4 py-3 text-left transition ${selected?.id === rx.id ? "bg-mustard-soft/50" : "hover:bg-stone-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-medium">{rx.rx_number}</span>
                      <PriorityPill priority={rx.priority} />
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-600">{p?.name}</div>
                    <RxStatusPill status={rx.status} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="surface lg:col-span-2">
          {!selected ? (
            <EmptyState icon={Package} title="Select a prescription" hint="Choose from the pick queue." />
          ) : (
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-[20px] font-semibold text-ink-900">{selected.rx_number}</h3>
                  <p className="text-[13px] text-ink-600">{patient?.name} · {patient?.mrn}</p>
                  {selected.bag_id && <p className="mt-1 font-mono text-[12px] text-mustard">Bag {selected.bag_id}</p>}
                </div>
                <RxStatusPill status={selected.status} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-ink-200 bg-stone-50 px-3 py-2">
                <ScanLine className="h-4 w-4 text-ink-400" />
                <input placeholder="Scan barcode or enter SKU…" className="flex-1 bg-transparent text-[13px] outline-none" />
              </div>

              <div className="mt-6 space-y-4">
                {selected.lines.map((line, idx) => {
                  const drug = findDrug(line.drug_id);
                  if (!drug) return null;
                  const drugBatches = batches.filter((b) => b.drug_id === line.drug_id);
                  const fefo = fefoBatch(drugBatches);
                  const remaining = line.qty_prescribed - line.qty_dispensed;
                  const picked = line.qty_dispensed > 0;

                  return (
                    <div key={line.id} className="rounded-lg border border-ink-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-ink-400">Step {idx + 1}</span>
                          <div className="font-medium text-ink-900">{drug.generic_name} {drug.strength}</div>
                          <div className="text-[12px] text-ink-600">{line.sig}</div>
                        </div>
                        <span className="font-mono text-[13px]">{line.qty_dispensed}/{line.qty_prescribed}</span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-mustard" />
                        <LocationChip location={drug.location} size="md" />
                      </div>
                      <div className="mt-2"><PickPath location={drug.location} /></div>

                      {fefo && (
                        <div className="mt-2 rounded-md bg-sage-soft/40 px-3 py-2 text-[12px] text-ink-600">
                          <strong className="text-sage">FEFO:</strong> Lot {fefo.lot} · Exp {new Date(fefo.expiry).toLocaleDateString()} · Avail {availableQty(drugBatches)}
                        </div>
                      )}

                      {selected.status === "dispensing" && remaining > 0 && fefo && (
                        <Button
                          size="sm"
                          className="btn-primary mt-3"
                          onClick={() => pickLine(selected.id, line.id, fefo.id, remaining)}
                        >
                          Pick {remaining} from {drug.location.location_code}
                        </Button>
                      )}
                      {picked && <div className="mt-2 text-[11px] text-sage">✓ Picked batch {line.pick_batch_id}</div>}
                    </div>
                  );
                })}
              </div>

              {selected.status === "dispensing" && (
                <div className="mt-6 space-y-3">
                  <label className="block text-[12px] font-medium text-ink-600">Counseling notes</label>
                  <Textarea value={counseling} onChange={(e) => setCounseling(e.target.value)} placeholder="Take with food, finish full course…" className="border-ink-200" />
                  {hasControlled && (
                    <div>
                      <label className="block text-[12px] font-medium text-plum">Witness (controlled substance) *</label>
                      <input
                        value={witness}
                        onChange={(e) => setWitness(e.target.value)}
                        placeholder="Witness name & ID"
                        className="mt-1 w-full rounded-md border border-plum/30 bg-plum-soft/20 px-3 py-2 text-[13px]"
                        data-testid="dispense-witness"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="btn-primary"
                      disabled={hasControlled && !witness.trim()}
                      onClick={() => completeDispense(selected.id, counseling, witness || undefined)}
                    >
                      <CheckCircle className="mr-1.5 h-4 w-4" /> Complete dispense & bag
                    </Button>
                    <Button variant="outline" className="border-ink-200" onClick={printLabel}>
                      <Printer className="mr-1.5 h-4 w-4" /> Print label
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === "ready_pickup" && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button className="btn-primary" onClick={() => markCollected(selected.id)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Confirm patient collected
                  </Button>
                  <Button variant="outline" className="border-ink-200" onClick={printLabel}>
                    <Printer className="mr-1.5 h-4 w-4" /> Reprint label
                  </Button>
                  <span className="text-[12px] text-ink-400 self-center">Ready {formatRelative(selected.dispensed_at)}</span>
                </div>
              )}

              {selected.status === "ready_to_dispense" && (
                <Button className="btn-primary mt-6" onClick={() => startDispense(selected.id)}>
                  Start picking
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
