import { loadLedgerInvoices } from "@/lib/shared/billing-ledger";
import { listEncounters } from "@/lib/shared/encounters";
import { listVitals } from "@/lib/nursing-desk/vitals";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";

export default function AdminAnalytics() {
  const invoices = loadLedgerInvoices();
  const encounters = listEncounters();
  const vitals = listVitals();

  const bySource = {
    reception: invoices.filter((i) => i.source === "reception"),
    lab: invoices.filter((i) => i.source === "lab"),
    pharmacy: invoices.filter((i) => i.source === "pharmacy"),
  };

  const sum = (list: typeof invoices) => list.reduce((s, i) => s + i.amountPaid, 0);

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DeskKpi label="Patients" value={SHARED_PATIENTS.length} />
        <DeskKpi label="Encounters" value={encounters.length} />
        <DeskKpi label="Vitals logged" value={vitals.length} />
        <DeskKpi label="Invoices" value={invoices.length} />
      </div>

      <DeskPanel title="Revenue by source">
        <div className="space-y-4 p-5">
          {(["reception", "lab", "pharmacy"] as const).map((src) => {
            const total = sum(bySource[src]);
            const max = Math.max(sum(bySource.reception), sum(bySource.lab), sum(bySource.pharmacy), 1);
            const pct = Math.round((total / max) * 100);
            return (
              <div key={src}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium capitalize text-ink-800">{src}</span>
                  <span className="font-mono text-money">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-plum transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DeskPanel>

      <DeskPanel title="Invoice status mix">
        <div className="divide-y divide-ink-100">
          {[
            { label: "Paid", count: invoices.filter((i) => i.status === "paid").length, color: "text-status-doneText" },
            { label: "Partial", count: invoices.filter((i) => i.status === "partial").length, color: "text-mustard" },
            { label: "Unpaid", count: invoices.filter((i) => i.status === "unpaid").length, color: "text-clay" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3 text-[13px]">
              <span className="text-ink-600">{row.label}</span>
              <span className={`font-mono font-semibold ${row.color}`}>{row.count}</span>
            </div>
          ))}
        </div>
      </DeskPanel>
    </div>
  );
}
