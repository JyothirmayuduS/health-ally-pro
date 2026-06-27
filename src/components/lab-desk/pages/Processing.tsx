import { useMemo, useState, useEffect } from "react";
import { useLabStore, formatRelative, formatDateTime, getPatient, flagValue } from "@/lib/lab-desk/store";
import { PriorityPill, SectionLabel, EmptyState, FlagBadge } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Microscope, Save, Send, AlertOctagon, ChevronRight, ArrowLeft, ShieldAlert } from "lucide-react";

export default function Processing() {
  const { orders, patients, findCatalog, saveResults, startProcessing, reagents, supervisorOverrideCondition } = useLabStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [overrideReason, setOverrideReason] = useState("");

  const queue = useMemo(() => orders.filter((o) => o.status === "collected" || o.status === "processing"), [orders]);

  const current = orders.find((o) => o.id === openId);
  const currentCat = current && findCatalog(current.test_code);
  const currentPatient = current && getPatient(current, patients);

  useEffect(() => {
    if (current && current.status === "collected") {
      startProcessing(current.id);
    }
  }, [current, startProcessing]);

  const openOrder = (o: import("@/lib/lab-desk/mockData").LabOrder) => { setOpenId(o.id); setDraft({ ...(o.results as Record<string,string> || {}) }); };

  const handleSave = (complete: boolean) => {
    saveResults(openId!, draft, complete);
    if (complete) setOpenId(null);
  };

  const hasCritical = currentCat?.parameters?.some((p) => flagValue(p, draft[p.key]).level === "critical");
  const allFilled = currentCat?.parameters?.every((p) => draft[p.key] !== undefined && draft[p.key] !== "" && draft[p.key] !== null);

  // Reagent lot status evaluation for current order
  const reagentStatus = useMemo(() => {
    if (!current) return { blocked: false, warning: false, list: [] };
    const code = current.test_code.toLowerCase();
    const linked = reagents.filter((r) => r.testCodes.includes(code));
    let blocked = false;
    let warning = false;

    linked.forEach((r) => {
      const isExpired = new Date(r.expiryDate).getTime() < Date.now();
      const isOutOfStock = r.testsRemaining <= 0;
      if (isExpired || isOutOfStock) blocked = true;
      else if (r.testsRemaining / r.maxTests < 0.2) warning = true;
    });

    return { blocked, warning, list: linked };
  }, [current, reagents]);

  if (current) {
    return (
      <div className="space-y-6" data-testid="result-entry">
        <button onClick={() => setOpenId(null)} data-testid="back-to-processing" className="text-xs font-mono uppercase tracking-wider text-ink-600 hover:text-[var(--sage-700)] flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to processing queue
        </button>

        <div className="surface p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">{current.accession} · Processing</div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">{currentPatient?.name} — {current.test_code}</h2>
              <div className="text-sm text-ink-600 mt-1">{current.test_name} · {currentPatient?.mrn} · {currentPatient?.age}{currentPatient?.sex}</div>
            </div>
            <PriorityPill priority={current.priority} />
          </div>

          {/* Persistent STAT escalated banner */}
          {current.priority === "stat" && hasCritical && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-100 border border-red-300 text-red-900 text-sm animate-pulse-border">
              <AlertOctagon className="h-4 w-4 text-red-700" />
              <span><strong>STAT ESCALATION ACTIVE:</strong> Critical result detected. Order priority has been escalated to STAT for immediate validation.</span>
            </div>
          )}

          {/* Reagent lot status banner messages */}
          {reagentStatus.blocked && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertOctagon className="h-4 w-4 text-red-600" />
              <span><strong>Hard Block:</strong> Expired or out-of-stock reagent lot detected. Reagent: {reagentStatus.list.map(r => r.name).join(", ")}. Cannot save results.</span>
            </div>
          )}

          {!reagentStatus.blocked && reagentStatus.warning && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <AlertOctagon className="h-4 w-4 text-amber-600" />
              <span><strong>Warning:</strong> Low reagent stock remaining (&lt; 20%) for {reagentStatus.list.map(r => r.name).join(", ")}. Proceed with caution.</span>
            </div>
          )}

          {/* Non-adequate specimen condition block */}
          {(() => {
            const cond = current.specimen?.condition;
            const nonAdequate = cond && cond !== "Adequate";
            const hasOverride = !!current.sampleConditionOverride;
            if (!nonAdequate) return null;
            if (hasOverride) {
              return (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                  <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Supervisor override in effect.</span>{" "}
                    Specimen condition: <span className="font-mono font-bold">{cond}</span>. Processing is allowed.
                    <div className="text-xs text-amber-700 mt-0.5">
                      Overridden by {current.sampleConditionOverride!.overriddenBy} · Reason: {current.sampleConditionOverride!.reason}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="mb-4 space-y-3 p-4 rounded-xl border-2 border-red-300 bg-red-50 text-sm">
                <div className="flex items-start gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-900 text-base">🚫 Hard Block — Non-Adequate Specimen</div>
                    <div className="text-red-800 mt-0.5">
                      Specimen condition recorded as <span className="font-mono font-bold">{cond}</span>. Result entry is blocked until a Lab Supervisor grants an override.
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-red-700">Supervisor Override Reason</label>
                  <Input
                    placeholder="Enter override justification (e.g. patient cannot be re-drawn, clinician accepted risk)…"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="border-red-200 bg-white focus:border-red-400"
                  />
                  <button
                    type="button"
                    disabled={!overrideReason.trim()}
                    onClick={() => {
                      supervisorOverrideCondition(current.id, overrideReason, "Lab Supervisor");
                      setOverrideReason("");
                    }}
                    className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-red-700 transition"
                  >
                    <ShieldAlert className="inline h-3.5 w-3.5 mr-1" /> Grant Override & Allow Processing
                  </button>
                </div>
              </div>
            );
          })()}

          {hasCritical && !reagentStatus.blocked && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertOctagon className="h-4 w-4" />
              <span>Critical value detected — supervisor will be alerted on submission.</span>
            </div>
          )}

          <div className="space-y-3" data-testid="parameter-form">
            <div className="grid grid-cols-12 gap-3 text-[10px] font-mono uppercase tracking-wider text-ink-400 px-3 pb-2 border-b border-ink-200">
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
                    <div className="text-sm font-medium text-ink-900">{p.label}</div>
                    <div className="text-[11px] font-mono text-ink-400">{p.key}</div>
                  </div>
                  <div className="col-span-3">
                   <Input data-testid={`input-${p.key}`} value={v} onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                      className="bg-white border-ink-200 font-mono" placeholder="—"
                      disabled={reagentStatus.blocked || (!!current.specimen?.condition && current.specimen.condition !== "Adequate" && !current.sampleConditionOverride)} />
                  </div>
                  <div className="col-span-2 text-sm text-ink-600 font-mono">{p.unit || "—"}</div>
                  <div className="col-span-2 text-xs text-ink-400 font-mono">{refStr}</div>
                  <div className="col-span-1 flex justify-end"><FlagBadge level={f.level} label={f.label} /></div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="border-ink-200" onClick={() => handleSave(false)} disabled={reagentStatus.blocked} data-testid="save-draft-btn">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save draft
            </Button>
            <Button className="btn-primary ml-auto" onClick={() => handleSave(true)} disabled={!allFilled || reagentStatus.blocked} data-testid="submit-validation-btn">
              <Send className="h-3.5 w-3.5 mr-1.5" /> Submit for validation
            </Button>
          </div>

          {/* Chain of Custody Timeline */}
          <div className="mt-8 pt-6 border-t border-ink-200">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-400 mb-4">Sample Chain of Custody Audit Trail</h4>
            <div className="relative border-l-2 border-stone-200 pl-4 ml-2 space-y-4 text-xs">
              {current.chainOfCustody?.map((c, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[23px] mt-0.5 h-2.5 w-2.5 rounded-full bg-sage border-2 border-white" />
                  <div className="font-semibold text-ink-800 capitalize">{c.step.replace(/_/g, " ")}</div>
                  <div className="text-ink-500">{c.performedBy} · {c.location} · {formatDateTime(c.performedAt)}</div>
                  {c.notes && <div className="text-[11px] text-ink-400 italic mt-0.5">&quot;{c.notes}&quot;</div>}
                </div>
              ))}
              {!current.chainOfCustody?.some((c) => c.step === "assigned_to_bench") && (
                <div className="relative text-ink-400">
                  <div className="absolute -left-[23px] mt-0.5 h-2.5 w-2.5 rounded-full bg-stone-300 border-2 border-white" />
                  <div>Awaiting Bench Assignment</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="processing-page">
      <SectionLabel action={<div className="text-xs font-mono uppercase tracking-wider text-ink-400">{queue.length} at the bench</div>}>
        Processing
      </SectionLabel>

      {queue.length === 0 ? (
        <div className="surface p-8">
          <EmptyState icon={Microscope} title="Nothing on the bench" hint="No collected samples waiting for analysis." />
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm" data-testid="processing-table">
            <thead className="bg-stone-50 border-b border-ink-200">
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-ink-400">
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
                      <div className="text-[11px] font-mono text-ink-400">{p?.mrn}</div>
                    </td>
                    <td className="px-4 py-3">{o.test_code}</td>
                    <td className="px-4 py-3 capitalize text-stone-700">{cat?.section}</td>
                    <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                    <td className="px-4 py-3 text-ink-600">{formatRelative(o.collected_at)}</td>
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
