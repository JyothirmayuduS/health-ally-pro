import { useEffect, useState } from "react";
import { useBillingStore, fmtLedger } from "@/lib/billing-desk/store";
import { Route } from "@/routes/billing.invoices";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DeskPanel, DeskTable, DeskThead, DeskTh, DeskEmpty } from "@/components/desk-shell/ui";
import { cn } from "@/lib/utils";

export default function BillingInvoices() {
  const { invoice: invoiceParam } = Route.useSearch();
  const { invoices, collectPayment } = useBillingStore();
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState("cash");

  useEffect(() => {
    if (invoiceParam) setSelected(invoiceParam);
  }, [invoiceParam]);

  const list = invoices.filter((i) => {
    if (filter === "unpaid") return i.status !== "paid";
    if (filter === "paid") return i.status === "paid";
    return true;
  });

  const active = invoices.find((i) => i.id === selected);
  const balance = active ? active.total - active.amountPaid : 0;

  return (
    <div className="space-y-5" data-testid="billing-invoices">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-44 border-ink-200 bg-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All invoices</SelectItem>
            <SelectItem value="unpaid">Unpaid / partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <DeskPanel title={`Ledger · ${list.length} records`} className="lg:col-span-3">
          <DeskTable>
            <DeskThead>
              <DeskTh>ID</DeskTh>
              <DeskTh>Patient</DeskTh>
              <DeskTh>Source</DeskTh>
              <DeskTh align="right">Total</DeskTh>
              <DeskTh>Status</DeskTh>
            </DeskThead>
            <tbody>
              {list.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelected(inv.id)}
                  className={cn(
                    "cursor-pointer border-b border-stone-100 transition-colors hover:bg-bone/60",
                    selected === inv.id && "bg-teal-soft/30",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.patientName}</div>
                    <div className="text-[11px] text-ink-400">{inv.mrn}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink-500">{inv.source}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtLedger(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase",
                        inv.status === "paid"
                          ? "bg-status-doneBg text-status-doneText"
                          : inv.status === "partial"
                            ? "bg-mustard-soft text-mustard"
                            : "bg-clay-soft text-clay",
                      )}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <DeskEmpty>No invoices match this filter.</DeskEmpty>
                  </td>
                </tr>
              )}
            </tbody>
          </DeskTable>
        </DeskPanel>

        <div className="surface p-5 lg:col-span-2">
          {active ? (
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">Invoice</div>
                <h2 className="font-heading mt-1 text-lg font-semibold">{active.id}</h2>
                <p className="text-[12px] text-ink-500">{active.date} · {active.source}</p>
              </div>
              <ul className="divide-y divide-ink-100 text-[13px]">
                {active.items.map((line, i) => (
                  <li key={i} className="flex justify-between gap-2 py-2">
                    <span className="text-ink-700">{line.label}</span>
                    <span className="font-mono shrink-0">{fmtLedger(line.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-ink-200 bg-stone-50 px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-600">Balance due</span>
                  <span className="font-mono text-lg font-semibold text-clay">{fmtLedger(balance)}</span>
                </div>
              </div>
              {balance > 0 && (
                <div className="space-y-2 pt-1">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="border-ink-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="btn-primary h-10 w-full"
                    onClick={() => {
                      collectPayment(active.id, balance, method);
                      toast.success(`Collected ${fmtLedger(balance)}`);
                      setSelected(null);
                    }}
                  >
                    Collect payment
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <p className="text-[13px] text-ink-400">Select an invoice from the ledger</p>
              <p className="mt-1 text-[12px] text-ink-400">Line items and collection appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
