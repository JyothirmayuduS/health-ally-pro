import { useMemo, useState, useEffect } from "react";
import { useLab, formatRelative, getPatient, flagValue } from "@/lab/store";
import { PriorityPill, SectionLabel, EmptyState, FlagBadge } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Microscope, Save, Send, AlertOctagon, ChevronRight, ArrowLeft } from "lucide-react";

export default function Processing() {
  const { orders, patients, findCatalog, saveResults, startProcessing } = useLab();
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({});

  const queue = useMemo(() => orders.filter((o) => o.status === "collected" || o.status === "processing"), [orders]);

  const current = orders.find((o) => o.id === openId);
  const currentCat = current && findCatalog(current.test_code);
  const currentPatient = current && getPatient(current, patients);

  useEffect(() => {
    if (current && current.status === "collected") {
      startProcessing(current.id).catch(() => {});
    }
  }, [current, startProcessing]);

  const openOrder = (o) => { setOpenId(o.id); setDraft({ ...(o.results || {}) }); };

  const handleSave = async (complete) => {
    await saveResults(openId, draft, complete);
    if (complete) setOpenId(null);
  };

  const hasCritical = currentCat?.parameters?.some((p) => flagValue(p, draft[p.key]).level === "critical");
  const allFilled = currentCat?.parameters?.every((p) => draft[p.key] !== undefined && draft[p.key] !== "" && draft[p.key] !== null);

  if (current) {
    return (
      <div className="space-y-6" data-testid="result-entry">
        <button onClick={() => setOpenId(null)} data-testid="back-to-processing" className="text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-[var(--sage-700)] flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to processing queue
        </button>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">{current.accession} · Processing</div>
              <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">{currentPatient?.name} — {current.test_code}</h2>
              <div className="text-sm text-stone-600 mt-1">{current.test_name} · {currentPatient?.mrn} · {currentPatient?.age}{currentPatient?.sex}</div>
            </div>
            <PriorityPill priority={current.priority} />
          </div>

          {hasCritical && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertOctagon className="h-4 w-4" />
              <span>Critical value detected — supervisor will be alerted on submission.</span>
            </div>
          )}

          <div className="space-y-3" data-testid="parameter-form">
            <div className="grid grid-cols-12 gap-3 text-[10px] font-mono uppercase tracking-wider text-stone-500 px-3 pb-2 border-b border-stone-200">
              <div className="col-span-4">Parameter</div>
              <div className="col-span-3">Value</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2">Reference</div>
              <div className="col-span-1 text-right">Flag</div>
            </div>
            {currentCat?.parameters.map((p) => {
              const v = draft[p.key] ?? "";
              const f = flagValue(p, v);
              const refStr = p.ref_text ? p.ref_text : `${p.ref_low ?? "—"}–${p.ref_high ?? "—"}`;
              return (
                <div key={p.key} className={cn("grid grid-cols-12 gap-3 items-center px-3 py-2 rounded-lg transition",
                  f.level === "critical" && "bg-red-50/50",
                  (f.level === "low" || f.level === "high") && "bg-amber-50/30")} data-testid={`param-${p.key}`}>
                  <div className="col-span-4">
                    <div className="text-sm font-medium text-[var(--ink)]">{p.label}</div>
                    <div className="text-[11px] font-mono text-stone-500">{p.key}</div>
                  </div>
                  <div className="col-span-3">
                    <Input data-testid={`input-${p.key}`} value={v} onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                      className="bg-white border-stone-200 font-mono" placeholder="—" />
                  </div>
                  <div className="col-span-2 text-sm text-stone-600 font-mono">{p.unit || "—"}</div>
                  <div className="col-span-2 text-xs text-stone-500 font-mono">{refStr}</div>
                  <div className="col-span-1 flex justify-end"><FlagBadge level={f.level} label={f.label} /></div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="border-stone-200" onClick={() => handleSave(false)} data-testid="save-draft-btn">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save draft
            </Button>
            <Button className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)] ml-auto" onClick={() => handleSave(true)} disabled={!allFilled} data-testid="submit-validation-btn">
              <Send className="h-3.5 w-3.5 mr-1.5" /> Submit for validation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="processing-page">
      <SectionLabel action={<div className="text-xs font-mono uppercase tracking-wider text-stone-500">{queue.length} at the bench</div>}>
        Processing
      </SectionLabel>

      {queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <EmptyState icon={Microscope} title="Nothing on the bench" hint="No collected samples waiting for analysis." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm" data-testid="processing-table">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-stone-500">
                <th className="text-left px-4 py-3">Accession</th>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Test</th>
                <th className="text-left px-4 py-3">Section</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Collected</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((o) => {
                const p = getPatient(o, patients);
                const cat = findCatalog(o.test_code);
                return (
                  <tr key={o.id} data-testid={`process-row-${o.id}`} onClick={() => openOrder(o)} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-[13px]">{o.accession}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-[11px] font-mono text-stone-500">{p?.mrn}</div>
                    </td>
                    <td className="px-4 py-3">{o.test_code}</td>
                    <td className="px-4 py-3 capitalize text-stone-700">{cat?.section}</td>
                    <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                    <td className="px-4 py-3 text-stone-600">{formatRelative(o.collected_at)}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="h-4 w-4 inline text-stone-400" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
