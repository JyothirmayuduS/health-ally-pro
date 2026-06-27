import React, { useState, useMemo, useEffect } from "react";
import { X, IndianRupee, CheckCircle2, AlertCircle } from "lucide-react";
import { computeTotals } from "@/lib/reception-desk/billingData";

const REASONS = [
  "Patient request",
  "Doctor cancelled",
  "Duplicate payment",
  "Insurance covered",
  "Other",
];

export default function RefundModal({ open, onClose, invoice, onRefund }) {
  const [type, setType] = useState<"full" | "partial" | "credit">("full");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const invoiceTotal = useMemo(() => {
    if (!invoice) return 0;
    return computeTotals(invoice.items, invoice.discount).total;
  }, [invoice]);

  const totalRefunded = useMemo(() => {
    if (!invoice || !invoice.refunds) return 0;
    return invoice.refunds.reduce((sum, r) => sum + r.amount, 0);
  }, [invoice]);

  const maxRefundable = useMemo(() => {
    return Math.max(0, invoiceTotal - totalRefunded);
  }, [invoiceTotal, totalRefunded]);

  // Sync amount when type changes
  useEffect(() => {
    if (type === "full" || type === "credit") {
      setAmount(maxRefundable.toString());
    } else {
      setAmount("");
    }
  }, [type, maxRefundable]);

  if (!open || !invoice) return null;

  const numericAmount = Number(amount) || 0;
  const isAmountValid = numericAmount > 0 && numericAmount <= maxRefundable;
  const isValid = isAmountValid && reason !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onRefund(numericAmount, type, reason, notes);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-md bg-white rounded-sm border border-ink-200 shadow-lg">
        {/* Header */}
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Issue Refund
            </div>
            <h3 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Invoice {invoice.id}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Segmented Control */}
            <div>
              <div className="text-[12px] font-medium text-ink-600 mb-1.5">Refund Type</div>
              <div className="grid grid-cols-3 gap-1 bg-bone p-1 rounded-sm border border-ink-200">
                {(["full", "partial", "credit"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-1.5 text-[12px] font-medium rounded-sm transition capitalize ${
                      type === t
                        ? "bg-white text-ink-900 shadow-sm border border-ink-200/50"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {t === "credit" ? "Credit Note" : `${t} refund`}
                  </button>
                ))}
              </div>
            </div>

            {/* Refund Info Banner */}
            <div className="p-3 bg-bone border border-ink-200 rounded-sm text-[12.5px] text-ink-600 space-y-1">
              <div className="flex justify-between">
                <span>Invoice Total:</span>
                <span className="font-mono text-ink-900 font-medium">₹{invoiceTotal}</span>
              </div>
              {totalRefunded > 0 && (
                <div className="flex justify-between text-status-noshowText">
                  <span>Already Refunded:</span>
                  <span className="font-mono font-medium">₹{totalRefunded}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-200/60 pt-1 font-medium text-ink-900">
                <span>Max Refundable:</span>
                <span className="font-mono">₹{maxRefundable}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Refund Amount
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="number"
                  disabled={type === "full" || type === "credit"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage disabled:bg-bone disabled:cursor-not-allowed font-mono text-ink-900"
                />
              </div>
              {numericAmount > maxRefundable && (
                <div className="mt-1 text-[11px] text-status-noshowText flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Cannot exceed max refundable amount of ₹{maxRefundable}
                </div>
              )}
            </div>

            {/* Reason Dropdown (Mandatory) */}
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Reason <span className="text-status-noshowText">*</span>
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-2 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage text-ink-900"
              >
                <option value="" disabled>Select refund reason...</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Notes Field (Optional) */}
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this refund request..."
                rows={2}
                className="w-full p-2 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage text-ink-900 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-ink-200 flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-money flex-1 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Issue {type === "credit" ? "Credit Note" : "Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
