import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { classNames, fmt } from "@/lib/pharmacy-desk/utils";
import { Pill, Snowflake, Lock, Tag, MapPin } from "lucide-react";

const ZONE_STYLES = {
  MAIN:       { ring: "ring-emerald-300", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: Pill,      label: "Main" },
  COLD_CHAIN: { ring: "ring-sky-300",     chip: "bg-sky-50 text-sky-800 border-sky-200",             icon: Snowflake, label: "Cold chain" },
  CONTROLLED: { ring: "ring-rose-300",    chip: "bg-rose-50 text-rose-800 border-rose-200",          icon: Lock,      label: "Controlled" },
  OTC:        { ring: "ring-amber-300",   chip: "bg-amber-50 text-amber-800 border-amber-200",       icon: Tag,       label: "OTC" },
};

export default function StorageMap() {
  const ph = usePharmacy();
  const [params, setParams] = useSearchParams();
  const focusId = params.get("focus");
  const [hoveredDrug, setHoveredDrug] = useState(null);

  const drugsAt = useMemo(() => {
    // location code -> drug
    const m = new Map();
    ph.inventory.forEach((d) => {
      if (d.location?.code) m.set(d.location.code, d);
    });
    return m;
  }, [ph.inventory]);

  const focusDrug = focusId ? ph.inventory.find((d) => d.id === focusId) : null;

  return (
    <div data-testid="map-page">
      <PageHeader
        title="Storage map"
        subtitle="Aisles → racks → trays → slots. Click any cell to inspect the drug stored there."
      />

      <div className="max-w-[1500px] mx-auto px-8 py-7">
        {focusDrug && (
          <div className="pharm-card p-4 mb-5 bg-[hsl(var(--paper-100))]/60 flex items-center gap-3" data-testid="map-focus-banner">
            <MapPin className="h-4 w-4 text-[hsl(var(--sage-500))] animate-pulse-soft" />
            <div className="flex-1">
              <div className="text-[13px]">
                Highlighting <strong>{focusDrug.name}</strong> · {focusDrug.strength} at{" "}
                <span className="font-mono">{focusDrug.location.code}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">Aisle {focusDrug.location.aisle} · Zone {focusDrug.location.zone}</div>
            </div>
            <button onClick={() => setParams({})} data-testid="map-clear-focus" className="text-[12px] text-muted-foreground hover:text-foreground underline">
              Clear
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="map-legend">
          {Object.entries(ZONE_STYLES).map(([key, s]) => {
            const Icon = s.icon;
            return (
              <span key={key} className={classNames("pharm-pill", s.chip)}>
                <Icon className="h-3 w-3" /> {s.label}
              </span>
            );
          })}
          <span className="pharm-pill bg-stone-50 border-stone-200 text-stone-600">empty slot</span>
        </div>

        {/* Zones */}
        <div className="space-y-7" data-testid="map-grid">
          {ph.storeLayout.map((aisle) => {
            const style = ZONE_STYLES[aisle.zone];
            return (
              <section key={aisle.aisle} data-testid={`aisle-${aisle.aisle}`}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="font-display text-[20px] text-[hsl(var(--ink))]">
                    Aisle {aisle.aisle}
                  </h2>
                  <span className="text-[12px] text-muted-foreground">{aisle.label}</span>
                  <span className={classNames("pharm-pill text-[10px]", style.chip)}>{style.label}</span>
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${aisle.racks.length}, minmax(0, 1fr))` }}>
                  {aisle.racks.map((rack) => (
                    <div
                      key={rack.rack}
                      data-testid={`rack-${rack.rack}`}
                      className={classNames("pharm-card p-3", focusDrug?.location.rack === rack.rack && "ring-2 " + style.ring)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-[12px] text-muted-foreground">Rack {rack.rack}</div>
                        <div className="text-[11px] text-muted-foreground">{rack.trays} trays · {rack.slots} slots each</div>
                      </div>
                      <div className="space-y-1.5">
                        {Array.from({ length: rack.trays }).map((_, t) => {
                          const tray = t + 1;
                          return (
                            <div key={tray} className="flex items-center gap-1.5">
                              <div className="text-[10px] font-mono text-muted-foreground w-9 shrink-0">T{String(tray).padStart(2, "0")}</div>
                              <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: `repeat(${rack.slots}, minmax(0, 1fr))` }}>
                                {Array.from({ length: rack.slots }).map((_, s) => {
                                  const slot = s + 1;
                                  const code = `${rack.rack}-T${String(tray).padStart(2, "0")}-S${slot}`;
                                  const drug = drugsAt.get(code);
                                  const onHand = drug ? drug.batches.reduce((a, b) => a + b.qty, 0) : 0;
                                  const stockTone = !drug ? "bg-stone-50 border-stone-200" :
                                    onHand === 0 ? "bg-rose-100 border-rose-300" :
                                    onHand <= drug.reorderLevel ? "bg-amber-100 border-amber-300" :
                                    "bg-emerald-100 border-emerald-300";
                                  const focused = focusDrug && drug && drug.id === focusDrug.id;
                                  return (
                                    <button
                                      key={code}
                                      data-testid={`slot-${code}`}
                                      onMouseEnter={() => setHoveredDrug(drug || null)}
                                      onMouseLeave={() => setHoveredDrug(null)}
                                      onClick={() => drug && setParams({ focus: drug.id })}
                                      className={classNames(
                                        "h-7 rounded border text-[10px] font-mono flex items-center justify-center transition-all",
                                        stockTone,
                                        focused && "ring-2 " + style.ring + " scale-110 animate-pulse-soft",
                                        drug ? "hover:scale-105 cursor-pointer" : "cursor-default opacity-70",
                                      )}
                                      title={drug ? `${drug.name} · ${onHand} on hand · ${code}` : `Empty · ${code}`}
                                    >
                                      {drug ? (drug.name[0] + (drug.name[1] || "")).toUpperCase() : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Hover tooltip / info */}
      {hoveredDrug && (
        <div className="fixed bottom-6 right-6 pharm-card p-4 max-w-sm shadow-xl animate-rise" data-testid="map-hover-info">
          <div className="font-display text-[15px]">{hoveredDrug.name} · {hoveredDrug.strength}</div>
          <div className="text-[11px] font-mono text-muted-foreground">{hoveredDrug.location.code} · {hoveredDrug.location.zone}</div>
          <div className="mt-1.5 text-[12px]">
            On hand <strong>{hoveredDrug.batches.reduce((a, b) => a + b.qty, 0)}</strong> ·
            reorder @ {hoveredDrug.reorderLevel} ·
            Batches {hoveredDrug.batches.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Next exp {fmt.date([...hoveredDrug.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0]?.expiry)}
          </div>
        </div>
      )}
    </div>
  );
}
