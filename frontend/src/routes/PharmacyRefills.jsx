import React, { useMemo, useState } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import { Phone, User, Stethoscope, Sparkles, Check, X } from "lucide-react";

const TABS = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied",   label: "Denied" },
];

export default function Refills() {
  const ph = usePharmacy();
  const [tab, setTab] = useState("pending");
  const [denyTarget, setDenyTarget] = useState(null);
  const [denyReason, setDenyReason] = useState("");

  const refills = useMemo(
    () => ph.refills.filter((r) => r.status === tab).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)),
    [ph.refills, tab],
  );

  const sourceIcon = (s) => {
    if (s === "patient_app") return <Sparkles className="h-3 w-3" />;
    if (s === "phone")       return <Phone className="h-3 w-3" />;
    if (s === "pharmacist")  return <User className="h-3 w-3" />;
    return <Stethoscope className="h-3 w-3" />;
  };

  const sourceLabel = {
    patient_app: "Patient app",
    phone: "Phone request",
    pharmacist: "Pharmacist initiated",
    doctor: "Doctor renewal",
  };

  return (
    <div data-testid="refills-page">
      <PageHeader
        title="Refill requests"
        subtitle="Renewals for ongoing medications — approve to generate a fresh Rx in the dispense queue."
      >
        <div className="flex items-center gap-1" data-testid="refill-tabs">
          {TABS.map((t) => {
            const count = ph.refills.filter((r) => r.status === t.key).length;
            return (
              <button
                key={t.key}
                data-testid={`refill-tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={classNames(
                  "px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5",
                  tab === t.key
                    ? "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))]"
                    : "text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60",
                )}
              >
                {t.label}
                <span className={classNames(
                  "text-[10px] rounded px-1 py-px tabular-nums",
                  tab === t.key ? "bg-[hsl(var(--paper-50))]/20" : "bg-[hsl(var(--paper-200))]",
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <div className="max-w-[1400px] mx-auto px-8 py-7">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="refill-list">
          {refills.length === 0 && (
            <li className="col-span-full text-center text-muted-foreground py-12">
              No {tab} refill requests.
            </li>
          )}
          {refills.map((r, idx) => {
            const p = ph.getPatient(r.patientId);
            const overdue = r.daysSupplyLeft <= 0;
            const due = r.daysSupplyLeft > 0 && r.daysSupplyLeft <= 7;
            return (
              <li
                key={r.id}
                data-testid={`refill-card-${idx}`}
                className={classNames("pharm-card p-4", overdue && r.status === "pending" && "border-rose-200 bg-rose-50/30")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[hsl(var(--ink))]">{p?.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{p?.mrn} · {r.id.toUpperCase()}</div>
                  </div>
                  <span className={classNames(
                    "pharm-pill",
                    overdue ? "bg-rose-50 border-rose-200 text-rose-800"
                            : due  ? "bg-amber-50 border-amber-200 text-amber-800"
                                   : "bg-emerald-50 border-emerald-200 text-emerald-800",
                  )}>
                    {overdue ? "Overdue" : due ? `${r.daysSupplyLeft}d left` : `${r.daysSupplyLeft}d supply`}
                  </span>
                </div>

                <div className="mt-2 font-display text-[18px] text-[hsl(var(--ink))]">
                  {r.drugSnapshot.name} <span className="text-muted-foreground text-[14px]">· {r.drugSnapshot.strength}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="pharm-pill bg-[hsl(var(--paper-100))] border-border/70 text-muted-foreground">
                    {sourceIcon(r.source)} {sourceLabel[r.source] || r.source}
                  </span>
                  <span>· Requested {fmt.relative(r.requestedAt)}</span>
                  <span>· {r.remainingRefills} refills left</span>
                  {r.autoRefillEligible && (
                    <span className="pharm-pill bg-emerald-50 border-emerald-200 text-emerald-800">
                      <Sparkles className="h-3 w-3" /> Auto-refill
                    </span>
                  )}
                </div>

                {r.status === "denied" && r.deniedReason && (
                  <div className="mt-3 text-[12px] text-rose-700 bg-rose-50/60 border border-rose-200 rounded-md px-3 py-2">
                    Denied: {r.deniedReason}
                  </div>
                )}

                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      data-testid={`approve-refill-${idx}`}
                      onClick={() => ph.approveRefill(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2 text-sm hover:bg-[hsl(var(--sage-700))] transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve → new Rx
                    </button>
                    <button
                      data-testid={`deny-refill-${idx}`}
                      onClick={() => { setDenyTarget(r.id); setDenyReason(""); }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-card px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> Deny
                    </button>
                  </div>
                )}

                {r.status === "approved" && (
                  <div className="mt-3 text-[12px] text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-md px-3 py-2">
                    Approved {fmt.relative(r.approvedAt)} — Rx created in dispense queue.
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="deny-modal">
          <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={() => setDenyTarget(null)} />
          <div className="relative pharm-card w-full max-w-[420px] p-5 animate-rise">
            <h3 className="font-display text-[18px] mb-2">Deny refill</h3>
            <p className="text-[13px] text-muted-foreground mb-3">Add a reason so the patient and doctor know what to do next.</p>
            <textarea
              data-testid="deny-reason-input"
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              rows={3}
              placeholder="e.g. Contact prescriber for renewal"
              className="pharm-input h-auto py-2"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDenyTarget(null)} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
              <button
                data-testid="confirm-deny"
                onClick={() => { ph.denyRefill(denyTarget, denyReason || "Denied"); setDenyTarget(null); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-700 text-white px-3 py-1.5 text-sm hover:bg-rose-800"
              >
                Confirm deny
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
