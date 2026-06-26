import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { usePharmacyStore, availableQty } from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip } from "@/components/pharmacy-desk/Pills";
import { RACK_LAYOUT } from "@/lib/pharmacy-desk/mockData";
import { cn } from "@/lib/utils";

export default function StorageMap() {
  const { drugs, batches } = usePharmacyStore();
  const { highlight } = useSearch({ strict: false }) as { highlight?: string };

  const slotsByRack = useMemo(() => {
    const map: Record<string, typeof drugs> = {};
    for (const d of drugs) {
      const key = `${d.location.aisle}-${d.location.rack}`;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [drugs]);

  return (
    <div className="space-y-6" data-testid="storage-map">
      <SectionLabel>Shelf map</SectionLabel>

      <div className="rounded-lg border border-ink-200 bg-stone-50/50 px-4 py-3 text-[13px] text-ink-600">
        Click a cell to see drug details. Colors: <span className="text-sage">main</span> · <span className="text-teal">cold</span> · <span className="text-plum">controlled</span> · <span className="text-mustard">OTC</span>
      </div>

      <div className="space-y-8">
        {RACK_LAYOUT.map((aisle) => (
          <div key={aisle.aisle} className="surface p-5">
            <div className="mb-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">Aisle {aisle.aisle}</div>
              <h3 className="font-heading text-[17px] font-semibold text-ink-900">{aisle.label}</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {aisle.racks.map((rack) => {
                const key = `${aisle.aisle}-${rack}`;
                const rackDrugs = slotsByRack[key] ?? [];
                return (
                  <div key={rack} className="rounded-lg border border-ink-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[13px] font-semibold text-ink-900">{rack}</span>
                      <span className="text-[11px] text-ink-400">{rackDrugs.length} SKUs</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {rackDrugs.length === 0 ? (
                        <div className="col-span-4 py-6 text-center text-[11px] text-ink-400">Empty rack</div>
                      ) : (
                        rackDrugs.map((d) => {
                          const avail = availableQty(batches.filter((b) => b.drug_id === d.id));
                          const isHighlight = highlight === d.location.location_code;
                          const zoneCls =
                            d.location.zone === "cold"
                              ? "bg-teal-soft border-teal/40 text-teal"
                              : d.location.zone === "controlled"
                                ? "bg-plum-soft border-plum/40 text-plum"
                                : d.location.zone === "otc"
                                  ? "bg-mustard-soft border-mustard/40 text-mustard"
                                  : avail <= d.reorder_level
                                    ? "bg-clay-soft border-clay/30 text-clay"
                                    : "bg-sage-soft border-sage/30 text-sage";
                          return (
                            <div
                              key={d.id}
                              title={`${d.generic_name} — ${d.location.tray} slot ${d.location.slot}`}
                              className={cn(
                                "rounded border px-1 py-2 text-center transition",
                                zoneCls,
                                isHighlight && "ring-2 ring-mustard ring-offset-1",
                              )}
                            >
                              <div className="font-mono text-[9px] font-bold">{d.location.tray}</div>
                              <div className="mt-0.5 truncate text-[8px] leading-tight">{d.generic_name.split(" ")[0]}</div>
                              <div className="font-mono text-[8px] opacity-70">S{d.location.slot}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {rackDrugs.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-ink-100 pt-2">
                        {rackDrugs.slice(0, 3).map((d) => (
                          <div key={d.id} className="flex items-center justify-between text-[10px]">
                            <span className="truncate text-ink-700">{d.generic_name}</span>
                            <LocationChip location={d.location} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
