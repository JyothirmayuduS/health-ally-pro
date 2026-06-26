import { useState } from "react";
import { usePharmacyStore, searchMedicines } from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip, PickPath } from "@/components/pharmacy-desk/Pills";
import PharmacyPayDialog from "@/components/pharmacy-desk/PharmacyPayDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type PharmacyInvoice,
  type PaymentMethod,
  fmtInr,
} from "@/lib/pharmacy-desk/billing";
import { printPharmacyReceipt } from "@/lib/pharmacy-desk/billing";
import type { WalkInItem } from "@/lib/pharmacy-desk/mockData";
import type { Drug } from "@/lib/pharmacy-desk/mockData";
import { Store, ScanLine, ShoppingBag, Printer } from "lucide-react";

function walkInInvoice(sale: WalkInItem, drug: Drug | undefined): PharmacyInvoice {
  const tax = Math.round(sale.amount * 0.05 * 100) / 100;
  const total = Math.round((sale.amount + tax) * 100) / 100;
  return {
    id: sale.id,
    invoice_number: `OTC-${sale.id.slice(-6)}`,
    rx_id: "",
    rx_number: "WALK-IN",
    patient_id: "",
    patient_name: sale.patient_name ?? "Walk-in",
    mrn: "—",
    doctor_name: "OTC Counter",
    lines: [
      {
        drug_id: sale.drug_id,
        description: drug ? `${drug.generic_name} ${drug.strength}` : "OTC item",
        qty: sale.qty,
        unit_price: drug?.unit_price ?? 0,
        amount: sale.amount,
      },
    ],
    subtotal: sale.amount,
    tax,
    total,
    amount_paid: total,
    status: "paid",
    payment_method: "cash",
    created_at: sale.at,
    paid_at: sale.at,
  };
}

export default function WalkIn() {
  const { drugs, batches, walkInSales, addWalkInSale, payWalkInSale } = usePharmacyStore();
  const [query, setQuery] = useState("");
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [qty, setQty] = useState("1");
  const [patientName, setPatientName] = useState("");
  const [paySaleId, setPaySaleId] = useState<string | null>(null);

  const results = searchMedicines(query, drugs, batches, { inStockOnly: true }).slice(0, 8);
  const selected = drugs.find((d) => d.id === selectedDrugId) ?? results[0]?.drug;
  const paySale = walkInSales.find((s) => s.id === paySaleId);
  const payDrug = paySale ? drugs.find((d) => d.id === paySale.drug_id) : null;

  const payInvoice: PharmacyInvoice | null = paySale ? walkInInvoice(paySale, payDrug) : null;
  if (payInvoice && paySale?.payment === "unpaid") {
    payInvoice.amount_paid = 0;
    payInvoice.status = "unpaid";
    payInvoice.paid_at = undefined;
  }

  return (
    <div className="space-y-6" data-testid="walk-in-counter">
      <SectionLabel>Walk-in & OTC counter</SectionLabel>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h3 className="font-heading text-[16px] font-semibold flex items-center gap-2">
            <Store className="h-4 w-4 text-mustard" /> Quick sale
          </h3>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-ink-200 bg-stone-50 px-3 py-2">
            <ScanLine className="h-4 w-4 text-ink-400" />
            <input placeholder="Scan barcode…" className="flex-1 bg-transparent text-[13px] outline-none" />
          </div>

          <Input
            className="mt-3 border-ink-200 bg-white"
            placeholder="Search OTC drug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
            {results.map((hit) => (
              <button
                key={hit.drug.id}
                type="button"
                onClick={() => setSelectedDrugId(hit.drug.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-[13px] ${selected?.id === hit.drug.id ? "bg-mustard-soft" : "hover:bg-stone-50"}`}
              >
                {hit.drug.generic_name} {hit.drug.strength} · Avail {hit.available}
              </button>
            ))}
          </div>

          {selected && (
            <div className="mt-4 rounded-lg border border-ink-200 p-3">
              <div className="font-medium">{selected.generic_name}</div>
              <LocationChip location={selected.location} />
              <PickPath location={selected.location} />
              <div className="mt-2 font-mono text-[12px] text-sage">
                {fmtInr(selected.unit_price * Number(qty || 1))}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] uppercase text-ink-400">Qty</label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 border-ink-200" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase text-ink-400">Customer (optional)</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="mt-1 border-ink-200" placeholder="Walk-in" />
            </div>
          </div>

          <Button
            className="btn-primary mt-4 w-full"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                const id = addWalkInSale(selected.id, Number(qty) || 1, patientName || undefined);
                setPaySaleId(id);
              }
              setQty("1");
              setPatientName("");
            }}
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Queue sale & collect payment
          </Button>
        </div>

        <div className="surface">
          <div className="border-b border-ink-200 px-5 py-4 font-heading font-semibold">Today&apos;s walk-in sales</div>
          <div className="divide-y divide-ink-100">
            {walkInSales.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-ink-400">No sales yet this session.</p>
            ) : (
              walkInSales.map((s) => {
                const drug = drugs.find((d) => d.id === s.drug_id);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                    <div>
                      <span className="font-medium">{drug?.generic_name} × {s.qty}</span>
                      <div className="text-[11px] text-ink-400">{s.patient_name ?? "Walk-in"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sage">{fmtInr(s.amount)}</span>
                      {s.payment === "unpaid" ? (
                        <Button size="sm" className="btn-primary h-7" onClick={() => setPaySaleId(s.id)}>
                          Pay
                        </Button>
                      ) : (
                        <span className="text-[11px] font-medium text-status-doneText">Paid</span>
                      )}
                      {s.payment === "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-ink-200"
                          onClick={() => printPharmacyReceipt(walkInInvoice(s, drug))}
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <PharmacyPayDialog
        open={!!paySaleId && !!payInvoice}
        onOpenChange={(o) => !o && setPaySaleId(null)}
        invoice={payInvoice}
        onPay={(method: PaymentMethod) => {
          if (paySaleId) {
            payWalkInSale(paySaleId, method);
            setPaySaleId(null);
          }
        }}
      />
    </div>
  );
}
