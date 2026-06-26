import { useState } from "react";
import {
  PAYMENT_METHODS,
  balanceDue,
  fmtInr,
  type PharmacyInvoice,
  type PaymentMethod,
} from "@/lib/pharmacy-desk/billing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Banknote, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const METHOD_ICON = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  insurance: ShieldCheck,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PharmacyInvoice | null;
  onPay: (method: PaymentMethod, amount: number) => void;
};

export default function PharmacyPayDialog({ open, onOpenChange, invoice, onPay }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  if (!invoice) return null;

  const due = balanceDue(invoice);
  const isPartialAllowed = invoice.status === "unpaid" || invoice.status === "partial";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-ink-200" data-testid="pharmacy-pay-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Collect payment</DialogTitle>
          <DialogDescription>
            {invoice.invoice_number} · {invoice.patient_name} · Balance {fmtInr(due)}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">Payment method</div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICON[m.id];
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`pay-method-${m.id}`}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13px] font-medium transition",
                    active
                      ? "border-sage bg-sage-soft text-sage"
                      : "border-ink-200 text-ink-900 hover:bg-bone",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1 border-t border-ink-200 pt-4 text-[13px] text-ink-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-ink-900">{fmtInr(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (5%)</span>
            <span className="font-mono text-ink-900">{fmtInr(invoice.tax)}</span>
          </div>
          {invoice.amount_paid > 0 && (
            <div className="flex justify-between">
              <span>Already paid</span>
              <span className="font-mono text-status-doneText">−{fmtInr(invoice.amount_paid)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 text-[15px] font-semibold text-ink-900">
            <span>Due now</span>
            <span className="font-mono">{fmtInr(due)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isPartialAllowed && invoice.status === "unpaid" && due > 100 && (
            <Button
              variant="outline"
              className="border-ink-200"
              onClick={() => onPay(method, Math.round(due * 0.5 * 100) / 100)}
            >
              Partial 50%
            </Button>
          )}
          <Button className="btn-primary" onClick={() => onPay(method, due)} data-testid="confirm-payment">
            Collect {fmtInr(due)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
