import { useMemo, useState } from "react";
import {
  usePharmacyStore,
  formatRelative,
  getPatient,
} from "@/lib/pharmacy-desk/store";
import {
  PaymentPill,
  PriorityPill,
  RxStatusPill,
  SectionLabel,
  EmptyState,
} from "@/components/pharmacy-desk/Pills";
import PharmacyPayDialog from "@/components/pharmacy-desk/PharmacyPayDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  balanceDue,
  fmtInr,
  printPharmacyReceipt,
  type PaymentMethod,
} from "@/lib/pharmacy-desk/billing";
import { IndianRupee, Printer, Receipt, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "due", label: "Balance due" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid today" },
  { value: "all", label: "All" },
];

export default function Billing() {
  const { prescriptions, patients, invoices, getInvoiceForRx, collectRxPayment } = usePharmacyStore();
  const [tab, setTab] = useState("due");
  const [query, setQuery] = useState("");
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const rows = useMemo(() => {
    return invoices
      .map((inv) => {
        const rx = prescriptions.find((r) => r.id === inv.rx_id);
        if (!rx || rx.status === "cancelled") return null;
        const patient = getPatient(rx, patients);
        return { inv, rx, patient };
      })
      .filter(Boolean)
      .filter((row) => {
        if (!row) return false;
        if (tab === "due") return row.inv.status === "unpaid";
        if (tab === "partial") return row.inv.status === "partial";
        if (tab === "paid") return row.inv.status === "paid";
        return true;
      })
      .filter((row) => {
        if (!row || !query) return true;
        const q = query.toLowerCase();
        return (
          row.inv.invoice_number.toLowerCase().includes(q) ||
          row.inv.rx_number.toLowerCase().includes(q) ||
          row.patient?.name.toLowerCase().includes(q) ||
          row.patient?.mrn.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (a.inv.status !== "paid" && b.inv.status === "paid") return -1;
        if (a.inv.status === "paid" && b.inv.status !== "paid") return 1;
        return new Date(b.rx.received_at).getTime() - new Date(a.rx.received_at).getTime();
      });
  }, [invoices, prescriptions, patients, tab, query]);

  const selected = rows.find((r) => r?.rx.id === selectedRxId) ?? rows[0] ?? null;
  const dueTotal = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + balanceDue(i), 0);
  const collectedToday = invoices
    .filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at).toDateString() === new Date().toDateString())
    .reduce((s, i) => s + i.total, 0);

  function handlePay(method: PaymentMethod, amount: number) {
    if (!selected) return;
    collectRxPayment(selected.rx.id, method, amount);
    setPayOpen(false);
  }

  return (
    <div className="space-y-5" data-testid="pharmacy-billing">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>Billing counter</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-clay/30 bg-clay-soft/40 px-4 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-clay">Outstanding</div>
            <div className="font-heading text-[18px] font-semibold text-clay">{fmtInr(dueTotal)}</div>
          </div>
          <div className="rounded-lg border border-status-doneBorder bg-status-doneBg/40 px-4 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-status-doneText">Collected today</div>
            <div className="font-heading text-[18px] font-semibold text-status-doneText">{fmtInr(collectedToday)}</div>
          </div>
        </div>
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search invoice, Rx #, patient, MRN…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-ink-200 bg-white pl-9"
          />
        </div>
        <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded px-3 py-1.5 text-[11px] font-medium transition",
                tab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
            Pharmacy invoices
          </div>
          <div className="max-h-[calc(100vh-300px)] divide-y divide-ink-100 overflow-y-auto">
            {rows.length === 0 ? (
              <EmptyState icon={Receipt} title="No invoices" hint="Unpaid Rx orders appear here for collection." />
            ) : (
              rows.map((row) => {
                if (!row) return null;
                const { inv, rx, patient } = row;
                const active = selected?.rx.id === rx.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedRxId(rx.id)}
                    className={cn(
                      "w-full px-4 py-3.5 text-left transition",
                      active ? "border-l-2 border-mustard bg-mustard-soft/40" : "border-l-2 border-transparent hover:bg-stone-50/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[11px] text-ink-500">{inv.invoice_number}</div>
                        <div className="font-medium text-ink-900">{patient?.name}</div>
                        <div className="font-mono text-[11px] text-ink-500">{rx.rx_number}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[13px] font-semibold text-ink-900">{fmtInr(inv.total)}</div>
                        {inv.status !== "paid" && (
                          <div className="text-[11px] font-medium text-clay">Due {fmtInr(balanceDue(inv))}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <PaymentPill status={inv.status} />
                      <RxStatusPill status={rx.status} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="surface lg:col-span-3">
          {!selected ? (
            <EmptyState icon={Receipt} title="Select an invoice" hint="Choose a row to collect payment or print receipt." />
          ) : (
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 pb-4">
                <div>
                  <div className="font-mono text-[11px] text-ink-500">{selected.inv.invoice_number}</div>
                  <h2 className="font-heading text-[20px] font-semibold text-ink-900">{selected.patient?.name}</h2>
                  <p className="text-[13px] text-ink-600">
                    {selected.patient?.mrn} · {selected.rx.rx_number} · {selected.rx.doctor_name}
                  </p>
                </div>
                <PaymentPill status={selected.inv.status} />
              </div>

              <table className="mt-4 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-ink-200 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.inv.lines.map((line) => (
                    <tr key={line.drug_id} className="border-b border-ink-100">
                      <td className="py-2.5 text-ink-900">{line.description}</td>
                      <td className="py-2.5 text-right font-mono">{line.qty}</td>
                      <td className="py-2.5 text-right font-mono">{fmtInr(line.unit_price)}</td>
                      <td className="py-2.5 text-right font-mono">{fmtInr(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-1 border-t border-ink-200 pt-4 text-[13px]">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{fmtInr(selected.inv.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Tax (GST)</span>
                  <span className="font-mono">{fmtInr(selected.inv.tax)}</span>
                </div>
                <div className="flex justify-between text-[16px] font-semibold text-ink-900">
                  <span>Total</span>
                  <span className="font-mono">{fmtInr(selected.inv.total)}</span>
                </div>
                {selected.inv.amount_paid > 0 && (
                  <div className="flex justify-between text-status-doneText">
                    <span>Paid</span>
                    <span className="font-mono">{fmtInr(selected.inv.amount_paid)}</span>
                  </div>
                )}
                {selected.inv.status !== "paid" && (
                  <div className="flex justify-between font-semibold text-clay">
                    <span>Balance due</span>
                    <span className="font-mono">{fmtInr(balanceDue(selected.inv))}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {selected.inv.status !== "paid" && (
                  <Button className="btn-primary" onClick={() => setPayOpen(true)}>
                    <IndianRupee className="mr-1.5 h-4 w-4" />
                    Collect {fmtInr(balanceDue(selected.inv))}
                  </Button>
                )}
                <Button variant="outline" className="border-ink-200" onClick={() => printPharmacyReceipt(selected.inv)}>
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print receipt
                </Button>
                <span className="ml-auto text-[11px] text-ink-400">
                  Received {formatRelative(selected.rx.received_at)}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <PriorityPill priority={selected.rx.priority} />
                <RxStatusPill status={selected.rx.status} />
              </div>
            </div>
          )}
        </div>
      </div>

      <PharmacyPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        invoice={selected ? getInvoiceForRx(selected.rx.id) ?? selected.inv : null}
        onPay={handlePay}
      />
    </div>
  );
}
