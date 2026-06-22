import { useMemo, useState } from "react";
import { useLab, formatRelative, formatDateTime, getPatient, getDoctor } from "@/lab/store";
import { findCatalog } from "@/lab/mockData";
import {
  PriorityPill,
  StatusPill,
  SectionLabel,
  EmptyState,
} from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Printer,
  XCircle,
  Tag,
  Stethoscope,
  CalendarClock,
  Beaker,
  UserRound,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "ordered", label: "Ordered" },
  { value: "collected", label: "Collected" },
  { value: "processing", label: "Processing" },
  { value: "validation", label: "Pending Validation" },
  { value: "validated", label: "Released" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersInbox() {
  const { orders, patients, doctors, cancelOrder } = useLab();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
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
      .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at));
  }, [orders, statusFilter, priorityFilter, query, patients]);

  const selected = orders.find((o) => o.id === selectedId);
  const selectedPatient = selected && getPatient(selected, patients);
  const selectedDoctor = selected && getDoctor(selected, doctors);
  const selectedCat = selected && findCatalog(selected.test_code);

  const printLabel = (order) => {
    // Open a printable label window
    const p = getPatient(order, patients);
    const html = `
      <html><head><title>Label ${order.accession}</title>
      <style>
        body{font-family:'IBM Plex Mono',monospace;padding:1rem;}
        .label{border:2px solid #1a2924;padding:1rem;width:340px;}
        .row{display:flex;justify-content:space-between;font-size:11px;margin:4px 0;}
        h3{margin:0 0 8px;font-size:14px;letter-spacing:0.05em;}
        .barcode{font-size:24px;letter-spacing:0.2em;text-align:center;margin:8px 0;}
      </style></head>
      <body><div class="label">
        <h3>MEDORA LAB · SPECIMEN</h3>
        <div class="barcode">|||  ${order.accession}  |||</div>
        <div class="row"><span>Patient</span><b>${p?.name}</b></div>
        <div class="row"><span>MRN</span><b>${p?.mrn}</b></div>
        <div class="row"><span>Test</span><b>${order.test_code}</b></div>
        <div class="row"><span>Sample</span><b>${findCatalog(order.test_code)?.sample_type || "—"}</b></div>
        <div class="row"><span>Tube</span><b>${findCatalog(order.test_code)?.tube || "—"}</b></div>
        <div class="row"><span>Ordered</span><b>${new Date(order.ordered_at).toLocaleString()}</b></div>
        <div class="row"><span>Priority</span><b>${order.priority.toUpperCase()}</b></div>
      </div>
      <script>window.print();</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=420,height=560");
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-6" data-testid="orders-inbox">
      <SectionLabel
        action={
          <Button asChild variant="outline" className="border-stone-200" size="sm">
            <a href="#" data-testid="orders-count">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              {filtered.length} orders
            </a>
          </Button>
        }
      >
        Orders inbox
      </SectionLabel>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-wrap gap-3 items-center" data-testid="orders-filters">
        <Input
          data-testid="orders-search"
          placeholder="Search patient, MRN, order ID, test code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[260px] bg-white border-stone-200"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 border-stone-200" data-testid="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40 border-stone-200" data-testid="filter-priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="stat">STAT</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm" data-testid="orders-table">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-stone-500">
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={ClipboardList} title="No orders found" hint="Adjust filters or check back later." />
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const p = getPatient(o, patients);
              const d = getDoctor(o, doctors);
              return (
                <tr
                  key={o.id}
                  className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer transition"
                  data-testid={`order-row-${o.id}`}
                  onClick={() => setSelectedId(o.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-[13px] font-medium text-[var(--ink)]">{o.id}</div>
                    <div className="text-[11px] font-mono text-stone-500">{o.accession}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--ink)]">{p?.name}</div>
                    <div className="text-[11px] font-mono text-stone-500">
                      {p?.mrn} · {p?.age}{p?.sex}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[var(--ink)]">{o.test_name}</div>
                    <div className="text-[11px] font-mono text-stone-500">{o.test_code} · {d?.name}</div>
                  </td>
                  <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-3 text-stone-600">{formatRelative(o.ordered_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); printLabel(o); }}
                      data-testid={`print-label-${o.id}`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
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
                <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  Accession {selected.accession}
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
                      <UserRound className="h-3 w-3" /> Patient
                    </div>
                    <div className="font-medium">{selectedPatient?.name}</div>
                    <div className="text-stone-600 text-xs">{selectedPatient?.mrn} · {selectedPatient?.age}{selectedPatient?.sex} · {selectedPatient?.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3" /> Ordering doctor
                    </div>
                    <div className="font-medium">{selectedDoctor?.name}</div>
                    <div className="text-stone-600 text-xs">{selectedDoctor?.specialty}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
                      <Beaker className="h-3 w-3" /> Test
                    </div>
                    <div className="font-medium">{selected.test_name}</div>
                    <div className="text-stone-600 text-xs font-mono">{selected.test_code} · TAT {selectedCat?.tat_hours}h</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
                      <Tag className="h-3 w-3" /> Sample
                    </div>
                    <div className="font-medium">{selectedCat?.sample_type}</div>
                    <div className="text-stone-600 text-xs">Tube: {selectedCat?.tube}{selected.fasting ? " · Fasting required" : ""}</div>
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-stone-50 rounded-lg p-3 text-sm border border-stone-200">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" /> Clinical notes
                    </div>
                    <div className="text-[var(--ink)]">{selected.notes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-stone-200"
                    onClick={() => printLabel(selected)}
                    data-testid="drawer-print-label"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Print label
                  </Button>
                  {selected.status === "ordered" && (
                    <Button
                      size="sm"
                      className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]"
                      onClick={() => navigate("/lab/collection")}
                      data-testid="drawer-collect-btn"
                    >
                      Go to collection
                    </Button>
                  )}
                  {!["validated", "cancelled"].includes(selected.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                      onClick={() => setCancelOpen(true)}
                      data-testid="drawer-cancel-btn"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel order
                    </Button>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                    <CalendarClock className="h-3 w-3" /> Timeline
                  </div>
                  <div className="space-y-3 border-l-2 border-stone-200 pl-4 ml-2">
                    {(selected.history || []).map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--sage-500)]" />
                        <div className="text-[13px] text-[var(--ink)]">{h.action}</div>
                        <div className="text-xs text-stone-500">
                          {h.actor} · {formatDateTime(h.at)}
                          {h.note ? ` · ${h.note}` : ""}
                        </div>
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
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for cancellation</Label>
            <Textarea
              data-testid="cancel-reason-input"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Duplicate order, patient refused, wrong test…"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button
              data-testid="confirm-cancel-btn"
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason.trim()}
              onClick={() => {
                cancelOrder(selected.id, cancelReason);
                setCancelOpen(false);
                setCancelReason("");
                setSelectedId(null);
              }}
            >
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
