import { useBillingStore, fmtLedger } from "@/lib/billing-desk/store";
import { DeskPanel, DeskTable, DeskThead, DeskTh, DeskEmpty } from "@/components/desk-shell/ui";

export default function BillingPayments() {
  const { payments, invoices } = useBillingStore();

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5" data-testid="billing-payments">
      <div className="surface flex items-center justify-between px-5 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">Total logged</div>
          <div className="font-heading text-2xl font-semibold tabular-nums">{fmtLedger(total)}</div>
        </div>
        <div className="text-right text-[12px] text-ink-500">{payments.length} transactions</div>
      </div>

      <DeskPanel title="Collection log">
        <DeskTable>
          <DeskThead>
            <DeskTh>When</DeskTh>
            <DeskTh>Invoice</DeskTh>
            <DeskTh>Patient</DeskTh>
            <DeskTh>Method</DeskTh>
            <DeskTh align="right">Amount</DeskTh>
            <DeskTh>Actor</DeskTh>
          </DeskThead>
          <tbody>
            {payments.map((p) => {
              const inv = invoices.find((i) => i.id === p.invoiceId);
              return (
                <tr key={p.id} className="border-b border-stone-100 hover:bg-bone/40">
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-500">
                    {new Date(p.at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.invoiceId}</td>
                  <td className="px-4 py-3 font-medium">{inv?.patientName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-stone-100 px-2 py-0.5 font-mono text-[10px] uppercase">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-money">
                    {fmtLedger(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-500">{p.actor}</td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <DeskEmpty>No payments recorded yet.</DeskEmpty>
                </td>
              </tr>
            )}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
