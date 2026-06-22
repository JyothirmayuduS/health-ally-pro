import { useState } from "react";
import { useLab, formatRelative, getPatient, getDoctor } from "@/lab/store";
import { findCatalog } from "@/lab/mockData";
import { PriorityPill, SectionLabel, EmptyState } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TestTube2,
  CheckCircle2,
  XCircle,
  Printer,
  UserCheck,
  Droplets,
} from "lucide-react";
import { toast } from "sonner";

export default function Collection() {
  const { orders, patients, doctors, collectSample, rejectAtCollection, activeStaff } = useLab();
  const [collectFor, setCollectFor] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const queue = orders
    .filter((o) => o.status === "ordered")
    .sort((a, b) => {
      const pri = { stat: 0, urgent: 1, routine: 2 };
      if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
      return new Date(a.ordered_at) - new Date(b.ordered_at);
    });

  const printLabel = (order) => {
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
      <div class="row"><span>Patient</span><b>${p?.name}</b></div>
      <div class="row"><span>MRN</span><b>${p?.mrn}</b></div>
      <div class="row"><span>Test</span><b>${order.test_code}</b></div>
      <div class="row"><span>Sample</span><b>${cat?.sample_type}</b></div>
      <div class="row"><span>Tube</span><b>${cat?.tube}</b></div>
      <div class="row"><span>Priority</span><b>${order.priority.toUpperCase()}</b></div>
      </div><script>window.print();</script></body></html>`;
    const w = window.open("", "_blank", "width=420,height=560");
    w.document.write(html); w.document.close();
  };

  return (
    <div className="space-y-6" data-testid="collection-page">
      <SectionLabel
        action={
          <div className="text-xs font-mono uppercase tracking-wider text-stone-500">
            Phlebotomy · {queue.length} waiting
          </div>
        }
      >
        Sample collection
      </SectionLabel>

      {queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <EmptyState icon={TestTube2} title="Collection queue is clear" hint="No samples waiting for draw." />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {queue.map((o) => {
            const p = getPatient(o, patients);
            const d = getDoctor(o, doctors);
            const cat = findCatalog(o.test_code);
            return (
              <div
                key={o.id}
                data-testid={`collect-card-${o.id}`}
                className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
                      {o.accession}
                    </div>
                    <div className="font-display text-lg font-semibold text-[var(--ink)] mt-0.5">
                      {p?.name}
                    </div>
                    <div className="text-xs font-mono text-stone-500">
                      {p?.mrn} · {p?.age}{p?.sex} · ordered {formatRelative(o.ordered_at)}
                    </div>
                  </div>
                  <PriorityPill priority={o.priority} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm bg-stone-50 rounded-lg p-3 mb-4 border border-stone-100">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Test</div>
                    <div className="font-medium">{o.test_code}</div>
                    <div className="text-xs text-stone-600 truncate">{o.test_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Sample</div>
                    <div className="font-medium">{cat?.tube}</div>
                    <div className="text-xs text-stone-600 truncate">{cat?.sample_type}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Doctor</div>
                    <div className="text-xs text-stone-700">{d?.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Prep</div>
                    <div className="text-xs text-stone-700">{o.fasting ? "Fasting required" : "None"}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-stone-200"
                    onClick={() => printLabel(o)}
                    data-testid={`print-${o.id}`}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Label
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)] flex-1"
                    onClick={() => { setCollectFor(o); setNote(""); }}
                    data-testid={`mark-collect-${o.id}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark collected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => { setRejectFor(o); setReason(""); }}
                    data-testid={`reject-${o.id}`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collect dialog */}
      <Dialog open={!!collectFor} onOpenChange={(o) => !o && setCollectFor(null)}>
        <DialogContent data-testid="collect-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[var(--sage-700)]" />
              Verify patient & collect
            </DialogTitle>
          </DialogHeader>
          {collectFor && (() => {
            const p = getPatient(collectFor, patients);
            const cat = findCatalog(collectFor.test_code);
            return (
              <div className="space-y-4">
                <div className="bg-[var(--sage-50)] border border-[var(--sage-100)] rounded-lg p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--sage-900)] mb-1">
                    Confirm identity
                  </div>
                  <div className="font-display text-lg font-semibold">{p?.name}</div>
                  <div className="text-sm text-stone-600">
                    {p?.mrn} · {p?.age}{p?.sex} · {p?.phone}
                  </div>
                </div>
                <div className="text-sm grid grid-cols-2 gap-3">
                  <div><span className="text-stone-500">Test:</span> <b>{collectFor.test_code}</b></div>
                  <div><span className="text-stone-500">Tube:</span> <b>{cat?.tube}</b></div>
                  <div><span className="text-stone-500">Sample:</span> <b className="text-xs">{cat?.sample_type}</b></div>
                  <div><span className="text-stone-500">Fasting:</span> <b>{collectFor.fasting ? "Yes" : "No"}</b></div>
                </div>
                <div>
                  <Label className="text-xs">Collection note (optional)</Label>
                  <Input
                    data-testid="collect-note-input"
                    placeholder="Difficult draw, partial sample…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCollectFor(null)}>Cancel</Button>
            <Button
              data-testid="confirm-collect-btn"
              className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]"
              onClick={() => {
                collectSample(collectFor.id, { collector: activeStaff, note });
                toast.success(`Sample collected for ${collectFor.id}`);
                setCollectFor(null);
              }}
            >
              <Droplets className="h-3.5 w-3.5 mr-1.5" />
              Confirm collected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent data-testid="reject-collect-dialog">
          <DialogHeader>
            <DialogTitle>Reject at collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Reason</Label>
            <Textarea
              data-testid="reject-reason-input"
              placeholder="Insufficient sample, wrong tube, not fasting…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Back</Button>
            <Button
              data-testid="confirm-reject-btn"
              className="bg-red-600 hover:bg-red-700"
              disabled={!reason.trim()}
              onClick={() => {
                rejectAtCollection(rejectFor.id, reason);
                toast(`Order ${rejectFor.id} returned for re-collection`);
                setRejectFor(null);
              }}
            >
              Reject & re-queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
