import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  usePharmacyStore,
  availableQty,
  isLowStock,
  fefoBatch,
} from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip, EmptyState } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Map, AlertTriangle, PackagePlus, BookOpen } from "lucide-react";
import { expiryStatus, zoneLabel } from "@/lib/pharmacy-desk/location";
import { fmtInr } from "@/lib/pharmacy-desk/billing";
import { fmtMargin, unitLabel } from "@/lib/pharmacy-desk/formulary";

export default function Inventory() {
  const { drugs, batches, movements, receiveStock } = usePharmacyStore();
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveDrugId, setReceiveDrugId] = useState("");
  const [lot, setLot] = useState("");
  const [expiry, setExpiry] = useState("");
  const [qty, setQty] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [poRef, setPoRef] = useState("");

  const selectedDrug = drugs.find((d) => d.id === receiveDrugId);

  const filtered = useMemo(() => {
    return drugs.filter((d) => {
      if (zoneFilter !== "all" && d.location.zone !== zoneFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return [d.generic_name, ...d.brand_names, d.sku, d.location.location_code].join(" ").toLowerCase().includes(q);
    });
  }, [drugs, query, zoneFilter]);

  function resetReceiveForm() {
    setLot("");
    setExpiry("");
    setQty("");
    setPurchaseCost("");
    setVendor("");
    setPoRef("");
    setReceiveDrugId("");
  }

  return (
    <div className="space-y-6">
      <SectionLabel action={
        <div className="flex gap-2">
          <Link to="/pharmacy/formulary" className="btn-outline !h-8 !px-3 !text-[12px]">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Formulary
          </Link>
          <Link to="/pharmacy/map" className="btn-outline !h-8 !px-3 !text-[12px]"><Map className="mr-1.5 h-3.5 w-3.5" /> Storage map</Link>
          <Button size="sm" className="btn-primary" onClick={() => setReceiveOpen(true)}><PackagePlus className="mr-1.5 h-3.5 w-3.5" /> Receive stock</Button>
        </div>
      }>
        Inventory
      </SectionLabel>

      <div className="surface flex flex-wrap gap-3 p-4">
        <Input placeholder="Search drug, SKU, location…" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-[240px] flex-1 border-ink-200 bg-white" />
        {(["all", "main", "cold", "controlled", "otc"] as const).map((z) => (
          <Button key={z} size="sm" variant={zoneFilter === z ? "default" : "outline"} className={zoneFilter === z ? "btn-primary" : "border-ink-200"} onClick={() => setZoneFilter(z)}>
            {z === "all" ? "All zones" : zoneLabel(z)}
          </Button>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
              <th className="px-4 py-3 text-left">Drug</th>
              <th className="px-4 py-3 text-right">Cost / sell</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">On hand</th>
              <th className="px-4 py-3 text-left">FEFO batch</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7}><EmptyState icon={Briefcase} title="No items" /></td></tr>
            )}
            {filtered.map((d) => {
              const drugBatches = batches.filter((b) => b.drug_id === d.id);
              const avail = availableQty(drugBatches);
              const fefo = fefoBatch(drugBatches);
              const low = isLowStock(d, drugBatches);
              const exp = fefo ? expiryStatus(fefo.expiry) : null;
              return (
                <tr key={d.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{d.generic_name} {d.strength}</div>
                    <div className="font-mono text-[11px] text-ink-400">{d.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-mono text-[11px] text-ink-500">{fmtInr(d.purchase_cost ?? 0)} cost</div>
                    <div className="font-mono text-[12px] font-semibold text-sage">{fmtInr(d.unit_price)} sell</div>
                    <div className="text-[10px] text-ink-400">{fmtMargin(d)} · {unitLabel(d.form)}</div>
                  </td>
                  <td className="px-4 py-3"><LocationChip location={d.location} /></td>
                  <td className="px-4 py-3 font-mono">{avail} <span className="text-ink-400">/ reorder {d.reorder_level}</span></td>
                  <td className="px-4 py-3 text-[12px]">
                    {fefo ? (
                      <>
                        {fefo.lot} · <span className={exp?.level === "critical" ? "text-clay" : ""}>{exp?.label}</span>
                        {fefo.purchase_cost_per_unit != null && (
                          <div className="font-mono text-[10px] text-ink-400">@ {fmtInr(fefo.purchase_cost_per_unit)}</div>
                        )}
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {low ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-clay"><AlertTriangle className="h-3 w-3" /> Low</span>
                    ) : (
                      <span className="text-[11px] text-sage">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/pharmacy/search" search={{ q: d.generic_name }} className="btn-outline !h-7 !px-2 !text-[11px]">Lookup</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="surface">
        <div className="border-b border-ink-200 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-400">Recent movements</div>
        <div className="divide-y divide-ink-100">
          {movements.slice(0, 8).map((m) => {
            const drug = drugs.find((d) => d.id === m.drug_id);
            return (
              <div key={m.id} className="flex items-center justify-between px-5 py-2.5 text-[12px]">
                <span className="font-medium text-ink-900">{drug?.generic_name}</span>
                <span className="font-mono text-ink-500">{m.type} {m.qty > 0 ? "+" : ""}{m.qty}</span>
                <span className="max-w-[200px] truncate text-ink-400">{m.note ?? m.reference}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-md border-ink-200">
          <DialogHeader><DialogTitle>Receive stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Drug</Label>
            <select
              className="h-10 w-full rounded-md border border-ink-200 px-3 text-[13px]"
              value={receiveDrugId}
              onChange={(e) => {
                setReceiveDrugId(e.target.value);
                const d = drugs.find((x) => x.id === e.target.value);
                if (d?.purchase_cost != null) setPurchaseCost(String(d.purchase_cost));
              }}
            >
              <option value="">Select…</option>
              {drugs.map((d) => <option key={d.id} value={d.id}>{d.generic_name} {d.strength}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lot number</Label>
                <Input value={lot} onChange={(e) => setLot(e.target.value)} className="border-ink-200" />
              </div>
              <div>
                <Label>Expiry</Label>
                <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="border-ink-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity received</Label>
                <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="border-ink-200" />
              </div>
              <div>
                <Label>Purchase cost {selectedDrug ? unitLabel(selectedDrug.form) : "per unit"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="From vendor invoice"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="border-ink-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Apollo Distributors" className="border-ink-200" />
              </div>
              <div>
                <Label>PO reference</Label>
                <Input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="PO-4421" className="border-ink-200" />
              </div>
            </div>
            {selectedDrug && (
              <p className="rounded-md bg-stone-50 px-3 py-2 text-[12px] text-ink-600">
                Formulary sell price: <strong className="text-sage">{fmtInr(selectedDrug.unit_price)}</strong> {unitLabel(selectedDrug.form)}
                {" · "}Pack {selectedDrug.pack_size} @ MRP {fmtInr(selectedDrug.pack_mrp ?? 0)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setReceiveOpen(false); resetReceiveForm(); }}>Cancel</Button>
            <Button
              className="btn-primary"
              disabled={!receiveDrugId || !lot || !expiry || !qty}
              onClick={() => {
                receiveStock(receiveDrugId, lot, expiry, Number(qty), {
                  purchaseCostPerUnit: purchaseCost ? Number(purchaseCost) : undefined,
                  vendor: vendor || undefined,
                  poReference: poRef || undefined,
                });
                setReceiveOpen(false);
                resetReceiveForm();
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Receive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
