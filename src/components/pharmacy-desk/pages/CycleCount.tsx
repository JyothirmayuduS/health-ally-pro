import { useMemo, useState } from "react";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { cn } from "@/lib/utils";

export default function CycleCount() {
  const { batches, recordCycleCount } = usePharmacyStore();
  const [rackFilter, setRackFilter] = useState("all");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const activeBatches = useMemo(
    () => batches.filter((b) => b.status === "active"),
    [batches],
  );

  const racks = useMemo(
    () => [
      ...new Set(
        activeBatches
          .map((b) => findDrug(b.drug_id)?.location.rack)
          .filter(Boolean),
      ),
    ],
    [activeBatches],
  );

  const filtered = useMemo(
    () =>
      activeBatches.filter((b) => {
        if (rackFilter === "all") return true;
        return findDrug(b.drug_id)?.location.rack === rackFilter;
      }),
    [activeBatches, rackFilter],
  );

  // Summary stats
  const stats = useMemo(() => {
    let counted = 0;
    let variances = 0;
    let shortages = 0;
    let overages = 0;

    filtered.forEach((b) => {
      const val = counts[b.id];
      if (val !== undefined && val !== "") {
        counted++;
        const v = Number(val) - b.qty;
        if (v !== 0) variances++;
        if (v < 0) shortages++;
        if (v > 0) overages++;
      }
    });

    return {
      total: filtered.length,
      counted,
      remaining: filtered.length - counted,
      variances,
      shortages,
      overages,
    };
  }, [filtered, counts]);

  const exportCsv = () => {
    const rows = [
      ["Drug", "Lot", "Rack", "Tray", "Slot", "System Qty", "Counted", "Variance", "Status"],
      ...filtered.map((b) => {
        const drug = findDrug(b.drug_id);
        const counted = counts[b.id] ?? "";
        const variance = counted !== "" ? Number(counted) - b.qty : "";
        return [
          drug?.generic_name ?? b.drug_id,
          b.lot,
          drug?.location.rack ?? "",
          drug?.location.tray ?? "",
          drug?.location.slot ?? "",
          b.qty,
          counted,
          variance,
          submitted.has(b.id) ? "Submitted" : counted !== "" ? "Counted" : "Pending",
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cycle-count-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecord = (batchId: string, qty: number) => {
    recordCycleCount(batchId, qty);
    setSubmitted((prev) => new Set([...prev, batchId]));
    setCounts((c) => {
      const n = { ...c };
      delete n[batchId];
      return n;
    });
  };

  return (
    <div className="space-y-6" data-testid="cycle-count">
      <SectionLabel
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-ink-200"
              onClick={exportCsv}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        }
      >
        Cycle count
      </SectionLabel>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total batches", value: stats.total, icon: BarChart3, color: "text-ink-600" },
          { label: "Counted", value: stats.counted, icon: CheckCircle2, color: "text-sage" },
          { label: "Remaining", value: stats.remaining, icon: ClipboardCheck, color: "text-mustard" },
          { label: "With variances", value: stats.variances, icon: AlertTriangle, color: stats.variances > 0 ? "text-clay" : "text-ink-400" },
          { label: "Shortages", value: stats.shortages, icon: RefreshCw, color: stats.shortages > 0 ? "text-clay" : "text-ink-400" },
          { label: "Overages", value: stats.overages, icon: RefreshCw, color: "text-sage" },
        ].map((s) => (
          <div key={s.label} className="surface p-3 flex items-center gap-3">
            <s.icon className={cn("h-4 w-4 shrink-0", s.color)} />
            <div>
              <div className={cn("font-mono text-[20px] font-bold leading-none", s.color)}>{s.value}</div>
              <div className="mt-0.5 text-[10px] text-ink-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-ink-400">
          <span>Count progress</span>
          <span>{stats.counted} / {stats.total} batches</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-mustard transition-all duration-500"
            style={{ width: stats.total > 0 ? `${(stats.counted / stats.total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Rack filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={rackFilter === "all" ? "default" : "outline"}
          className={rackFilter === "all" ? "btn-primary" : "border-ink-200"}
          onClick={() => setRackFilter("all")}
        >
          All racks
        </Button>
        {racks.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={rackFilter === r ? "default" : "outline"}
            className={rackFilter === r ? "btn-primary" : "border-ink-200"}
            onClick={() => setRackFilter(r!)}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Count table */}
      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 text-left">Drug / Lot</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left w-24">System qty</th>
              <th className="px-4 py-3 text-left w-36">Physical count</th>
              <th className="px-4 py-3 text-left w-20">Variance</th>
              <th className="px-4 py-3 text-right w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const drug = findDrug(b.drug_id);
              const counted = counts[b.id] ?? "";
              const variance = counted !== "" ? Number(counted) - b.qty : null;
              const isSubmitted = submitted.has(b.id);

              return (
                <tr
                  key={b.id}
                  className={cn(
                    "border-b border-stone-100 transition-colors",
                    isSubmitted ? "bg-sage-soft/10" : "hover:bg-stone-50/50",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{drug?.generic_name}</div>
                    <div className="font-mono text-[11px] text-ink-400">{b.lot} · Exp {b.expiry}</div>
                  </td>
                  <td className="px-4 py-3">
                    {drug && <LocationChip location={drug.location} />}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">{b.qty}</td>
                  <td className="px-4 py-3">
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-sage font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Recorded
                      </span>
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-28 border-ink-200 font-mono"
                        placeholder={String(b.qty)}
                        value={counted}
                        onChange={(e) =>
                          setCounts((c) => ({ ...c, [b.id]: e.target.value }))
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!isSubmitted && variance !== null ? (
                      <span
                        className={cn(
                          "font-mono font-bold text-[13px]",
                          variance < 0
                            ? "text-clay"
                            : variance > 0
                              ? "text-sage"
                              : "text-ink-400",
                        )}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance}
                      </span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSubmitted ? (
                      <span className="rounded px-2 py-1 text-[10px] font-bold bg-sage-soft text-sage">Submitted</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "border-ink-200",
                          variance !== null && variance !== 0 && "border-clay/40 text-clay hover:bg-clay-soft/20",
                        )}
                        disabled={counted === ""}
                        onClick={() => handleRecord(b.id, Number(counted))}
                      >
                        Record
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Variance summary footer */}
      {stats.variances > 0 && (
        <div className="rounded-lg border border-clay/30 bg-clay-soft/20 px-4 py-3 text-[13px] text-ink-700">
          <strong className="text-clay">⚠ {stats.variances} variance{stats.variances !== 1 ? "s" : ""} detected.</strong>{" "}
          Review shortages with your supervisor and log any discrepancies in the controlled register. Export the CSV for your count sheet records.
        </div>
      )}

      {stats.total > 0 && stats.counted === stats.total && (
        <div className="rounded-lg border border-sage/30 bg-sage-soft/30 px-4 py-3 text-[13px] text-ink-700">
          <strong className="text-sage">✓ Count complete.</strong>{" "}
          All {stats.total} batches have been physically counted and recorded this session.
        </div>
      )}
    </div>
  );
}
