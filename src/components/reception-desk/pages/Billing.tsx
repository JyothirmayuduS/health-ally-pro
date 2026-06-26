import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import {
  PAYMENT_METHODS,
  computeTotals,
} from "@/lib/reception-desk/billingData";
import { toast } from "sonner";
import { printReceipt } from "@/lib/reception-desk/print";
import {
  Receipt,
  Printer,
  Plus,
  Trash2,
  IndianRupee,
  Search,
  CheckCircle2,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  X,
} from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_FILTERS = ["All", "Unpaid", "Paid"];

const METHOD_ICON = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  insurance: ShieldCheck,
};

function StatusChip({ status }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide border rounded-sm bg-money/10 text-money border-money/30">
        <span className="w-1.5 h-1.5 rounded-full bg-money" /> Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide border rounded-sm bg-clay-soft text-clay border-clay/30">
      <span className="w-1.5 h-1.5 rounded-full bg-clay" /> Unpaid
    </span>
  );
}

function PayDialog({ invoice, totals, onClose, onPay }) {
  const [method, setMethod] = useState("cash");
  if (!invoice) return null;
  return (
    <div
      data-testid="pay-dialog"
      className="fixed inset-0 z-30 bg-black/30 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-sm w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Collect payment
            </div>
            <h3 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              {invoice.id} · {fmt(totals.total)}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" data-testid="pay-close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-2">
            Method
          </div>
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 border rounded-sm text-[13px] font-medium transition ${
                    active
                      ? "border-sage bg-sage-soft text-sage"
                      : "border-ink-200 text-ink-900 hover:bg-bone"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-ink-200 space-y-1 text-[13px] text-ink-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-ink-900">{fmt(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-mono text-status-noshowText">−{fmt(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="font-mono text-ink-900">{fmt(totals.tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-ink-200 mt-2 text-[15px]">
              <span className="font-medium text-ink-900">Total</span>
              <span className="font-mono font-semibold text-ink-900">
                {fmt(totals.total)}
              </span>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-ink-200 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1" data-testid="pay-cancel">
            Cancel
          </button>
          <button
            onClick={() => onPay(method)}
            className="btn-money flex-1"
            data-testid="pay-confirm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm {fmt(totals.total)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const {
    invoices,
    patients,
    doctors,
    appointments,
    addInvoice,
    updateInvoice,
    collectPayment,
    getConsultFee,
    labCatalog,
  } = useStore();

  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const [filter, setFilter] = useState("Unpaid");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(invoices[0]?.id || null);
  const [payOpen, setPayOpen] = useState(false);

  // Auto-create invoices for today's completed/in-progress/checked-in appointments
  // that don't have one yet (one-shot, harmless on re-render).
  React.useEffect(() => {
    const billable = appointments.filter(
      (a) =>
        a.date === TODAY_STR &&
        ["checked-in", "in-progress", "completed"].includes(a.status),
    );
    billable.forEach((apt) => {
      const has = invoices.some((i) => i.appointmentId === apt.id);
      if (!has) {
        const fee = getConsultFee(apt.doctorId);
        const d = doctors.find((x) => x.id === apt.doctorId);
        addInvoice({
          appointmentId: apt.id,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          items: [
            {
              label: `Consultation — ${d?.specialty || ""} (${apt.type})`,
              qty: 1,
              unit: fee,
              amount: fee,
            },
          ],
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter === "Unpaid") list = list.filter((i) => i.status === "unpaid");
    if (filter === "Paid") list = list.filter((i) => i.status === "paid");
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((i) => {
        const p = patients.find((x) => x.id === i.patientId);
        return (
          i.id.toLowerCase().includes(s) ||
          p?.name.toLowerCase().includes(s) ||
          p?.id.toLowerCase().includes(s)
        );
      });
    }
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [invoices, filter, q, patients]);

  const selected = invoices.find((i) => i.id === selectedId) || filtered[0];
  const selPatient = selected && patients.find((p) => p.id === selected.patientId);
  const selDoctor = selected && doctors.find((d) => d.id === selected.doctorId);
  const selTotals = selected
    ? computeTotals(selected.items, selected.discount)
    : { subtotal: 0, discount: 0, tax: 0, total: 0 };

  // KPIs
  const todayInv = invoices.filter((i) => i.date === TODAY_STR);
  const collected = todayInv
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
  const outstanding = todayInv
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
  const unpaidCount = todayInv.filter((i) => i.status === "unpaid").length;

  const addItem = () => {
    if (!selected) return;
    updateInvoice(selected.id, {
      items: [
        ...selected.items,
        { label: "Service", qty: 1, unit: 200, amount: 200 },
      ],
    });
  };

  const addLabItem = (code: string) => {
    if (!selected) return;
    const test = labCatalog.find((t) => t.code === code);
    if (!test) return;
    updateInvoice(selected.id, {
      items: [
        ...selected.items,
        {
          label: `Lab — ${test.name}`,
          qty: 1,
          unit: test.price,
          amount: test.price,
        },
      ],
    });
    setAddMenuOpen(false);
    toast.success(`Added ${test.name}`);
  };

  const addPharmacyItem = () => {
    if (!selected) return;
    updateInvoice(selected.id, {
      items: [
        ...selected.items,
        { label: "Pharmacy — dispensed medicines", qty: 1, unit: 350, amount: 350 },
      ],
    });
    setAddMenuOpen(false);
    toast.success("Added pharmacy line item");
  };

  const updateItem = (idx, patch) => {
    const items = selected.items.map((it, i) =>
      i === idx
        ? {
            ...it,
            ...patch,
            amount:
              (patch.qty ?? it.qty) * (patch.unit ?? it.unit) ||
              it.amount,
          }
        : it,
    );
    updateInvoice(selected.id, { items });
  };

  const removeItem = (idx) => {
    updateInvoice(selected.id, {
      items: selected.items.filter((_, i) => i !== idx),
    });
  };

  const onPay = (method) => {
    collectPayment(selected.id, method);
    toast.success(`Paid via ${method.toUpperCase()}`, {
      description: `${selPatient?.name} · ${fmt(selTotals.total)}`,
    });
    setPayOpen(false);
  };

  return (
    <div data-testid="billing-page" className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface p-4 border-l-2 border-l-money">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Collected today
          </div>
          <div className="text-[26px] font-heading font-semibold text-money tabular-nums mt-1">
            {fmt(collected)}
          </div>
        </div>
        <div className="surface p-4 border-l-2 border-l-clay">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Outstanding
          </div>
          <div className="text-[26px] font-heading font-semibold text-clay tabular-nums mt-1">
            {fmt(outstanding)}
          </div>
        </div>
        <div className="surface p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Unpaid invoices
          </div>
          <div className="text-[26px] font-heading font-semibold text-ink-900 tabular-nums mt-1">
            {unpaidCount}
          </div>
        </div>
        <div className="surface p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Invoices today
          </div>
          <div className="text-[26px] font-heading font-semibold text-ink-900 tabular-nums mt-1">
            {todayInv.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Invoice list */}
        <section className="col-span-12 lg:col-span-5 surface flex flex-col h-[calc(100vh-260px)]">
          <div className="p-3 border-b border-ink-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                data-testid="billing-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice, patient, MRN…"
                className="w-full h-9 pl-9 pr-3 text-[13px] bg-bone border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              />
            </div>
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  data-testid={`billing-filter-${f.toLowerCase()}`}
                  onClick={() => setFilter(f)}
                  className={`h-7 px-3 text-[12px] rounded-full font-medium ${
                    filter === f
                      ? "bg-ink-900 text-white"
                      : "text-ink-600 hover:text-ink-900 hover:bg-bone border border-ink-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="overflow-y-auto divide-y divide-ink-200">
            {filtered.map((i) => {
              const p = patients.find((x) => x.id === i.patientId);
              const t = computeTotals(i.items, i.discount);
              const Icon = i.method ? METHOD_ICON[i.method] : Receipt;
              const active = selected?.id === i.id;
              return (
                <li key={i.id}>
                  <button
                    data-testid={`billing-row-${i.id}`}
                    onClick={() => setSelectedId(i.id)}
                    className={`w-full text-left px-4 py-3 row-hover flex items-center gap-3 ${
                      active ? "bg-sage-soft/40" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-sm grid place-items-center ${
                        i.status === "paid"
                          ? "bg-money/10 text-money"
                          : "bg-clay-soft text-clay"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-medium text-ink-900 truncate">
                          {p?.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {i.id} · {p?.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13.5px] font-mono font-semibold text-ink-900 tabular-nums">
                        {fmt(t.total)}
                      </div>
                      <div className="mt-1">
                        <StatusChip status={i.status} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-8 text-center text-[13px] text-ink-400">
                No invoices match.
              </li>
            )}
          </ul>
        </section>

        {/* Invoice detail */}
        <section className="col-span-12 lg:col-span-7 surface flex flex-col">
          {!selected ? (
            <div className="p-12 text-center text-ink-400 text-[13px]">
              Select an invoice
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-ink-200 flex items-start gap-4">
                <div className="w-11 h-11 rounded-sm bg-money/10 text-money grid place-items-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                    Invoice · {selected.date}
                  </div>
                  <div className="text-[20px] font-heading font-semibold text-ink-900 mt-0.5 font-mono">
                    {selected.id}
                  </div>
                  <div className="text-[12.5px] text-ink-600 mt-1">
                    {selPatient?.name} · {selPatient?.id} · {selDoctor?.name}
                  </div>
                </div>
                <StatusChip status={selected.status} />
              </div>

              {/* Items */}
              <div className="px-6 py-4 border-b border-ink-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                    Line items
                  </div>
                  {selected.status === "unpaid" && (
                    <div className="relative">
                      <button
                        onClick={() => setAddMenuOpen((o) => !o)}
                        data-testid="billing-add-item"
                        className="btn-ghost btn-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                      {addMenuOpen && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-sm border border-ink-200 bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-[13px] hover:bg-bone"
                            onClick={addItem}
                          >
                            Generic service
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-[13px] hover:bg-bone"
                            onClick={addPharmacyItem}
                          >
                            Pharmacy bundle
                          </button>
                          <div className="border-t border-ink-200 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-ink-400">
                            Lab tests
                          </div>
                          {labCatalog.slice(0, 6).map((t) => (
                            <button
                              key={t.code}
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-bone"
                              onClick={() => addLabItem(t.code)}
                            >
                              <span>{t.code}</span>
                              <span className="font-mono text-[11px]">₹{t.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <table className="w-full text-[13px]">
                  <thead className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    <tr className="border-b border-ink-200">
                      <th className="text-left font-medium pb-2">Description</th>
                      <th className="text-right font-medium pb-2 w-16">Qty</th>
                      <th className="text-right font-medium pb-2 w-24">Unit</th>
                      <th className="text-right font-medium pb-2 w-24">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {selected.items.map((it, idx) => (
                      <tr key={idx} data-testid={`billing-item-${idx}`}>
                        <td className="py-2.5 pr-3">
                          {selected.status === "unpaid" ? (
                            <input
                              value={it.label}
                              onChange={(e) =>
                                updateItem(idx, { label: e.target.value })
                              }
                              className="w-full h-8 px-2 text-[13px] bg-white border border-transparent hover:border-ink-200 rounded-sm focus:outline-none focus:border-sage"
                            />
                          ) : (
                            <span className="text-ink-900">{it.label}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {selected.status === "unpaid" ? (
                            <input
                              type="number"
                              value={it.qty}
                              onChange={(e) =>
                                updateItem(idx, { qty: Number(e.target.value) })
                              }
                              className="w-14 h-8 px-2 text-right text-[13px] bg-white border border-transparent hover:border-ink-200 rounded-sm focus:outline-none focus:border-sage"
                            />
                          ) : (
                            it.qty
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {selected.status === "unpaid" ? (
                            <input
                              type="number"
                              value={it.unit}
                              onChange={(e) =>
                                updateItem(idx, { unit: Number(e.target.value) })
                              }
                              className="w-20 h-8 px-2 text-right text-[13px] bg-white border border-transparent hover:border-ink-200 rounded-sm focus:outline-none focus:border-sage"
                            />
                          ) : (
                            fmt(it.unit)
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono text-ink-900">
                          {fmt(it.amount)}
                        </td>
                        <td className="py-2.5 text-right">
                          {selected.status === "unpaid" && selected.items.length > 1 && (
                            <button
                              data-testid={`billing-remove-item-${idx}`}
                              onClick={() => removeItem(idx)}
                              className="btn-icon"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-status-noshowText" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selected.status === "unpaid" && (
                  <div className="mt-3 pt-3 border-t border-ink-200 flex items-center gap-3">
                    <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                      Discount
                    </div>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
                      <input
                        data-testid="billing-discount"
                        type="number"
                        value={selected.discount}
                        onChange={(e) =>
                          updateInvoice(selected.id, {
                            discount: Number(e.target.value || 0),
                          })
                        }
                        className="h-8 pl-7 pr-2 w-28 text-right text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Totals + actions */}
              <div className="flex-1 grid grid-cols-2 gap-0">
                <div className="px-6 py-5 border-r border-ink-200">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-3">
                    Insurance
                  </div>
                  <div className="text-[13px] text-ink-900">
                    {selPatient?.insurance?.provider}
                  </div>
                  <div className="text-[11px] text-ink-400 font-mono mt-1">
                    {selPatient?.insurance?.policyId}
                  </div>
                  {selected.status === "paid" && (
                    <div className="mt-4 pt-4 border-t border-ink-200">
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-1">
                        Paid by
                      </div>
                      <div className="text-[13px] text-ink-900 inline-flex items-center gap-1.5">
                        {(() => {
                          const M = METHOD_ICON[selected.method] || Receipt;
                          return <M className="w-3.5 h-3.5 text-money" />;
                        })()}
                        {selected.method?.toUpperCase()}
                      </div>
                      {selected.paidAt && (
                        <div className="text-[11px] text-ink-400 font-mono mt-1">
                          {selected.paidAt.replace("T", " · ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span className="font-mono text-ink-900">
                      {fmt(selTotals.subtotal)}
                    </span>
                  </div>
                  {selTotals.discount > 0 && (
                    <div className="flex justify-between text-ink-600">
                      <span>Discount</span>
                      <span className="font-mono text-status-noshowText">
                        −{fmt(selTotals.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-600">
                    <span>Tax (5%)</span>
                    <span className="font-mono text-ink-900">{fmt(selTotals.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-ink-200">
                    <span className="text-[14px] font-medium text-ink-900">
                      Total due
                    </span>
                    <span className="font-mono font-semibold text-[20px] text-ink-900">
                      {fmt(selTotals.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-ink-200 flex flex-wrap gap-2 items-center">
                <button
                  data-testid="billing-print"
                  onClick={() =>
                    printReceipt({
                      invoice: selected,
                      patient: selPatient,
                      doctor: selDoctor,
                      totals: selTotals,
                    })
                  }
                  className="btn-outline"
                >
                  <Printer className="w-4 h-4" />
                  Print receipt
                </button>
                <div className="ml-auto" />
                {selected.status === "unpaid" ? (
                  <button
                    data-testid="billing-collect"
                    onClick={() => setPayOpen(true)}
                    className="btn-money btn-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Collect {fmt(selTotals.total)}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-money/10 text-money text-[13px] font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Paid {selected.paidAt?.slice(11, 16)}
                  </span>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {payOpen && (
        <PayDialog
          invoice={selected}
          totals={selTotals}
          onClose={() => setPayOpen(false)}
          onPay={onPay}
        />
      )}
    </div>
  );
}
