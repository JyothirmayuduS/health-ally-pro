import { useState } from "react";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { SectionLabel, EmptyState } from "@/components/pharmacy-desk/Pills";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { getPatient, formatDateTime } from "@/lib/pharmacy-desk/utils";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Controlled() {
  const { controlled, patients, prescriptions, ddiOverrides } = usePharmacyStore();
  const [tab, setTab] = useState<"narcotic" | "ddi">("narcotic");

  const controlledDrugs = prescriptions
    .flatMap((rx) =>
      rx.lines
        .filter((l) => findDrug(l.drug_id)?.controlled_schedule)
        .map((l) => ({ rx, line: l, drug: findDrug(l.drug_id)! })),
    )
    .filter((x) => ["dispensing", "ready_pickup", "on_hold"].includes(x.rx.status));

  return (
    <div className="space-y-6">
      <SectionLabel>Controlled & Compliance Registry</SectionLabel>

      {/* Tabs */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-sm">
        {[
          { value: "narcotic", label: "Controlled Substance Register" },
          { value: "ddi", label: "DDI Overrides History" }
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value as any)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
              tab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "narcotic" && (
        <>
          <div className="rounded-lg border border-plum/30 bg-plum-soft/30 px-4 py-3 text-[13px] text-ink-600">
            <strong className="text-plum">DEA compliance.</strong> All Schedule II–IV movements require pharmacist ID and witness signature on dispense.
          </div>

          <div className="surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-stone-50">
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Drug</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Pharmacist</th>
                  <th className="px-4 py-3 text-left">Witness</th>
                </tr>
              </thead>
              <tbody>
                {controlled.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={ShieldAlert} title="No entries yet" /></td></tr>
                ) : (
                  controlled.map((e) => {
                    const drug = findDrug(e.drug_id);
                    const patient = getPatient(e.patient_id, patients);
                    return (
                      <tr key={e.id} className="border-b border-stone-100">
                        <td className="px-4 py-3 text-[12px]">{formatDateTime(e.at)}</td>
                        <td className="px-4 py-3 font-medium">{drug?.generic_name}</td>
                        <td className="px-4 py-3">{patient?.name}</td>
                        <td className="px-4 py-3 font-mono">{e.qty}</td>
                        <td className="px-4 py-3 font-mono">{e.balance_after}</td>
                        <td className="px-4 py-3">{e.pharmacist}</td>
                        <td className="px-4 py-3">{e.witness || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {controlledDrugs.length > 0 && (
            <div className="surface p-5">
              <h3 className="font-heading text-[16px] font-semibold text-plum">Pending controlled dispenses</h3>
              <div className="mt-3 space-y-2">
                {controlledDrugs.map(({ rx, drug }) => {
                  const patient = getPatient(rx, patients);
                  return (
                    <div key={`${rx.id}-${drug.id}`} className="flex items-center justify-between rounded-md border border-plum/20 px-4 py-2 text-[13px]">
                      <span>{drug.generic_name} — {patient?.name}</span>
                      <span className="font-mono text-ink-400">{rx.rx_number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "ddi" && (
        <>
          <div className="rounded-lg border border-clay/30 bg-clay-soft/30 px-4 py-3 text-[13px] text-ink-600">
            <strong className="text-clay">Clinical Safety Overrides.</strong> Review overrides of clinical drug-drug interactions logged during dispensing.
          </div>

          <div className="surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-stone-50">
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Rx Reference</th>
                  <th className="px-4 py-3 text-left">Drug Interaction</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Pharmacist</th>
                  <th className="px-4 py-3 text-left">Override Reason</th>
                </tr>
              </thead>
              <tbody>
                {ddiOverrides.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={AlertTriangle} title="No overrides recorded" hint="All interaction alerts are logged here if overridden." /></td></tr>
                ) : (
                  ddiOverrides.map((o) => (
                    <tr key={o.id} className="border-b border-stone-100 text-[13px]">
                      <td className="px-4 py-3 text-[12px]">{formatDateTime(o.timestamp)}</td>
                      <td className="px-4 py-3 font-mono font-medium">{o.rxRef}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink-900">{o.drugA}</span> + <span className="font-semibold text-ink-900">{o.drugB}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-bold uppercase rounded border",
                          o.severity === "major" ? "bg-clay-soft border-clay text-clay" : o.severity === "moderate" ? "bg-mustard-soft border-mustard text-mustard" : "bg-teal-soft border-teal text-teal"
                        )}>
                          {o.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">{o.pharmacistId}</td>
                      <td className="px-4 py-3 text-ink-600 max-w-xs truncate" title={o.reason}>{o.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
