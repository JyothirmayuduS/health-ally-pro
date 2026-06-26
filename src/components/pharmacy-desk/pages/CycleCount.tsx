import { useState } from "react";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardCheck } from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";

export default function CycleCount() {
  const { batches, recordCycleCount } = usePharmacyStore();
  const [rackFilter, setRackFilter] = useState("all");
  const [counts, setCounts] = useState<Record<string, string>>({});

  const activeBatches = batches.filter((b) => b.status === "active");
  const racks = [...new Set(activeBatches.map((b) => findDrug(b.drug_id)?.location.rack).filter(Boolean))];

  const filtered = activeBatches.filter((b) => {
    if (rackFilter === "all") return true;
    return findDrug(b.drug_id)?.location.rack === rackFilter;
  });

  return (
    <div className="space-y-6">
      <SectionLabel action={
        <Button variant="outline" size="sm" className="border-ink-200">
          <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> {filtered.length} batches to count
        </Button>
      }>
        Cycle count
      </SectionLabel>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={rackFilter === "all" ? "default" : "outline"} className={rackFilter === "all" ? "btn-primary" : "border-ink-200"} onClick={() => setRackFilter("all")}>All racks</Button>
        {racks.map((r) => (
          <Button key={r} size="sm" variant={rackFilter === r ? "default" : "outline"} className={rackFilter === r ? "btn-primary" : "border-ink-200"} onClick={() => setRackFilter(r!)}>{r}</Button>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 text-left">Drug</th>
              <th className="px-4 py-3 text-left">Lot</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">System qty</th>
              <th className="px-4 py-3 text-left">Counted</th>
              <th className="px-4 py-3 text-right">Submit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const drug = findDrug(b.drug_id);
              const counted = counts[b.id] ?? "";
              const variance = counted !== "" ? Number(counted) - b.qty : null;
              return (
                <tr key={b.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium">{drug?.generic_name}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{b.lot}</td>
                  <td className="px-4 py-3">{drug && <LocationChip location={drug.location} />}</td>
                  <td className="px-4 py-3 font-mono">{b.qty}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      className="h-8 w-24 border-ink-200"
                      placeholder={String(b.qty)}
                      value={counted}
                      onChange={(e) => setCounts((c) => ({ ...c, [b.id]: e.target.value }))}
                    />
                    {variance !== null && variance !== 0 && (
                      <span className={`ml-2 text-[11px] ${variance < 0 ? "text-clay" : "text-sage"}`}>
                        {variance > 0 ? "+" : ""}{variance}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-ink-200"
                      disabled={counted === ""}
                      onClick={() => {
                        recordCycleCount(b.id, Number(counted));
                        setCounts((c) => { const n = { ...c }; delete n[b.id]; return n; });
                      }}
                    >
                      Record
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
