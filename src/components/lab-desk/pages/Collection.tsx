import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLabStore, formatRelative, getPatient } from "@/lib/lab-desk/store";
import { useTechnicianOrders } from "@/lib/lab-desk/technician";
import { getSpecimenMeta, hasPhysicalSpecimen, tubeVisual } from "@/lib/lab-desk/specimen";
import { PriorityPill, EmptyState } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TestTube2, CheckCircle2, XCircle, Printer, UserCheck, Droplets, ArrowRight, Syringe,
} from "lucide-react";

export default function Collection() {
  const { patients, findCatalog, collect, rejectCollect } = useLabStore();
  const myOrders = useTechnicianOrders();
  const [collectFor, setCollectFor] = useState<ReturnType<typeof useTechnicianOrders>[0] | null>(null);
  const [rejectFor, setRejectFor] = useState<typeof collectFor>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const queue = useMemo(
    () =>
      myOrders
        .filter((o) => o.status === "ordered")
        .sort((a, b) => {
          const pri = { stat: 0, urgent: 1, routine: 2 };
          if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
          return new Date(a.ordered_at).getTime() - new Date(b.ordered_at).getTime();
        }),
    [myOrders],
  );

  const statCount = queue.filter((o) => o.priority === "stat").length;

  const printLabel = (order: (typeof queue)[0]) => {
    const p = getPatient(order, patients);
    const cat = findCatalog(order.test_code);
    const html = `<html><head><title>Label ${order.accession}</title>
      <style>body{font-family:'IBM Plex Mono',monospace;padding:1rem;}
      .label{border:2px solid #7a4a6b;padding:1rem;width:340px;}
      .row{display:flex;justify-content:space-between;font-size:11px;margin:4px 0;}
      h3{margin:0 0 8px;font-size:14px;letter-spacing:0.05em;color:#7a4a6b;}
      .barcode{font-size:24px;letter-spacing:0.2em;text-align:center;margin:8px 0;}
      </style></head><body><div class="label">
      <h3>PHLEBOTOMY · SPECIMEN LABEL</h3>
      <div class="barcode">|||  ${order.accession}  |||</div>
      <div class="row"><span>Patient</span><b>${p?.name || ""}</b></div>
      <div class="row"><span>MRN</span><b>${p?.mrn || ""}</b></div>
      <div class="row"><span>Test</span><b>${order.test_code}</b></div>
      <div class="row"><span>Tube</span><b>${cat?.tube || "—"}</b></div>
      <div class="row"><span>Fasting</span><b>${order.fasting ? "YES" : "NO"}</b></div>
      </div><script>window.print();</script></body></html>`;
    const w = window.open("", "_blank", "width=420,height=560");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6" data-testid="collection-page">
      <div className="border-l-4 border-plum bg-plum-soft/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-700">
          <Syringe className="h-4 w-4 text-plum" />
          <span className="font-medium text-plum">Phlebotomy</span>
          <span className="text-ink-400">→</span>
          <span>Print label</span>
          <span className="text-ink-400">→</span>
          <span>Verify patient</span>
          <span className="text-ink-400">→</span>
          <span>Draw tube</span>
          <span className="text-ink-400">→</span>
          <Link to="/lab/samples" className="font-medium text-plum hover:underline">Track in My samples</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-plum">Draw queue</div>
          <h2 className="font-heading text-xl font-semibold text-ink-900">Collection</h2>
          <p className="mt-1 text-[13px] text-ink-600">
            Patients waiting for venipuncture. Only orders not yet drawn appear here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {statCount > 0 && (
            <span className="rounded-full bg-clay px-2.5 py-1 font-mono text-[11px] font-medium text-white">
              {statCount} STAT
            </span>
          )}
          <span className="font-mono text-[12px] text-ink-400">{queue.length} awaiting draw</span>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="surface border-plum/20 p-8">
          <EmptyState
            icon={TestTube2}
            title="Draw queue is clear"
            hint="New orders appear here. Collected specimens move to My samples."
          />
          <div className="mt-4 text-center">
            <Link to="/lab/samples" className="text-[13px] font-medium text-plum hover:underline">
              View my specimens →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((o) => {
            const p = getPatient(o, patients);
            const cat = findCatalog(o.test_code);
            const tube = tubeVisual(cat?.tube ?? "Lavender");
            return (
              <div
                key={o.id}
                data-testid={`collect-card-${o.id}`}
                className="surface flex flex-col gap-4 border-l-4 border-plum p-4 sm:flex-row sm:items-center"
              >
                <div className={`flex h-14 w-10 shrink-0 flex-col items-center rounded-full border-2 ${tube.ring} bg-white`}>
                  <div className={`h-3 w-full rounded-t-full ${tube.cap}`} />
                  <div className="flex-1" />
                  <span className="pb-1 font-mono text-[8px] text-ink-400">{tube.label}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-plum">{o.accession}</span>
                    <PriorityPill priority={o.priority} />
                    {o.fasting && (
                      <span className="rounded bg-mustard-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-mustard">
                        Fasting
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-medium text-ink-900">{p?.name}</div>
                  <div className="text-[12px] text-ink-500">
                    {p?.mrn} · {p?.age}{p?.sex} · {o.test_code} — {cat?.tube} · {formatRelative(o.ordered_at)}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-plum/30" onClick={() => printLabel(o)}>
                    <Printer className="h-3.5 w-3.5" /> Label
                  </Button>
                  <Button
                    size="sm"
                    className="bg-plum text-white hover:bg-plum/90"
                    onClick={() => { setCollectFor(o); setNote(""); }}
                  >
                    <Droplets className="h-3.5 w-3.5" /> Draw & collect
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-clay"
                    onClick={() => { setRejectFor(o); setReason(""); }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!collectFor} onOpenChange={(o) => !o && setCollectFor(null)}>
        <DialogContent data-testid="collect-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-plum">
              <UserCheck className="h-4 w-4" /> Two-ID verify & draw
            </DialogTitle>
            <DialogDescription>Confirm wristband + verbal ID before venipuncture.</DialogDescription>
          </DialogHeader>
          {collectFor && (() => {
            const p = getPatient(collectFor, patients);
            const cat = findCatalog(collectFor.test_code);
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-plum/30 bg-plum-soft/50 p-4">
                  <div className="font-display text-lg font-semibold">{p?.name}</div>
                  <div className="text-sm text-ink-600">{p?.mrn} · DOB age {p?.age} · {p?.phone}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-ink-400">Tube required</span><div className="font-medium">{cat?.tube}</div></div>
                  <div><span className="text-ink-400">Volume</span><div className="font-medium">~4 mL</div></div>
                  <div><span className="text-ink-400">Test</span><div className="font-medium">{collectFor.test_code}</div></div>
                  <div><span className="text-ink-400">Fasting</span><div className="font-medium">{collectFor.fasting ? "Required" : "Not required"}</div></div>
                </div>
                <div>
                  <Label className="text-xs">Draw note (optional)</Label>
                  <Input placeholder="e.g. difficult vein, right antecubital" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCollectFor(null)}>Cancel</Button>
            <Button className="bg-plum text-white hover:bg-plum/90" onClick={() => { collect(collectFor!.id, note); setCollectFor(null); }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Specimen collected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot collect</DialogTitle>
            <DialogDescription>Patient not fasting, refused draw, or wrong order.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason…" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>Back</Button>
            <Button className="bg-clay text-white" disabled={!reason.trim()} onClick={() => { rejectCollect(rejectFor!.id, reason); setRejectFor(null); }}>
              Return to queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {queue.length > 0 && (
        <p className="text-center text-[12px] text-ink-400">
          After collection, specimens appear in{" "}
          <Link to="/lab/samples" className="text-plum hover:underline">My samples</Link>
          {" "}for rack placement and chain-of-custody.
        </p>
      )}
    </div>
  );
}
