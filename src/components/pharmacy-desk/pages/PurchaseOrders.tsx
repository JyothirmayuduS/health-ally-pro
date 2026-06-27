import { useState, useMemo } from "react";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { SectionLabel, EmptyState, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Check, Truck, ShoppingBag, Receipt, AlertCircle, ShoppingCart } from "lucide-react";
import { SUPPLIERS, type PurchaseOrder, type POItem, type GRN, type GRNItem } from "@/lib/pharmacy-desk/purchaseOrdersData";
import { formatDateTime } from "@/lib/pharmacy-desk/utils";
import { cn } from "@/lib/utils";

export default function PurchaseOrders() {
  const {
    purchaseOrders,
    grns,
    drugs,
    createPurchaseOrder,
    cancelPurchaseOrder,
    createGRN,
  } = usePharmacyStore();

  const [activeTab, setActiveTab] = useState<"po" | "grn">("po");

  // New PO Modal State
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(SUPPLIERS[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<{ drugId: string; qty: number; cost: number }[]>([
    { drugId: "", qty: 100, cost: 0.20 },
  ]);

  // GRN Modal State
  const [grnModalOpen, setGrnModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);
  const [grnItems, setGrnItems] = useState<
    {
      drugId: string;
      drugName: string;
      qtyOrdered: number;
      qtyReceived: number;
      qtyDamaged: number;
      condition: "Good" | "Damaged" | "Short expiry";
      batchNumber: string;
      expiryDate: string;
    }[]
  >([]);

  const handleOpenGRN = (po: PurchaseOrder) => {
    setActivePO(po);
    setGrnItems(
      po.items.map((item) => ({
        drugId: item.drug_id,
        drugName: item.drug_name,
        qtyOrdered: item.qty_ordered,
        qtyReceived: item.qty_ordered,
        qtyDamaged: 0,
        condition: "Good",
        batchNumber: `LOT-GRN-${Date.now().toString().slice(-4)}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      }))
    );
    setGrnModalOpen(true);
  };

  const handleAddPOLine = () => {
    setPoItems([...poItems, { drugId: "", qty: 100, cost: 0.10 }]);
  };

  const handleRemovePOLine = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const items: POItem[] = poItems
      .filter((it) => it.drugId !== "")
      .map((it) => {
        const drug = drugs.find((d) => d.id === it.drugId);
        return {
          drug_id: it.drugId,
          drug_name: drug ? `${drug.generic_name} ${drug.strength}` : "Unknown Drug",
          qty_ordered: it.qty,
          unit_cost: it.cost,
        };
      });

    if (items.length === 0) return;

    createPurchaseOrder({
      supplier_name: selectedSupplier,
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: expectedDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      notes: poNotes,
      items,
    });

    setPoModalOpen(false);
    setPoNotes("");
    setPoItems([{ drugId: "", qty: 100, cost: 0.20 }]);
  };

  const handleGRNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) return;

    const items: GRNItem[] = grnItems.map((it) => ({
      drug_id: it.drugId,
      drug_name: it.drugName,
      qty_ordered: it.qtyOrdered,
      qty_received: it.qtyReceived,
      qty_damaged: it.qtyDamaged,
      condition: it.condition,
      batch_number: it.batchNumber,
      expiry_date: it.expiryDate,
    }));

    // Check discrepancy
    const hasDiscrepancy = items.some(
      (it) => it.qty_received < it.qty_ordered || it.qty_damaged > 0 || it.condition === "Damaged"
    );

    createGRN({
      po_id: activePO.id,
      po_number: activePO.po_number,
      supplier_name: activePO.supplier_name,
      items,
      status: hasDiscrepancy ? "discrepancy" : "complete",
    });

    setGrnModalOpen(false);
    setActivePO(null);
  };

  return (
    <div className="space-y-6">
      <SectionLabel action={
        <div className="flex gap-2">
          {activeTab === "po" && (
            <Button className="btn-primary" onClick={() => setPoModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Purchase Order
            </Button>
          )}
        </div>
      }>
        Procurement & GRN Logs
      </SectionLabel>

      {/* Tabs */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-sm">
        {[
          { value: "po", label: "Purchase Orders" },
          { value: "grn", label: "Goods Received (GRN)" }
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActiveTab(t.value as any)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
              activeTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PO List tab */}
      {activeTab === "po" && (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">PO number</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Order Date</th>
                <th className="px-4 py-3 text-left">Expected Delivery</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={ShoppingCart} title="No purchase orders" /></td></tr>
              ) : (
                purchaseOrders.map((po) => {
                  const qtyTotal = po.items.reduce((sum, it) => sum + it.qty_ordered, 0);
                  const isCancelable = ["draft", "submitted"].includes(po.status);
                  const isReceivable = ["submitted", "partially-received"].includes(po.status);

                  return (
                    <tr key={po.id} className="border-b border-stone-100 text-[13px]">
                      <td className="px-4 py-3 font-mono font-medium text-ink-900">{po.po_number}</td>
                      <td className="px-4 py-3">{po.supplier_name}</td>
                      <td className="px-4 py-3">{po.order_date}</td>
                      <td className="px-4 py-3 text-ink-500">{po.expected_delivery_date}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{po.items.length} meds</span> ({qtyTotal} units)
                      </td>
                      <td className="px-4 py-3 font-mono">₹{(po.total_value * 90).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded border text-[10.5px] font-bold uppercase",
                          po.status === "received" ? "bg-sage-soft border-sage text-sage" :
                          po.status === "partially-received" ? "bg-mustard-soft border-mustard text-mustard" :
                          po.status === "submitted" ? "bg-teal-soft border-teal text-teal" :
                          "bg-bone border-ink-200 text-ink-400"
                        )}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isReceivable && (
                            <Button
                              size="sm"
                              className="bg-sage hover:bg-sage/90 text-white h-7 text-[12px]"
                              onClick={() => handleOpenGRN(po)}
                            >
                              <Truck className="h-3.5 w-3.5 mr-1" /> Receive Stock
                            </Button>
                          )}
                          {isCancelable && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-clay/20 text-clay hover:bg-clay-soft/10 h-7 text-[12px]"
                              onClick={() => cancelPurchaseOrder(po.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* GRN List tab */}
      {activeTab === "grn" && (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">GRN number</th>
                <th className="px-4 py-3 text-left">PO Link</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Received Date</th>
                <th className="px-4 py-3 text-left">Received by</th>
                <th className="px-4 py-3 text-left">Items Status</th>
                <th className="px-4 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {grns.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Receipt} title="No GRN logs" /></td></tr>
              ) : (
                grns.map((g) => (
                  <tr key={g.id} className="border-b border-stone-100 text-[13px]">
                    <td className="px-4 py-3 font-mono font-medium text-ink-900">{g.grn_number}</td>
                    <td className="px-4 py-3 font-mono text-ink-500">{g.po_number}</td>
                    <td className="px-4 py-3">{g.supplier_name}</td>
                    <td className="px-4 py-3">{g.received_date}</td>
                    <td className="px-4 py-3 text-ink-600">{g.received_by}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{g.items.length} items logged</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded border text-[10.5px] font-bold uppercase",
                        g.status === "complete" ? "bg-sage-soft border-sage text-sage" :
                        "bg-clay-soft border-clay text-clay"
                      )}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New PO Modal */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-ink-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3 border-b border-ink-200 bg-stone-50 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-ink-900">Create Purchase Order</h3>
              <button onClick={() => setPoModalOpen(false)} className="btn-icon"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handlePOSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full h-9 px-2 border border-ink-200 bg-white text-[13px] rounded focus:outline-none"
                  >
                    {SUPPLIERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full h-9 px-2 border border-ink-200 text-[13px] rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-600 mb-1">Items List</label>
                <div className="border border-ink-200 rounded-md overflow-hidden bg-bone">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-stone-100 border-b border-ink-200 font-mono uppercase text-ink-400">
                        <th className="px-3 py-2 text-left">Medication Name</th>
                        <th className="px-3 py-2 text-left w-32">Qty Ordered</th>
                        <th className="px-3 py-2 text-left w-32">Est Unit Cost</th>
                        <th className="px-3 py-2 text-right w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {poItems.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2">
                            <select
                              required
                              value={item.drugId}
                              onChange={(e) => {
                                const next = [...poItems];
                                next[idx].drugId = e.target.value;
                                const d = drugs.find((x) => x.id === e.target.value);
                                if (d) next[idx].cost = d.unit_price * 0.7; // default supplier discount
                                setPoItems(next);
                              }}
                              className="w-full h-8 border border-ink-200 bg-white px-2 focus:outline-none"
                            >
                              <option value="" disabled>Select drug...</option>
                              {drugs.map((d) => (
                                <option key={d.id} value={d.id}>{d.generic_name} {d.strength} ({d.form})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              required
                              value={item.qty}
                              onChange={(e) => {
                                const next = [...poItems];
                                next[idx].qty = Number(e.target.value);
                                setPoItems(next);
                              }}
                              className="h-8 border-ink-200 font-mono"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              required
                              value={item.cost}
                              onChange={(e) => {
                                const next = [...poItems];
                                next[idx].cost = Number(e.target.value);
                                setPoItems(next);
                              }}
                              className="h-8 border-ink-200 font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-clay hover:text-clay-soft"
                              onClick={() => handleRemovePOLine(idx)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 bg-stone-50 border-t border-ink-200">
                    <Button type="button" size="sm" variant="outline" className="border-ink-200" onClick={handleAddPOLine}>
                      + Add Row
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-600 mb-1">PO Notes</label>
                <Input
                  placeholder="Special instructions or supplier details…"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="border-ink-200 bg-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button type="button" variant="outline" className="border-ink-200" onClick={() => setPoModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Submit Purchase Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Receive Stock Modal */}
      {grnModalOpen && activePO && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl border border-ink-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3 border-b border-ink-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-ink-900">Goods Received Note (GRN) Verification</h3>
                <p className="text-[12px] text-ink-400">Linked to PO: {activePO.po_number} · Supplier: {activePO.supplier_name}</p>
              </div>
              <button onClick={() => setGrnModalOpen(false)} className="btn-icon"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleGRNSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="border border-ink-200 rounded-md overflow-hidden bg-bone">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-100 border-b border-ink-200 font-mono uppercase text-ink-400">
                      <th className="px-3 py-2 text-left">Item Name</th>
                      <th className="px-3 py-2 text-left w-20">Ordered</th>
                      <th className="px-3 py-2 text-left w-24">Received</th>
                      <th className="px-3 py-2 text-left w-24">Damaged</th>
                      <th className="px-3 py-2 text-left w-28">Condition</th>
                      <th className="px-3 py-2 text-left w-32">Batch / Lot #</th>
                      <th className="px-3 py-2 text-left w-32">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {grnItems.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 font-medium">{item.drugName}</td>
                        <td className="px-3 py-2 font-mono text-[13px]">{item.qtyOrdered}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            required
                            value={item.qtyReceived}
                            onChange={(e) => {
                              const next = [...grnItems];
                              next[idx].qtyReceived = Number(e.target.value);
                              setGrnItems(next);
                            }}
                            className="h-8 border-ink-200 font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            required
                            value={item.qtyDamaged}
                            onChange={(e) => {
                              const next = [...grnItems];
                              next[idx].qtyDamaged = Number(e.target.value);
                              if (Number(e.target.value) > 0) next[idx].condition = "Damaged";
                              setGrnItems(next);
                            }}
                            className="h-8 border-ink-200 font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.condition}
                            onChange={(e) => {
                              const next = [...grnItems];
                              next[idx].condition = e.target.value as any;
                              setGrnItems(next);
                            }}
                            className="h-8 border border-ink-200 bg-white px-1.5 focus:outline-none w-full"
                          >
                            <option>Good</option>
                            <option>Damaged</option>
                            <option>Short expiry</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            required
                            placeholder="LOT-X"
                            value={item.batchNumber}
                            onChange={(e) => {
                              const next = [...grnItems];
                              next[idx].batchNumber = e.target.value;
                              setGrnItems(next);
                            }}
                            className="h-8 border-ink-200 font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            required
                            value={item.expiryDate}
                            onChange={(e) => {
                              const next = [...grnItems];
                              next[idx].expiryDate = e.target.value;
                              setGrnItems(next);
                            }}
                            className="h-8 border border-ink-200 bg-white px-2 focus:outline-none w-full text-[12px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button type="button" variant="outline" className="border-ink-200" onClick={() => setGrnModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary bg-sage hover:bg-sage/90 text-white">
                  Confirm GRN Receipt & Replenish Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
