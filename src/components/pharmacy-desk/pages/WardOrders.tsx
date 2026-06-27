import { useMemo, useState } from "react";
import { usePharmacyStore, getPatient, type WastageEntry } from "@/lib/pharmacy-desk/store";
import { SectionLabel, PriorityPill, LocationChip, PickPath, EmptyState } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BedDouble, Truck, PackageCheck, MapPin, ArchiveRestore, Trash2, ShieldAlert, FileText, ClipboardList } from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { formatRelative, formatDateTime } from "@/lib/pharmacy-desk/utils";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "pending", "picking", "in_transit", "delivered"] as const;

export default function WardOrders() {
  const {
    wardOrders,
    patients,
    startWardPick,
    deliverWardOrder,
    returns,
    restockWardReturn,
    disposeWardReturn,
    wastage,
    drugs
  } = usePharmacyStore();

  const [activeTab, setActiveTab] = useState<"requisitions" | "unit-dose" | "returns">("requisitions");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Return & Disposal states
  const [returnsSubTab, setReturnsSubTab] = useState<"pending" | "wastage">("pending");
  const [disposalTargetId, setDisposalTargetId] = useState<string | null>(null);
  const [disposalMethod, setDisposalMethod] = useState<WastageEntry["disposalMethod"]>("Pharmacy bin");
  const [disposalReason, setDisposalReason] = useState("");

  const filteredRequisitions = useMemo(() => {
    const list = filter === "all" ? wardOrders : wardOrders.filter((w) => w.status === filter);
    return [...list].sort((a, b) => {
      const p = { stat: 0, urgent: 1, routine: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [wardOrders, filter]);

  const selected = filteredRequisitions.find((w) => w.id === selectedId) ?? filteredRequisitions[0];
  const patient = selected && getPatient(selected.patient_id, patients);
  const drug = selected && findDrug(selected.drug_id);

  const unitDoses = useMemo(() => {
    return wardOrders.filter((w) => w.status === "delivered");
  }, [wardOrders]);

  // Wastage calculations
  const wastageSummary = useMemo(() => {
    let total = 0;
    const byCategory: Record<string, number> = {};

    wastage.forEach((entry) => {
      total += entry.cost;
      byCategory[entry.drugCategory] = (byCategory[entry.drugCategory] || 0) + entry.cost;
    });

    return { total, byCategory };
  }, [wastage]);

  return (
    <div className="space-y-6" data-testid="ward-orders">
      <SectionLabel action={
        <div className="flex gap-2">
          {activeTab === "requisitions" && (
            <Button variant="outline" size="sm" className="border-ink-200">
              <BedDouble className="mr-1.5 h-3.5 w-3.5" /> {filteredRequisitions.filter((w) => w.status !== "delivered").length} active
            </Button>
          )}
          {activeTab === "unit-dose" && (
            <Button variant="outline" size="sm" className="border-ink-200">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> {unitDoses.length} active doses
            </Button>
          )}
          {activeTab === "returns" && (
            <Button variant="outline" size="sm" className="border-ink-200">
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" /> {returns.filter((r) => r.status === "pending").length} returns
            </Button>
          )}
        </div>
      }>
        Ward & IPD deliveries
      </SectionLabel>

      {/* Main Tabs */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-md">
        {[
          { value: "requisitions", label: "Ward Requisitions" },
          { value: "unit-dose", label: "Unit-Dose Dispensing" },
          { value: "returns", label: "Returns & Wastage" }
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setActiveTab(t.value as any);
              setSelectedId(null);
            }}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
              activeTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Requisitions tab */}
      {activeTab === "requisitions" && (
        <>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className={filter === f ? "btn-primary" : "border-ink-200"} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f.replace("_", " ")}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="surface lg:col-span-1 divide-y divide-ink-100">
              {filteredRequisitions.length === 0 ? (
                <EmptyState icon={BedDouble} title="No ward orders" />
              ) : (
                filteredRequisitions.map((w) => {
                  const p = getPatient(w.patient_id, patients);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedId(w.id)}
                      className={`w-full px-4 py-3 text-left transition ${selected?.id === w.id ? "bg-teal-soft/50" : "hover:bg-stone-50"}`}
                    >
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={w.priority} />
                        <span className="font-mono text-[11px] uppercase text-ink-400">{w.status.replace("_", " ")}</span>
                      </div>
                      <div className="mt-1 font-medium text-ink-900">{w.ward} · Bed {w.bed}</div>
                      <div className="text-[12px] text-ink-600">{p?.name} · Nurse {w.nurse}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="surface lg:col-span-2 p-5">
              {!selected || !drug ? (
                <EmptyState icon={Truck} title="Select ward order" />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-[20px] font-semibold">{selected.ward} — Bed {selected.bed}</h3>
                      <p className="text-[13px] text-ink-600">{patient?.name} · {patient?.mrn} · Nurse {selected.nurse}</p>
                      <p className="mt-1 text-[12px] text-ink-400">Requested {formatRelative(selected.requested_at)}</p>
                    </div>
                    <PriorityPill priority={selected.priority} />
                  </div>

                  <div className="mt-6 rounded-lg border border-teal/30 bg-teal-soft/30 p-4">
                    <div className="font-medium text-ink-900">{drug.generic_name} {drug.strength}</div>
                    <div className="text-[12px] text-ink-600">Qty {selected.qty} · {drug.form}</div>
                    {selected.notes && <p className="mt-2 text-[12px] text-ink-500">{selected.notes}</p>}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase text-ink-400">
                      <MapPin className="h-3.5 w-3.5" /> Pick location
                    </div>
                    <LocationChip location={drug.location} size="md" />
                    <div className="mt-3"><PickPath location={drug.location} /></div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {selected.status === "pending" && (
                      <Button className="btn-primary" onClick={() => startWardPick(selected.id)}>
                        <PackageCheck className="mr-1.5 h-4 w-4" /> Start pick
                      </Button>
                    )}
                    {["picking", "in_transit"].includes(selected.status) && (
                      <Button className="btn-primary" onClick={() => deliverWardOrder(selected.id)}>
                        <Truck className="mr-1.5 h-4 w-4" /> Confirm delivered to ward
                      </Button>
                    )}
                    {selected.status === "delivered" && (
                      <span className="text-[13px] text-sage font-medium">✓ Delivered</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Unit-Dose tab */}
      {activeTab === "unit-dose" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-3">
            <h3 className="font-heading text-[15px] font-semibold text-ink-900">Active Unit-Dose Roster</h3>
            <p className="text-[12.5px] text-ink-500">Track and audit single-dose layouts distributed to hospital nursing units.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Ward/Bed</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Medication</th>
                <th className="px-4 py-3 text-left">Dispensed Qty</th>
                <th className="px-4 py-3 text-left">Nurse Assigner</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {unitDoses.length === 0 ? (
                <tr><td colSpan={6} className="text-center"><EmptyState icon={BedDouble} title="No unit-doses currently active" /></td></tr>
              ) : (
                unitDoses.map((u) => {
                  const p = getPatient(u.patient_id, patients);
                  const d = findDrug(u.drug_id);
                  return (
                    <tr key={u.id} className="border-b border-stone-100">
                      <td className="px-4 py-3 font-medium">{u.ward} · Bed {u.bed}</td>
                      <td className="px-4 py-3">{p?.name || "Unknown Patient"}</td>
                      <td className="px-4 py-3">{d?.generic_name} {d?.strength} ({d?.form})</td>
                      <td className="px-4 py-3 font-mono text-[13px]">{u.qty}</td>
                      <td className="px-4 py-3 text-ink-600">{u.nurse}</td>
                      <td className="px-4 py-3 text-right text-sage font-medium">✓ Delivered & Logged</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Returns & Wastage tab */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-xs">
            {[
              { value: "pending", label: "Pending Returns" },
              { value: "wastage", label: "Wastage Log" }
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setReturnsSubTab(t.value as any)}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
                  returnsSubTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {returnsSubTab === "pending" && (
            <div className="surface overflow-hidden">
              <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-3">
                <h3 className="font-heading text-[15px] font-semibold text-ink-900">Ward Returns Queue</h3>
                <p className="text-[12.5px] text-ink-500">Unused medication returns requested by floor nurses. Pharmacist must verify to restock or dispose.</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-ink-200 bg-stone-50">
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-3 text-left">Ward/Bed</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Medication (Lot)</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Nurse</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.filter((r) => r.status === "pending").length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={ArchiveRestore} title="No return requests pending" /></td></tr>
                  ) : (
                    returns
                      .filter((r) => r.status === "pending")
                      .map((ret) => {
                        const p = getPatient(ret.patient_id, patients);
                        const d = findDrug(ret.drug_id);
                        const isDisposing = disposalTargetId === ret.id;

                        return (
                          <tr key={ret.id} className="border-b border-stone-100">
                            <td className="px-4 py-3 font-medium">{ret.ward} · Bed {ret.bed}</td>
                            <td className="px-4 py-3">{p?.name}</td>
                            <td className="px-4 py-3">
                              <div>{d?.generic_name} {d?.strength}</div>
                              <span className="font-mono text-[11px] text-ink-400">Batch Lot: {ret.batch_id}</span>
                            </td>
                            <td className="px-4 py-3 font-mono">{ret.qty}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-[11px] rounded bg-bone border border-ink-200 text-ink-700">
                                {ret.reason}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ink-600">{ret.submitted_by}</td>
                            <td className="px-4 py-3 text-right">
                              {!isDisposing ? (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    className="bg-sage hover:bg-sage/90 text-white h-7 px-2.5"
                                    onClick={() => restockWardReturn(ret.id)}
                                  >
                                    <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restock
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-clay hover:bg-clay/90 text-white h-7 px-2.5"
                                    onClick={() => setDisposalTargetId(ret.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Dispose
                                  </Button>
                                </div>
                              ) : (
                                <div className="bg-bone border border-ink-200 rounded p-3 text-left space-y-2 max-w-sm ml-auto">
                                  <div className="text-[12px] font-semibold text-clay flex items-center justify-between">
                                    <span>Confirm Drug Disposal</span>
                                    <button onClick={() => setDisposalTargetId(null)} className="text-ink-400 hover:text-ink-600 text-[14px]">✕</button>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-ink-600 uppercase">Method</label>
                                    <select
                                      value={disposalMethod}
                                      onChange={(e) => setDisposalMethod(e.target.value as any)}
                                      className="w-full text-[12px] bg-white border border-ink-200 rounded h-7 px-1.5 focus:outline-none"
                                    >
                                      <option>Pharmacy bin</option>
                                      <option>Incineration</option>
                                      <option>Return to supplier</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-ink-600 uppercase">Reason notes</label>
                                    <Input
                                      placeholder="Reason for write-off…"
                                      value={disposalReason}
                                      onChange={(e) => setDisposalReason(e.target.value)}
                                      className="h-7 text-[12px] bg-white border-ink-200"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[11px] border-ink-200 px-2"
                                      onClick={() => setDisposalTargetId(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="btn-primary bg-clay hover:bg-clay/90 text-white h-7 text-[11px] px-2.5"
                                      disabled={!disposalReason.trim()}
                                      onClick={() => {
                                        disposeWardReturn(ret.id, disposalMethod, disposalReason);
                                        setDisposalTargetId(null);
                                        setDisposalReason("");
                                      }}
                                    >
                                      Confirm Write-off
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {returnsSubTab === "wastage" && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="surface p-4 border-l-4 border-l-clay">
                  <div className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider">Total Monthly Wastage Value</div>
                  <div className="font-heading text-[24px] font-semibold text-clay mt-1.5">
                    ₹{(wastageSummary.total * 90).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-ink-400 mt-1">Calculated from item unit costs</div>
                </div>
                {Object.entries(wastageSummary.byCategory).map(([cat, val]) => (
                  <div key={cat} className="surface p-4 border-l-4 border-l-ink-300">
                    <div className="font-mono text-[10px] uppercase font-bold text-ink-400 tracking-wider">{cat} Wastage</div>
                    <div className="font-heading text-[24px] font-semibold text-ink-900 mt-1.5">
                      ₹{(val * 90).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-ink-400 mt-1">Month-to-date write-offs</div>
                  </div>
                ))}
              </div>

              {/* Wastage Table */}
              <div className="surface overflow-hidden">
                <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-3">
                  <h3 className="font-heading text-[15px] font-semibold text-ink-900">Disposal & Wastage Logs</h3>
                  <p className="text-[12.5px] text-ink-500">Track expired, contaminated, or damaged medications written off from active inventory.</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-ink-200 bg-stone-50">
                    <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Drug Name</th>
                      <th className="px-4 py-3 text-left">Batch ID</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">Disposal Method</th>
                      <th className="px-4 py-3 text-left">Wastage Cost</th>
                      <th className="px-4 py-3 text-left">Reason / Audit notes</th>
                      <th className="px-4 py-3 text-right">Processed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wastage.length === 0 ? (
                      <tr><td colSpan={8}><EmptyState icon={Trash2} title="No items disposed this month" /></td></tr>
                    ) : (
                      wastage.map((entry) => (
                        <tr key={entry.id} className="border-b border-stone-100 text-[13px]">
                          <td className="px-4 py-3 text-[12px]">{formatDateTime(entry.processedAt)}</td>
                          <td className="px-4 py-3 font-medium">{entry.drugName}</td>
                          <td className="px-4 py-3 font-mono text-[12px]">{entry.batchId}</td>
                          <td className="px-4 py-3 font-mono">{entry.qty}</td>
                          <td className="px-4 py-3 text-ink-700">
                            <span className="px-2 py-0.5 rounded border border-clay/20 bg-clay-soft/10 text-clay text-[11px] font-medium">
                              {entry.disposalMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">₹{(entry.cost * 90).toFixed(2)}</td>
                          <td className="px-4 py-3 text-ink-600 max-w-xs truncate" title={entry.reason}>{entry.reason}</td>
                          <td className="px-4 py-3 text-right text-ink-500">{entry.processedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
