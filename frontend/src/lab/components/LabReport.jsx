import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { flagValue, formatDateTime } from "@/lab/store";

export default function LabReport({ order, patient, catalog, hospital, onClose }) {
  if (!order) return null;
  const handlePrint = () => window.print();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-white max-h-[90vh] overflow-y-auto" data-testid="lab-report-modal">
        <div className="no-print flex items-center justify-between px-6 py-3 border-b border-stone-200 sticky top-0 bg-white z-10">
          <div className="text-xs font-mono uppercase tracking-wider text-stone-500">Preview — Official Lab Report</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose} data-testid="close-report-btn"><X className="h-4 w-4 mr-1.5" /> Close</Button>
            <Button size="sm" className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" onClick={handlePrint} data-testid="print-report-btn">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
            </Button>
          </div>
        </div>

        <div className="print-area px-10 py-10 text-[var(--ink)]">
          <div className="flex items-start justify-between pb-6 border-b-2 border-[var(--sage-700)]">
            <div>
              <div className="font-display text-2xl font-bold text-[var(--sage-900)] tracking-tight">{hospital.name}</div>
              <div className="text-sm text-stone-600 mt-1">{hospital.tagline}</div>
              <div className="text-xs text-stone-500 mt-2 leading-relaxed">{hospital.address}<br />{hospital.phone} · {hospital.email}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-semibold">LABORATORY REPORT</div>
              <div className="text-xs font-mono text-stone-500 mt-1">{hospital.clia}</div>
              <div className="text-xs font-mono text-stone-500 mt-1">Report ID: {order.id}</div>
              <div className="text-xs font-mono text-stone-500">Accession: {order.accession}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Patient</div>
              <div className="font-semibold text-base">{patient?.name}</div>
              <div className="text-stone-600">{patient?.mrn} · {patient?.age}{patient?.sex}<br />{patient?.phone}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Order</div>
              <div className="text-stone-700">Ordered by: <b>{order.doctor_name}</b></div>
              <div className="text-xs text-stone-500 mt-2">Collected: {formatDateTime(order.collected_at)}<br />Reported: {formatDateTime(order.released_at)}</div>
            </div>
          </div>

          <div className="mt-8 mb-2">
            <div className="font-display text-lg font-semibold border-b border-stone-300 pb-2">
              {catalog?.name} <span className="font-mono text-sm text-stone-500">({catalog?.code})</span>
            </div>
            <div className="text-xs text-stone-500 mt-1">Sample: {catalog?.sample_type} · Section: {catalog?.section}</div>
          </div>

          <table className="w-full text-sm mt-4 border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-300 text-left">
                <th className="py-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-medium">Parameter</th>
                <th className="py-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-medium">Result</th>
                <th className="py-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-medium">Unit</th>
                <th className="py-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-medium">Reference</th>
                <th className="py-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody>
              {catalog?.parameters.map((p) => {
                const v = order.results?.[p.key];
                const f = flagValue(p, v);
                const ref = p.ref_text ? p.ref_text : `${p.ref_low ?? "—"}–${p.ref_high ?? "—"}`;
                return (
                  <tr key={p.key} className="border-b border-stone-100">
                    <td className="py-2.5">{p.label}</td>
                    <td className="py-2.5 font-mono font-semibold">{v ?? "—"}</td>
                    <td className="py-2.5 font-mono text-stone-600">{p.unit}</td>
                    <td className="py-2.5 font-mono text-stone-600">{ref}</td>
                    <td className="py-2.5">
                      {f.level === "critical" && <span className="font-mono font-bold text-red-700">{f.label.toUpperCase()}</span>}
                      {(f.level === "low" || f.level === "high") && <span className="font-mono font-semibold text-amber-700">{f.label}</span>}
                      {f.level === "normal" && <span className="text-stone-400">Normal</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {order.notes && (
            <div className="mt-6 text-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Clinical context</div>
              <div className="text-stone-700 italic">{order.notes}</div>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-stone-300 grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-stone-500 mb-8 font-mono uppercase tracking-wider">Validated by</div>
              <div className="border-t border-stone-400 pt-2">
                <div className="font-semibold">{order.validated_by || hospital.lab_director}</div>
                <div className="text-stone-500">{hospital.lab_director}</div>
              </div>
            </div>
            <div className="text-right text-stone-500">
              <div className="font-mono">Report generated {formatDateTime(new Date().toISOString())}</div>
              <div className="mt-2">— End of report —</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
