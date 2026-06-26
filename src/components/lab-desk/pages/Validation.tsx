import { useMemo, useState } from "react";
import { useLabStore, formatRelative, formatDateTime, getPatient, flagValue } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { PriorityPill, SectionLabel, EmptyState, FlagBadge, StatusPill } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Printer, ShieldCheck, ArrowLeft, AlertOctagon } from "lucide-react";
import LabReport from "@/components/lab-desk/LabReport";

export default function Validation() {
  const { orders, patients, findCatalog, validate, rejectValid, hospital } = useLabStore();
  const { isSupervisor, session } = useLabAuth();
  const [openId, setOpenId] = useState(null);
  const [comment, setComment] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [printOrderId, setPrintOrderId] = useState(null);

  const queue = useMemo(() => orders.filter((o) => o.status === "validation"), [orders]);
  const released = useMemo(
    () => orders.filter((o) => o.status === "validated").sort((a, b) => new Date(b.released_at) - new Date(a.released_at)).slice(0, 6),
    [orders],
  );

  const current = orders.find((o) => o.id === openId);
  const currentCat = current && findCatalog(current.test_code);
  const currentPatient = current && getPatient(current, patients);
  const printOrder = orders.find((o) => o.id === printOrderId);
  const hasCritical = currentCat?.parameters?.some((p) => flagValue(p, current?.results?.[p.key]).level === "critical");

  if (current) {
    return (
      <div className="space-y-6" data-testid="validation-detail">
        <button onClick={() => { setOpenId(null); setComment(""); setRejectMode(false); }} data-testid="back-to-validation"
          className="text-xs font-mono uppercase tracking-wider text-ink-600 hover:text-[var(--sage-700)] flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to validation queue
        </button>

        <div className="surface p-6">
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-ink-200">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">{current.accession} · Pending validation</div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">{currentPatient?.name} — {current.test_code}</h2>
              <div className="text-sm text-ink-600 mt-1">{current.test_name} · ordered by {current.doctor_name} · completed {formatRelative(current.completed_at)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PriorityPill priority={current.priority} />
              <StatusPill status={current.status} />
            </div>
          </div>

          {!isSupervisor && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Only <b>Lab Supervisors</b> can validate or reject results.</span>
            </div>
          )}

          {hasCritical && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertOctagon className="h-4 w-4" />
              <span><b>Critical value</b> present — dual sign-off required. Confirm doctor notification before release.</span>
            </div>
          )}

          <div className="grid grid-cols-12 gap-3 text-[10px] font-mono uppercase tracking-wider text-ink-400 px-3 pb-2 border-b border-ink-200">
            <div className="col-span-4">Parameter</div>
            <div className="col-span-3">Value</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-3 text-right">Flag</div>
          </div>
          <div className="space-y-1">
            {currentCat?.parameters.map((p) => {
              const v = current.results?.[p.key];
              const f = flagValue(p, v);
              const refStr = p.ref_text ? p.ref_text : `${p.ref_low ?? "—"}–${p.ref_high ?? "—"} ${p.unit}`;
              return (
                <div key={p.key} className={cn("grid grid-cols-12 gap-3 items-center px-3 py-2.5 rounded-lg",
                  f.level === "critical" && "bg-red-50",
                  (f.level === "low" || f.level === "high") && "bg-amber-50/40")} data-testid={`val-param-${p.key}`}>
                  <div className="col-span-4">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-[11px] font-mono text-ink-400">{p.key}</div>
                  </div>
                  <div className="col-span-3 font-mono text-[15px] font-semibold text-ink-900">
                    {v ?? "—"} <span className="text-xs text-ink-400 font-normal">{p.unit}</span>
                  </div>
                  <div className="col-span-2 text-xs text-ink-400 font-mono">{refStr}</div>
                  <div className="col-span-3 flex justify-end"><FlagBadge level={f.level} label={f.label} /></div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            <Label className="text-xs">Supervisor comment {rejectMode ? "(required for rejection)" : "(optional)"}</Label>
            <Textarea data-testid="validation-comment" value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={rejectMode ? "Reason to send back to technician…" : "Internal note (e.g. delta check OK)"} />
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="border-ink-200" onClick={() => setPrintOrderId(current.id)} data-testid="preview-report-btn">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Preview report
            </Button>
            <div className="ml-auto flex gap-2">
              {rejectMode ? (
                <>
                  <Button variant="ghost" onClick={() => { setRejectMode(false); setComment(""); }}>Back</Button>
                  <Button className="bg-red-600 hover:bg-red-700" disabled={!comment.trim() || !isSupervisor}
                    onClick={() => { rejectValid(current.id, comment); setOpenId(null); }} data-testid="confirm-reject-validation">
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Confirm reject
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50" disabled={!isSupervisor}
                    onClick={() => setRejectMode(true)} data-testid="reject-validation-btn">
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                  </Button>
                  <Button className="btn-primary" disabled={!isSupervisor}
                    onClick={() => { validate(current.id, comment, session?.fullName); setOpenId(null); }} data-testid="approve-release-btn">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve & release
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {printOrder && (
          <LabReport order={printOrder} patient={getPatient(printOrder, patients)}
            catalog={findCatalog(printOrder.test_code)} hospital={hospital} onClose={() => setPrintOrderId(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="validation-page">
      <SectionLabel action={<div className="text-xs font-mono uppercase tracking-wider text-ink-400">{queue.length} awaiting · {released.length} released today</div>}>
        Validation &amp; release
      </SectionLabel>

      {queue.length === 0 ? (
        <div className="surface p-8">
          <EmptyState icon={ShieldCheck} title="Validation queue is clear" hint="All completed results have been released." />
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm" data-testid="validation-table">
            <thead className="bg-stone-50 border-b border-ink-200">
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-ink-400">
                <th className="text-left px-4 py-3">Accession</th>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Test</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Completed</th>
                <th className="text-left px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((o) => {
                const p = getPatient(o, patients);
                const cat = findCatalog(o.test_code);
                const flags = cat?.parameters.map((pp) => flagValue(pp, o.results?.[pp.key])).filter((f) => f.level !== "normal" && f.level !== "empty");
                const hasCrit = flags?.some((f) => f.level === "critical");
                return (
                  <tr key={o.id} data-testid={`validation-row-${o.id}`} onClick={() => setOpenId(o.id)}
                    className={cn("border-b border-stone-100 cursor-pointer transition", hasCrit ? "hover:bg-red-50/40" : "hover:bg-stone-50")}>
                    <td className="px-4 py-3 font-mono text-[13px]">{o.accession}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-[11px] font-mono text-ink-400">{p?.mrn}</div>
                    </td>
                    <td className="px-4 py-3">{o.test_code}</td>
                    <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                    <td className="px-4 py-3 text-ink-600">{formatRelative(o.completed_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {(flags?.length ?? 0) === 0 ? <span className="text-xs text-stone-400">All normal</span> :
                          flags.slice(0, 3).map((f, i) => <FlagBadge key={i} {...f} />)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {released.length > 0 && (
        <div className="surface p-5" data-testid="recently-released">
          <h3 className="font-display font-semibold text-ink-900 mb-3">Recently released</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {released.map((o) => {
              const p = getPatient(o, patients);
              return (
                <div key={o.id} className="border border-ink-200 rounded-lg p-3 hover:bg-stone-50 cursor-pointer" onClick={() => setPrintOrderId(o.id)} data-testid={`released-${o.id}`}>
                  <div className="text-xs font-mono text-ink-400">{o.id} · {formatDateTime(o.released_at)}</div>
                  <div className="font-medium text-sm mt-0.5">{p?.name} — {o.test_code}</div>
                  <div className="text-xs text-ink-400">Released by {o.validated_by}</div>
                  <div className="text-xs text-[var(--sage-700)] mt-1 hover:underline">Print report →</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {printOrder && (
        <LabReport order={printOrder} patient={getPatient(printOrder, patients)}
          catalog={findCatalog(printOrder.test_code)} hospital={hospital} onClose={() => setPrintOrderId(null)} />
      )}
    </div>
  );
}
