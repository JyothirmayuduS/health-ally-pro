import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import LocationChip from "@/components/pharmacy-desk/LocationChip";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import {
  Search, PackagePlus, Plus, Minus, AlertTriangle, Trash2, Move, Tag, ShieldCheck, Snowflake, Lock, PlusCircle, X,
} from "lucide-react";

export default function Inventory() {
  const ph = usePharmacy();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [params] = useSearchParams();
  const focusId = params.get("focus");

  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ lot: "", qty: 100, expiry: "2027-06-01" });
  const [transferTarget, setTransferTarget] = useState(null);
  const [addDrugOpen, setAddDrugOpen] = useState(false);

  const refs = useRef({});

  // Scroll to focused drug if linked from search / map
  useEffect(() => {
    if (focusId && refs.current[focusId]) {
      refs.current[focusId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ph.inventory.filter((d) => {
      const onHand = d.batches.reduce((a, b) => a + b.qty, 0);
      const nearest = [...d.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];
      const days = nearest ? fmt.daysUntil(nearest.expiry) : Infinity;
      if (filter === "low"        && onHand > d.reorderLevel) return false;
      if (filter === "expiring"   && days >= 90) return false;
      if (filter === "out"        && onHand > 0) return false;
      if (filter === "controlled" && !d.controlled) return false;
      if (filter === "fridge"     && d.location.zone !== "COLD_CHAIN") return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.sku.toLowerCase().includes(q) || (d.supplier || "").toLowerCase().includes(q)
        || (d.barcode || "").includes(q) || (d.location?.code || "").toLowerCase().includes(q);
    });
  }, [ph.inventory, query, filter]);

  const filters = [
    { key: "all",        label: "All" },
    { key: "low",        label: `Low (${ph.counts.lowStock})` },
    { key: "expiring",   label: `Expiring < 90d (${ph.counts.expiringSoon})` },
    { key: "out",        label: `Out (${ph.counts.outOfStock})` },
    { key: "controlled", label: `Controlled (${ph.counts.controlledDrugs})` },
    { key: "fridge",     label: "Cold chain" },
  ];

  return (
    <div data-testid="inventory-page">
      <PageHeader
        title="Inventory"
        subtitle="Drug master, batches, locations, suppliers — track every movement."
        actions={
          <button
            onClick={() => setAddDrugOpen(true)}
            data-testid="add-drug-btn"
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))]"
          >
            <PlusCircle className="h-4 w-4" /> Add drug
          </button>
        }
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap" data-testid="inv-filters">
            {filters.map((f) => (
              <button key={f.key} data-testid={`inv-filter-${f.key}`} onClick={() => setFilter(f.key)}
                className={classNames(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  filter === f.key ? "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))]" : "text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60",
                )}>{f.label}</button>
            ))}
          </div>
          <div className="relative" data-testid="inv-search">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input data-testid="inv-search-input" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, SKU, barcode, location…" className="pharm-input pl-9 w-[300px]" />
          </div>
        </div>
      </PageHeader>

      <div className="max-w-[1500px] mx-auto px-8 py-7 space-y-3" data-testid="inv-list">
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-12">No drugs match.</div>}
        {filtered.map((drug, idx) => {
          const onHand = drug.batches.reduce((a, b) => a + b.qty, 0);
          const low = onHand <= drug.reorderLevel;
          const out = onHand === 0;
          const nearest = [...drug.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];
          const daysToExpiry = nearest ? fmt.daysUntil(nearest.expiry) : null;
          const expiringSoon = daysToExpiry !== null && daysToExpiry < 90 && onHand > 0;
          const focused = focusId === drug.id;

          return (
            <article
              key={drug.id}
              data-testid={`drug-row-${idx}`}
              ref={(el) => { if (el) refs.current[drug.id] = el; }}
              className={classNames("pharm-card p-4", focused && "ring-2 ring-[hsl(var(--sage-500))] animate-rise")}
            >
              <div className="flex items-start gap-5 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-[18px] text-[hsl(var(--ink))]">
                      {drug.name} <span className="text-muted-foreground text-[14px]">· {drug.strength}</span>
                    </h3>
                    <span className="pharm-pill bg-[hsl(var(--paper-100))] border-border/70 text-muted-foreground">{drug.form}</span>
                    {drug.rxRequired && <span className="pharm-pill bg-sky-50 border-sky-200 text-sky-800"><ShieldCheck className="h-3 w-3" />Rx</span>}
                    {drug.flags?.includes("otc") && <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800"><Tag className="h-3 w-3" />OTC</span>}
                    {drug.flags?.includes("fridge") && <span className="pharm-pill bg-sky-50 border-sky-200 text-sky-800"><Snowflake className="h-3 w-3" />Fridge</span>}
                    {drug.controlled && <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800"><Lock className="h-3 w-3" />Sch {drug.controlled}</span>}
                    {drug.flags?.includes("high-alert") && <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800">High-alert</span>}
                    {out && <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800"><AlertTriangle className="h-3 w-3" />Out</span>}
                    {!out && low && <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800"><AlertTriangle className="h-3 w-3" />Low</span>}
                    {expiringSoon && <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800">Expiring {daysToExpiry}d</span>}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-1 font-mono">
                    {drug.sku} · {drug.barcode || "no barcode"} · supplier {drug.supplier}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <LocationChip location={drug.location} />
                    <button
                      data-testid={`transfer-${drug.id}`}
                      onClick={() => setTransferTarget(drug.id)}
                      className="text-[11px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Move className="h-3 w-3" /> Transfer
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">On hand</div>
                  <div className={classNames("font-display text-[28px] leading-none tabular-nums", out ? "text-rose-700" : low ? "text-amber-700" : "text-[hsl(var(--ink))]")}>
                    {onHand}
                  </div>
                  <div className="text-[11px] text-muted-foreground">reorder @ {drug.reorderLevel} · ${(drug.unitPrice || 0).toFixed(2)}/u</div>
                </div>

                <button
                  data-testid={`receive-${drug.id}`}
                  onClick={() => { setReceiveTarget(drug.id); setReceiveForm({ lot: "", qty: 100, expiry: "2027-06-01" }); }}
                  className="self-start inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))] transition-colors"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> Receive
                </button>
              </div>

              <div className="mt-3 border-t border-border/60 pt-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Batches</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {drug.batches.length === 0 && <div className="text-[12px] text-muted-foreground italic">No batches recorded.</div>}
                  {drug.batches.map((b) => {
                    const d = fmt.daysUntil(b.expiry);
                    const expWarn = d !== null && d < 90;
                    return (
                      <div key={b.lot} className={classNames("rounded-md border bg-card px-3 py-2 flex items-center gap-3", expWarn ? "border-amber-200" : "border-border/70")}>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[12px] text-[hsl(var(--ink))]">{b.lot}</div>
                          <div className={classNames("text-[11px]", expWarn ? "text-amber-700" : "text-muted-foreground")}>
                            Exp {fmt.date(b.expiry)} {expWarn ? `· ${d}d` : ""}
                          </div>
                        </div>
                        <div className="text-right"><div className="font-display text-[16px] tabular-nums">{b.qty}</div></div>
                        <div className="flex flex-col gap-0.5">
                          <button data-testid={`inc-${drug.id}-${b.lot}`} onClick={() => ph.adjustStock(drug.id, b.lot, 10)}
                            className="rounded border border-border/70 bg-card p-0.5 hover:bg-[hsl(var(--paper-200))]/60" title="+10"><Plus className="h-3 w-3" /></button>
                          <button data-testid={`dec-${drug.id}-${b.lot}`} onClick={() => ph.adjustStock(drug.id, b.lot, -10)}
                            className="rounded border border-border/70 bg-card p-0.5 hover:bg-[hsl(var(--paper-200))]/60" title="-10"><Minus className="h-3 w-3" /></button>
                        </div>
                        <button data-testid={`quarantine-${drug.id}-${b.lot}`} onClick={() => ph.quarantineBatch(drug.id, b.lot)}
                          className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-700" title="Quarantine batch (set qty 0)">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {receiveTarget && <ReceiveModal drugId={receiveTarget} form={receiveForm} setForm={setReceiveForm} onClose={() => setReceiveTarget(null)} onConfirm={() => { ph.receiveStock(receiveTarget, { lot: receiveForm.lot, qty: receiveForm.qty, expiry: receiveForm.expiry }); setReceiveTarget(null); }} />}
      {transferTarget && <TransferModal drugId={transferTarget} onClose={() => setTransferTarget(null)} />}
      {addDrugOpen && <AddDrugModal onClose={() => setAddDrugOpen(false)} />}
    </div>
  );
}

function ReceiveModal({ drugId, form, setForm, onClose, onConfirm }) {
  const ph = usePharmacy();
  const drug = ph.inventory.find((d) => d.id === drugId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="receive-modal">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[420px] p-5 animate-rise">
        <h3 className="font-display text-[18px] mb-1">Receive stock</h3>
        <p className="text-[12px] text-muted-foreground mb-4">Adding a new batch to <strong>{drug?.name}</strong>.</p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Lot</label>
            <input data-testid="receive-lot" value={form.lot} onChange={(e) => setForm({ ...form, lot: e.target.value.toUpperCase() })} placeholder="e.g. AMX-8H22" className="pharm-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quantity</label>
              <input data-testid="receive-qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 0 })} className="pharm-input" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Expiry</label>
              <input data-testid="receive-expiry" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="pharm-input" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
          <button data-testid="receive-confirm" disabled={!form.lot || form.qty <= 0} onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--sage-700))] disabled:opacity-50 disabled:cursor-not-allowed">
            Add batch
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ drugId, onClose }) {
  const ph = usePharmacy();
  const drug = ph.inventory.find((d) => d.id === drugId);
  const [loc, setLoc] = useState(drug?.location || { zone: "MAIN", aisle: "A", rack: "A1", tray: 1, slot: 1 });

  if (!drug) return null;
  const allRacks = ph.storeLayout.flatMap((a) => a.racks.map((r) => ({ ...r, zone: a.zone, aisle: a.aisle })));
  const currentRack = allRacks.find((r) => r.rack === loc.rack);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="transfer-modal">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[460px] p-5 animate-rise">
        <h3 className="font-display text-[18px] mb-1">Transfer location</h3>
        <p className="text-[12px] text-muted-foreground mb-4">Moving <strong>{drug.name}</strong> to a new rack / tray / slot.</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Rack</label>
            <select data-testid="transfer-rack" value={loc.rack}
              onChange={(e) => {
                const r = allRacks.find((rr) => rr.rack === e.target.value);
                setLoc({ zone: r.zone, aisle: r.aisle, rack: r.rack, tray: 1, slot: 1 });
              }}
              className="pharm-input">
              {allRacks.map((r) => (
                <option key={r.rack} value={r.rack}>{r.zone} · {r.aisle} · {r.rack}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tray</label>
            <input data-testid="transfer-tray" type="number" min={1} max={currentRack?.trays || 6}
              value={loc.tray} onChange={(e) => setLoc({ ...loc, tray: Number(e.target.value) })}
              className="pharm-input" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Slot</label>
            <input data-testid="transfer-slot" type="number" min={1} max={currentRack?.slots || 6}
              value={loc.slot} onChange={(e) => setLoc({ ...loc, slot: Number(e.target.value) })}
              className="pharm-input" />
          </div>
          <div className="col-span-3 text-[12px] font-mono text-muted-foreground">
            New code → <span className="text-foreground">{loc.rack}-T{String(loc.tray).padStart(2, "0")}-S{loc.slot}</span>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
          <button data-testid="transfer-confirm" onClick={() => { ph.transferDrug(drug.id, loc); onClose(); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--sage-700))]">
            <Move className="h-3.5 w-3.5" /> Move drug
          </button>
        </div>
      </div>
    </div>
  );
}

function AddDrugModal({ onClose }) {
  const ph = usePharmacy();
  const [f, setF] = useState({
    name: "", generic: "", brand: "", form: "Tablet", strength: "", route: "PO",
    sku: "", barcode: "", rxRequired: true, controlled: "",
    rack: "A1", tray: 1, slot: 1,
    reorderLevel: 50, unitPrice: 0, supplier: "—",
    batch: { lot: "", qty: 0, expiry: "2027-06-01" },
  });
  const allRacks = ph.storeLayout.flatMap((a) => a.racks.map((r) => ({ ...r, zone: a.zone, aisle: a.aisle })));
  const rackInfo = allRacks.find((r) => r.rack === f.rack);

  const submit = () => {
    if (!f.name || !f.strength) return;
    ph.addDrug({
      name: f.name, generic: f.generic || f.name, brand: f.brand,
      form: f.form, strength: f.strength, route: f.route,
      sku: f.sku || f.name.replace(/\s+/g, "-").toUpperCase().slice(0, 10),
      barcode: f.barcode, rxRequired: f.rxRequired, controlled: f.controlled || null,
      location: { zone: rackInfo?.zone || "MAIN", aisle: rackInfo?.aisle || "A", rack: f.rack, tray: f.tray, slot: f.slot },
      reorderLevel: Number(f.reorderLevel) || 50, unitPrice: Number(f.unitPrice) || 0, supplier: f.supplier,
      batch: f.batch.lot ? { lot: f.batch.lot, qty: Number(f.batch.qty) || 0, expiry: f.batch.expiry } : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="add-drug-modal">
      <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative pharm-card w-full max-w-[640px] p-0 overflow-hidden animate-rise max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-[hsl(var(--paper-100))]/60">
          <h2 className="font-display text-[18px]">Add new drug</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *">
              <input data-testid="add-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="pharm-input" />
            </Field>
            <Field label="Generic">
              <input data-testid="add-generic" value={f.generic} onChange={(e) => setF({ ...f, generic: e.target.value })} className="pharm-input" />
            </Field>
            <Field label="Brand">
              <input data-testid="add-brand" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} className="pharm-input" />
            </Field>
            <Field label="Form">
              <select data-testid="add-form" value={f.form} onChange={(e) => setF({ ...f, form: e.target.value })} className="pharm-input">
                {["Tablet","Capsule","Syrup","Inhaler","Injection","Cream","Drops","Pen injector"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Strength *">
              <input data-testid="add-strength" value={f.strength} onChange={(e) => setF({ ...f, strength: e.target.value })} placeholder="500 mg" className="pharm-input" />
            </Field>
            <Field label="SKU">
              <input data-testid="add-sku" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value.toUpperCase() })} className="pharm-input" />
            </Field>
            <Field label="Barcode">
              <input data-testid="add-barcode" value={f.barcode} onChange={(e) => setF({ ...f, barcode: e.target.value })} className="pharm-input" />
            </Field>
            <Field label="Reorder level">
              <input data-testid="add-reorder" type="number" value={f.reorderLevel} onChange={(e) => setF({ ...f, reorderLevel: e.target.value })} className="pharm-input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Rack">
              <select data-testid="add-rack" value={f.rack} onChange={(e) => setF({ ...f, rack: e.target.value, tray: 1, slot: 1 })} className="pharm-input">
                {allRacks.map((r) => <option key={r.rack} value={r.rack}>{r.zone}·{r.aisle}·{r.rack}</option>)}
              </select>
            </Field>
            <Field label="Tray">
              <input data-testid="add-tray" type="number" min={1} max={rackInfo?.trays || 4} value={f.tray} onChange={(e) => setF({ ...f, tray: Number(e.target.value) })} className="pharm-input" />
            </Field>
            <Field label="Slot">
              <input data-testid="add-slot" type="number" min={1} max={rackInfo?.slots || 6} value={f.slot} onChange={(e) => setF({ ...f, slot: Number(e.target.value) })} className="pharm-input" />
            </Field>
          </div>

          <div className="pharm-card p-3 bg-[hsl(var(--paper-100))]/40">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Initial batch (optional)</div>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="Lot" data-testid="add-batch-lot" value={f.batch.lot} onChange={(e) => setF({ ...f, batch: { ...f.batch, lot: e.target.value.toUpperCase() } })} className="pharm-input" />
              <input placeholder="Qty" type="number" data-testid="add-batch-qty" value={f.batch.qty} onChange={(e) => setF({ ...f, batch: { ...f.batch, qty: e.target.value } })} className="pharm-input" />
              <input placeholder="Expiry" type="date" data-testid="add-batch-expiry" value={f.batch.expiry} onChange={(e) => setF({ ...f, batch: { ...f.batch, expiry: e.target.value } })} className="pharm-input" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px]">
            <input data-testid="add-rx-required" type="checkbox" checked={f.rxRequired} onChange={(e) => setF({ ...f, rxRequired: e.target.checked })} />
            Prescription required (Rx)
          </label>
        </div>
        <footer className="px-6 py-4 border-t border-border/70 bg-[hsl(var(--paper-100))]/40 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
          <button data-testid="add-drug-submit" onClick={submit} disabled={!f.name || !f.strength}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-4 py-2 text-sm hover:bg-[hsl(var(--sage-700))] disabled:opacity-50">
            <PlusCircle className="h-4 w-4" /> Add drug
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
