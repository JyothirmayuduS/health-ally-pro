import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  usePharmacyStore,
  formatRelative,
  formatDateTime,
  getPatient,
  availableQty,
  fefoBatch,
} from "@/lib/pharmacy-desk/store";
import {
  PriorityPill,
  RxStatusPill,
  PaymentPill,
  SectionLabel,
  EmptyState,
  LocationChip,
  PickPath,
} from "@/components/pharmacy-desk/Pills";
import PharmacyPayDialog from "@/components/pharmacy-desk/PharmacyPayDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardList,
  CheckCircle,
  PauseCircle,
  XCircle,
  Package,
  AlertTriangle,
  Stethoscope,
  IndianRupee,
  Printer,
  Receipt,
} from "lucide-react";
import { zoneLabel } from "@/lib/pharmacy-desk/location";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { balanceDue, fmtInr, printPharmacyReceipt, type PaymentMethod } from "@/lib/pharmacy-desk/billing";
import { cn } from "@/lib/utils";

function medsSummary(rx: { lines: { drug_id: string }[] }) {
  return rx.lines
    .map((l) => findDrug(l.drug_id))
    .filter(Boolean)
    .map((d) => `${d!.generic_name} ${d!.strength}`)
    .join(" · ");
}

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "received", label: "Received" },
  { value: "in_review", label: "In review" },
  { value: "on_hold", label: "On hold" },
  { value: "ready_to_dispense", label: "Ready" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_TABS = [
  { value: "all", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export default function Prescriptions() {
  const {
    prescriptions,
    patients,
    batches,
    findDrug,
    acceptRx,
    holdRx,
    rejectRx,
    startDispense,
    getInvoiceForRx,
    collectRxPayment,
  } = usePharmacyStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [holdOpen, setHoldOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    return prescriptions
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => priorityFilter === "all" || r.priority === priorityFilter)
      .filter((r) => paymentFilter === "all" || r.payment_status === paymentFilter)
      .filter((r) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const p = getPatient(r, patients);
        return (
          r.rx_number.toLowerCase().includes(q) ||
          p?.name.toLowerCase().includes(q) ||
          p?.mrn.toLowerCase().includes(q) ||
          r.doctor_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  }, [prescriptions, statusFilter, priorityFilter, paymentFilter, query, patients]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
    if (selectedId && !filtered.find((r) => r.id === selectedId) && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = prescriptions.find((r) => r.id === selectedId);
  const selectedPatient = selected && getPatient(selected, patients);
  const invoice = selected ? getInvoiceForRx(selected.id) : undefined;
  const unpaidCount = prescriptions.filter((r) => r.payment_status !== "paid" && r.status !== "cancelled").length;

  function handlePay(method: PaymentMethod, amount: number) {
    if (!selected) return;
    collectRxPayment(selected.id, method, amount);
    setPayOpen(false);
  }

  return (
    <div className="space-y-5" data-testid="prescriptions-inbox">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>Prescriptions inbox</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-ink-200 bg-white px-3 py-1.5 font-mono text-[11px] text-ink-600">
            {filtered.length} in queue
          </span>
          {unpaidCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-clay/30 bg-clay-soft px-3 py-1.5 text-[11px] font-medium text-clay">
              <IndianRupee className="h-3.5 w-3.5" />
              {unpaidCount} awaiting payment
            </span>
          )}
        </div>
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Search Rx #, patient, MRN, doctor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[220px] flex-1 border-ink-200 bg-white"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-ink-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 border-ink-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="stat">STAT</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPaymentFilter(tab.value)}
              className={cn(
                "rounded px-2.5 py-1.5 text-[11px] font-medium transition",
                paymentFilter === tab.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* List panel */}
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
            Incoming prescriptions
          </div>
          <div className="max-h-[calc(100vh-280px)] divide-y divide-ink-100 overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No prescriptions" hint="Doctor e-Rx orders appear here automatically." />
            ) : (
              filtered.map((rx) => {
                const p = getPatient(rx, patients);
                const active = selectedId === rx.id;
                return (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => setSelectedId(rx.id)}
                    className={cn(
                      "w-full px-4 py-3.5 text-left transition",
                      active ? "border-l-2 border-mustard bg-mustard-soft/40" : "border-l-2 border-transparent hover:bg-stone-50/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[12px] font-semibold text-ink-900">{rx.rx_number}</div>
                        <div className="mt-0.5 truncate text-[13px] font-medium text-ink-900">{p?.name}</div>
                        <div className="truncate text-[11px] text-ink-500">{rx.doctor_name}</div>
                      </div>
                      <PaymentPill status={rx.payment_status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <PriorityPill priority={rx.priority} />
                      <RxStatusPill status={rx.status} />
                      <span className="text-[10px] text-ink-400">{formatRelative(rx.received_at)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="surface lg:col-span-3">
          {!selected || !selectedPatient ? (
            <EmptyState icon={ClipboardList} title="Select a prescription" hint="Choose an order from the list to review, bill, and accept." />
          ) : (
            <div className="flex max-h-[calc(100vh-280px)] flex-col">
              <div className="border-b border-ink-200 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-[20px] font-semibold text-ink-900">{selected.rx_number}</h2>
                      {selected.source === "doctor" && (
                        <span className="rounded-sm border border-sage/20 bg-sage-soft px-2 py-0.5 font-mono text-[9px] uppercase text-sage">
                          From doctor
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-600">
                      <Stethoscope className="h-3.5 w-3.5 text-sage" />
                      {selected.doctor_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PriorityPill priority={selected.priority} />
                    <RxStatusPill status={selected.status} />
                    <PaymentPill status={selected.payment_status} />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {/* Patient */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-ink-200 bg-white p-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">Patient</div>
                    <div className="mt-2 font-heading text-[17px] font-semibold text-ink-900">{selectedPatient.name}</div>
                    <div className="mt-1 font-mono text-[12px] text-ink-600">{selectedPatient.mrn}</div>
                    <div className="text-[12px] text-ink-500">
                      {selectedPatient.age}y {selectedPatient.sex} · {selectedPatient.phone}
                    </div>
                    {selectedPatient.allergies.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-clay">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {selectedPatient.allergies.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Billing */}
                  <div className="rounded-lg border border-ink-200 bg-gradient-to-br from-bone to-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                        <Receipt className="h-3.5 w-3.5" />
                        Billing
                      </div>
                      {invoice && (
                        <span className="font-mono text-[11px] text-ink-500">{invoice.invoice_number}</span>
                      )}
                    </div>
                    {invoice ? (
                      <>
                        <div className="mt-3 space-y-1.5 text-[12px]">
                          {invoice.lines.map((line) => (
                            <div key={line.drug_id} className="flex justify-between gap-2 text-ink-700">
                              <span className="min-w-0 truncate">{line.description} × {line.qty}</span>
                              <span className="shrink-0 font-mono">{fmtInr(line.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1 border-t border-ink-200 pt-3 text-[12px] text-ink-600">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">{fmtInr(invoice.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (5%)</span>
                            <span className="font-mono">{fmtInr(invoice.tax)}</span>
                          </div>
                          <div className="flex justify-between text-[14px] font-semibold text-ink-900">
                            <span>Total</span>
                            <span className="font-mono">{fmtInr(invoice.total)}</span>
                          </div>
                          {invoice.amount_paid > 0 && (
                            <div className="flex justify-between text-status-doneText">
                              <span>Paid</span>
                              <span className="font-mono">{fmtInr(invoice.amount_paid)}</span>
                            </div>
                          )}
                          {selected.payment_status !== "paid" && (
                            <div className="flex justify-between font-semibold text-clay">
                              <span>Balance due</span>
                              <span className="font-mono">{fmtInr(balanceDue(invoice))}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selected.payment_status !== "paid" && (
                            <Button size="sm" className="btn-primary" onClick={() => setPayOpen(true)}>
                              <IndianRupee className="mr-1.5 h-3.5 w-3.5" />
                              Collect payment
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-ink-200"
                            onClick={() => invoice && printPharmacyReceipt(invoice)}
                          >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            Receipt
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-[12px] text-ink-500">Invoice pending…</p>
                    )}
                  </div>
                </div>

                {selected.clinical_flags && selected.clinical_flags.length > 0 && (
                  <div className="rounded-lg border border-clay/30 bg-clay-soft/20 px-4 py-3 text-[13px] text-clay">
                    {selected.clinical_flags.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                )}

                {/* Medications */}
                <div>
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    Medications · {selected.lines.length} lines
                  </div>
                  <div className="space-y-3">
                    {selected.lines.map((line) => {
                      const drug = findDrug(line.drug_id);
                      const drugBatches = batches.filter((b) => b.drug_id === line.drug_id);
                      const avail = availableQty(drugBatches);
                      const fefo = fefoBatch(drugBatches);
                      if (!drug) return null;
                      return (
                        <div key={line.id} className="rounded-lg border border-ink-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-ink-900">{drug.generic_name} {drug.strength}</div>
                              <div className="text-[11px] text-ink-400">{drug.form} · {drug.brand_names[0]}</div>
                              <div className="mt-1 text-[12px] text-ink-600">{line.sig}</div>
                            </div>
                            <span
                              className={cn(
                                "rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase",
                                line.stock_ok ? "bg-status-doneBg text-status-doneText" : "bg-clay-soft text-clay",
                              )}
                            >
                              {line.stock_ok ? "In stock" : "Low / out"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <LocationChip location={drug.location} size="md" />
                            <span className="text-[11px] text-ink-400">{zoneLabel(drug.location.zone)} · {drug.location.temp}</span>
                          </div>
                          <PickPath location={drug.location} />
                          <div className="mt-2 font-mono text-[11px] text-ink-500">
                            Qty {line.qty_prescribed} · Available {avail}
                            {fefo && ` · FEFO ${fefo.lot} exp ${new Date(fefo.expiry).toLocaleDateString()}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">Timeline</div>
                  <div className="ml-2 space-y-2.5 border-l-2 border-ink-200 pl-4">
                    {selected.history.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-mustard" />
                        <div className="text-[13px] text-ink-900">{h.action}</div>
                        <div className="text-[11px] text-ink-400">{h.actor} · {formatDateTime(h.at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-2 border-t border-ink-200 bg-stone-50/60 px-5 py-3">
                {["received", "in_review"].includes(selected.status) && (
                  <>
                    <Button
                      size="sm"
                      className="btn-primary"
                      disabled={selected.payment_status === "unpaid"}
                      title={selected.payment_status === "unpaid" ? "Collect payment before accepting" : undefined}
                      onClick={() => acceptRx(selected.id)}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Accept for dispense
                    </Button>
                    {selected.payment_status === "unpaid" && (
                      <Button size="sm" variant="outline" className="border-clay/30 text-clay" onClick={() => setPayOpen(true)}>
                        <IndianRupee className="mr-1.5 h-3.5 w-3.5" /> Pay first
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-ink-200" onClick={() => setHoldOpen(true)}>
                      <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Hold
                    </Button>
                    <Button size="sm" variant="ghost" className="text-clay" onClick={() => setRejectOpen(true)}>
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {selected.status === "ready_to_dispense" && (
                  <Button
                    size="sm"
                    className="btn-primary"
                    onClick={() => {
                      startDispense(selected.id);
                      navigate({ to: "/pharmacy/dispense" });
                    }}
                  >
                    <Package className="mr-1.5 h-3.5 w-3.5" /> Start dispense
                  </Button>
                )}
                <p className="ml-auto hidden text-[11px] text-ink-400 sm:block">{medsSummary(selected)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PharmacyPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        invoice={invoice ?? null}
        onPay={handlePay}
      />

      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Place on hold</DialogTitle><DialogDescription>Clinical or stock review required.</DialogDescription></DialogHeader>
          <Label>Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Allergy check, interaction…" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setHoldOpen(false)}>Cancel</Button>
            <Button disabled={!reason.trim()} onClick={() => { holdRx(selected!.id, reason); setHoldOpen(false); setReason(""); }}>Confirm hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject prescription</DialogTitle></DialogHeader>
          <Label>Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button className="bg-clay hover:bg-clay/90" disabled={!reason.trim()} onClick={() => { rejectRx(selected!.id, reason); setRejectOpen(false); setReason(""); }}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
