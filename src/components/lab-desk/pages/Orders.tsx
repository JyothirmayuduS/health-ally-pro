import { useMemo, useState } from "react";
import { useLabStore, formatRelative, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import {
  PriorityPill, StatusPill, SectionLabel, EmptyState,
} from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList, Printer, XCircle, Tag, Stethoscope, CalendarClock, Beaker, UserRound, FileText,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "ordered", label: "Ordered" },
  { value: "collected", label: "Collected" },
  { value: "processing", label: "Processing" },
  { value: "validation", label: "Pending Validation" },
  { value: "validated", label: "Released" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Orders() {
  const {
    orders,
    patients,
    invoices,
    findCatalog,
    cancel,
    collectLabPayment,
    flagInvoiceForReception,
  } = useLabStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const filtered = useMemo(() => {
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => priorityFilter === "all" || o.priority === priorityFilter)
      .filter((o) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const p = getPatient(o, patients);
        return (
          o.id.toLowerCase().includes(q) ||
          o.test_code.toLowerCase().includes(q) ||
          o.test_name.toLowerCase().includes(q) ||
          o.accession?.toLowerCase().includes(q) ||
          p?.name.toLowerCase().includes(q) ||
          p?.mrn.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime());
  }, [orders, statusFilter, priorityFilter, query, patients]);

  const selected = orders.find((o) => o.id === selectedId);
  const selectedPatient = selected && getPatient(selected, patients);
  const selectedCat = selected && findCatalog(selected.test_code);

  const printLabel = (order: import("@/lib/lab-desk/mockData").LabOrder) => {
    const p = getPatient(order, patients);
    const cat = findCatalog(order.test_code);
    const html = `<html><head><title>Label ${order.accession}</title>
      <style>body{font-family:'IBM Plex Mono',monospace;padding:1rem;}
      .label{border:2px solid #1a2924;padding:1rem;width:340px;}
      .row{display:flex;justify-content:space-between;font-size:11px;margin:4px 0;}
      h3{margin:0 0 8px;font-size:14px;letter-spacing:0.05em;}
      .barcode{font-size:24px;letter-spacing:0.2em;text-align:center;margin:8px 0;}
      </style></head><body><div class="label">
      <h3>MEDORA LAB · SPECIMEN</h3>
      <div class="barcode">|||  ${order.accession}  |||</div>
      <div class="row"><span>Patient</span><b>${p?.name || ""}</b></div>
      <div class="row"><span>MRN</span><b>${p?.mrn || ""}</b></div>
      <div class="row"><span>Test</span><b>${order.test_code}</b></div>
      <div class="row"><span>Sample</span><b>${cat?.sample_type || "—"}</b></div>
      <div class="row"><span>Tube</span><b>${cat?.tube || "—"}</b></div>
      <div class="row"><span>Priority</span><b>${order.priority.toUpperCase()}</b></div>
      </div><script>window.print();</script></body></html>`;
    const w = window.open("", "_blank", "width=420,height=560");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6" data-testid="orders-inbox">
      <SectionLabel action={
        <Button variant="outline" size="sm" className="border-ink-200" data-testid="orders-count">
          <ClipboardList className="h-3.5 w-3.5 mr-1.5" />{filtered.length} orders
        </Button>
      }>
        Orders inbox
      </SectionLabel>

      <div className="surface p-4 flex flex-wrap gap-3 items-center" data-testid="orders-filters">
        <Input data-testid="orders-search" placeholder="Search patient, MRN, order ID, test code…"
          value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 min-w-[260px] bg-white border-ink-200" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 border-ink-200" data-testid="filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40 border-ink-200" data-testid="filter-priority"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="stat">STAT</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm" data-testid="orders-table">
          <thead className="bg-stone-50 border-b border-ink-200">
            <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-ink-400">
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Patient</th>
              <th className="text-left px-4 py-3">Test</th>
              <th className="text-left px-4 py-3">Priority</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Ordered</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (<tr><td colSpan={7}><EmptyState icon={ClipboardList} title="No orders found" hint="Adjust filters or check back later." /></td></tr>)}
            {filtered.map((o) => {
              const p = getPatient(o, patients);
              return (
                <tr key={o.id} className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer transition" data-testid={`order-row-${o.id}`} onClick={() => setSelectedId(o.id)}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[13px] font-medium text-ink-900">{o.id}</div>
                    <div className="text-[11px] font-mono text-ink-400">{o.accession}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{p?.name || "—"}</div>
                    <div className="text-[11px] font-mono text-ink-400">{p?.mrn} · {p?.age}{p?.sex}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-900">{o.test_name}</div>
                    <div className="text-[11px] font-mono text-ink-400">{o.test_code} · {o.doctor_name}</div>
                  </td>
                  <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-3 text-ink-600">{formatRelative(o.ordered_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); printLabel(o); }} data-testid={`print-label-${o.id}`}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white" data-testid="order-drawer">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display flex items-center gap-3">
                  <span>{selected.id}</span>
                  <PriorityPill priority={selected.priority} />
                  <StatusPill status={selected.status} />
                </SheetTitle>
                <div className="text-[11px] font-mono text-ink-400 uppercase tracking-wider">Accession {selected.accession}</div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1 flex items-center gap-1.5"><UserRound className="h-3 w-3" /> Patient</div>
                    <div className="font-medium">{selectedPatient?.name}</div>
                    <div className="text-ink-600 text-xs">{selectedPatient?.mrn} · {selectedPatient?.age}{selectedPatient?.sex} · {selectedPatient?.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1 flex items-center gap-1.5"><Stethoscope className="h-3 w-3" /> Ordering doctor</div>
                    <div className="font-medium">{selected.doctor_name}</div>
                    <div className="text-ink-600 text-xs">Source: {selected.source}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1 flex items-center gap-1.5"><Beaker className="h-3 w-3" /> Test</div>
                    <div className="font-medium">{selected.test_name}</div>
                    <div className="text-ink-600 text-xs font-mono">{selected.test_code} · TAT {selectedCat?.tat_hours}h</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1 flex items-center gap-1.5"><Tag className="h-3 w-3" /> Sample</div>
                    <div className="font-medium">{selectedCat?.sample_type}</div>
                    <div className="text-ink-600 text-xs">Tube: {selectedCat?.tube}{selected.fasting ? " · Fasting required" : ""}</div>
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-stone-50 rounded-lg p-3 text-sm border border-ink-200">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1 flex items-center gap-1.5"><FileText className="h-3 w-3" /> Clinical notes</div>
                    <div className="text-ink-900">{selected.notes}</div>
                  </div>
                )}

                {(() => {
                  const inv = invoices.find((i) => i.order_id === selected.id);
                  if (!inv) return null;
                  return (
                    <div className="rounded-lg border border-sage/30 bg-sage-soft/20 p-3 text-sm">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">Billing</div>
                      <div className="flex items-center justify-between">
                        <span>{inv.test_name}</span>
                        <span className="font-mono font-semibold">₹{inv.amount}</span>
                      </div>
                      <div className="mt-1 text-xs capitalize text-ink-500">Status: {inv.status}</div>
                      {inv.status === "unpaid" && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="btn-primary" onClick={() => collectLabPayment(inv.id, "cash")}>
                            Collect cash
                          </Button>
                          <Button size="sm" variant="outline" className="border-ink-200" onClick={() => flagInvoiceForReception(inv.id)}>
                            Bill at reception
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-ink-200" onClick={() => printLabel(selected)} data-testid="drawer-print-label">
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Print label
                  </Button>
                  {selected.status === "ordered" && (
                    <Button size="sm" className="btn-primary" onClick={() => navigate({ to: "/lab/collection" })} data-testid="drawer-collect-btn">
                      Go to collection
                    </Button>
                  )}
                  {!["validated", "cancelled"].includes(selected.status) && (
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => setCancelOpen(true)} data-testid="drawer-cancel-btn">
                      <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel order
                    </Button>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-2 flex items-center gap-1.5"><CalendarClock className="h-3 w-3" /> Timeline</div>
                  <div className="space-y-3 border-l-2 border-ink-200 pl-4 ml-2">
                    {(selected.history || []).map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--sage-500)]" />
                        <div className="text-[13px] text-ink-900">{h.action}</div>
                        <div className="text-xs text-ink-400">{h.actor} · {formatDateTime(h.at)}{h.note ? ` · ${h.note}` : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent data-testid="cancel-dialog">
          <DialogHeader>
            <DialogTitle>Cancel order {selected?.id}</DialogTitle>
            <DialogDescription>Provide a reason — this will mark the order as cancelled.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for cancellation</Label>
            <Textarea data-testid="cancel-reason-input" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Duplicate, patient refused, wrong test…" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button data-testid="confirm-cancel-btn" className="bg-red-600 hover:bg-red-700" disabled={!cancelReason.trim()}
              onClick={() => { cancel(selected!.id, cancelReason); setCancelOpen(false); setCancelReason(""); setSelectedId(null); }}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
