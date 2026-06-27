import { useMemo, useState } from "react";
import { usePharmacyStore, availableQty, isLowStock } from "@/lib/pharmacy-desk/store";
import { SectionLabel } from "@/components/pharmacy-desk/Pills";
import { cn } from "@/lib/utils";
import {
  Thermometer,
  AlertTriangle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  X,
  Info,
  Search,
  MapPin,
  Clock,
} from "lucide-react";
import { type Drug, type StockBatch } from "@/lib/pharmacy-desk/mockData";

// ── Zone definitions with physical dimensions ───────────────────────────────
const FLOOR_ZONES = [
  {
    id: "main",
    label: "Main Dispensing Area",
    icon: Package,
    color: "bg-sage-soft/40 border-sage/30",
    labelColor: "text-sage",
    floorColor: "bg-[#f0f7f4]",
    aisles: [
      {
        id: "A",
        label: "Aisle A — Cardiovascular",
        racks: [
          { id: "A1", label: "Rack A1", shelves: 4, color: "bg-sage-soft border-sage/40" },
          { id: "A2", label: "Rack A2", shelves: 4, color: "bg-sage-soft border-sage/40" },
          { id: "A3", label: "Rack A3", shelves: 4, color: "bg-sage-soft border-sage/40" },
        ],
      },
      {
        id: "B",
        label: "Aisle B — Metabolic / Antibiotics",
        racks: [
          { id: "B2", label: "Rack B2", shelves: 4, color: "bg-teal-soft border-teal/40" },
          { id: "B3", label: "Rack B3", shelves: 4, color: "bg-teal-soft border-teal/40" },
        ],
      },
    ],
  },
  {
    id: "otc",
    label: "OTC & Analgesics Counter",
    icon: ShoppingBag,
    color: "bg-mustard-soft/40 border-mustard/30",
    labelColor: "text-mustard",
    floorColor: "bg-[#fffbf0]",
    aisles: [
      {
        id: "C",
        label: "Aisle C — OTC Medicines",
        racks: [
          { id: "C1", label: "Counter C1", shelves: 3, color: "bg-mustard-soft border-mustard/40" },
        ],
      },
    ],
  },
  {
    id: "controlled",
    label: "Controlled Substance Vault",
    icon: ShieldCheck,
    color: "bg-plum-soft/40 border-plum/30",
    labelColor: "text-plum",
    floorColor: "bg-[#f5f0fa]",
    aisles: [
      {
        id: "X",
        label: "Vault — Schedules II–IV",
        racks: [
          { id: "X-VAULT-1", label: "Vault Cabinet 1", shelves: 3, color: "bg-plum-soft border-plum/40" },
          { id: "X-VAULT-2", label: "Vault Cabinet 2", shelves: 3, color: "bg-plum-soft border-plum/40" },
        ],
      },
    ],
  },
  {
    id: "cold",
    label: "Cold Chain Storage",
    icon: Snowflake,
    color: "bg-sky-50/60 border-sky-200/50",
    labelColor: "text-sky-600",
    floorColor: "bg-[#f0f7ff]",
    aisles: [
      {
        id: "F",
        label: "Refrigeration Units",
        racks: [
          { id: "FRIDGE-1", label: "Fridge Unit 1 (2–8°C)", shelves: 3, color: "bg-sky-100 border-sky-300" },
          { id: "FRIDGE-2", label: "Freezer Unit 2 (−20°C)", shelves: 2, color: "bg-sky-200 border-sky-400" },
        ],
      },
    ],
  },
] as const;

type DrugWithStats = Drug & {
  availQty: number;
  isLow: boolean;
  nearExpiry: boolean;
  expiryDate?: string;
  batches: StockBatch[];
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function StorageMap() {
  const { drugs, batches } = usePharmacyStore();
  const [selected, setSelected] = useState<DrugWithStats | null>(null);
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterAlert, setFilterAlert] = useState<"all" | "low" | "expiry">("all");
  const [searchQ, setSearchQ] = useState("");

  // Enrich drugs with live stock data
  const drugsEnriched: DrugWithStats[] = useMemo(() => {
    return drugs.map((d) => {
      const drugBatches = batches.filter((b) => b.drug_id === d.id && b.status === "active");
      const availQty = availableQty(drugBatches);
      const isLow = isLowStock(d, drugBatches);

      const today = new Date();
      const nearExpiry = drugBatches.some((b) => {
        const exp = new Date(b.expiry);
        const diffDays = (exp.getTime() - today.getTime()) / (1000 * 86400);
        return diffDays < 60 && diffDays > 0;
      });

      const soonestExpiry = drugBatches
        .map((b) => b.expiry)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

      return {
        ...d,
        availQty,
        isLow,
        nearExpiry,
        expiryDate: soonestExpiry,
        batches: drugBatches,
      };
    });
  }, [drugs, batches]);

  // Build rack → drugs mapping
  const rackMap = useMemo(() => {
    const map: Record<string, DrugWithStats[]> = {};
    for (const d of drugsEnriched) {
      const key = d.location.rack;
      if (!map[key]) map[key] = [];

      let include = true;
      if (filterZone !== "all" && d.location.zone !== filterZone) include = false;
      if (filterAlert === "low" && !d.isLow) include = false;
      if (filterAlert === "expiry" && !d.nearExpiry) include = false;
      if (searchQ && !`${d.generic_name} ${d.brand_names.join(" ")} ${d.location.location_code}`.toLowerCase().includes(searchQ.toLowerCase())) include = false;

      if (include) map[key].push(d);
    }
    return map;
  }, [drugsEnriched, filterZone, filterAlert, searchQ]);

  const totalDrugs = drugsEnriched.length;
  const lowCount = drugsEnriched.filter((d) => d.isLow).length;
  const expiryCount = drugsEnriched.filter((d) => d.nearExpiry).length;

  return (
    <div className="space-y-5" data-testid="storage-map">
      {/* Header */}
      <SectionLabel>
        Pharmacy Floor Plan & Storage Map
      </SectionLabel>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface p-3 border-l-4 border-l-sage">
          <div className="font-mono text-[10px] uppercase text-ink-400 font-bold">Total SKUs</div>
          <div className="text-[22px] font-heading font-bold text-ink-900 mt-0.5">{totalDrugs}</div>
          <div className="text-[11px] text-ink-400">Across all zones</div>
        </div>
        <div
          className={cn("surface p-3 border-l-4 cursor-pointer transition hover:bg-bone", lowCount > 0 ? "border-l-clay" : "border-l-stone-300")}
          onClick={() => setFilterAlert(filterAlert === "low" ? "all" : "low")}
        >
          <div className="font-mono text-[10px] uppercase text-ink-400 font-bold">Low Stock</div>
          <div className={cn("text-[22px] font-heading font-bold mt-0.5", lowCount > 0 ? "text-clay" : "text-ink-900")}>{lowCount}</div>
          <div className="text-[11px] text-ink-400">Below reorder level</div>
        </div>
        <div
          className={cn("surface p-3 border-l-4 cursor-pointer transition hover:bg-bone", expiryCount > 0 ? "border-l-mustard" : "border-l-stone-300")}
          onClick={() => setFilterAlert(filterAlert === "expiry" ? "all" : "expiry")}
        >
          <div className="font-mono text-[10px] uppercase text-ink-400 font-bold">Near Expiry</div>
          <div className={cn("text-[22px] font-heading font-bold mt-0.5", expiryCount > 0 ? "text-mustard" : "text-ink-900")}>{expiryCount}</div>
          <div className="text-[11px] text-ink-400">Within 60 days</div>
        </div>
        <div className="surface p-3 border-l-4 border-l-sky-400">
          <div className="font-mono text-[10px] uppercase text-ink-400 font-bold">Cold Chain SKUs</div>
          <div className="text-[22px] font-heading font-bold text-sky-600 mt-0.5">
            {drugsEnriched.filter((d) => d.location.zone === "cold").length}
          </div>
          <div className="text-[11px] text-ink-400">2–8°C or frozen</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="surface px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search drug name, location code…"
            className="w-full h-8 pl-8 pr-3 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sage"
          />
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider">Zone:</span>
          {[
            { id: "all", label: "All" },
            { id: "main", label: "Main" },
            { id: "cold", label: "Cold" },
            { id: "controlled", label: "Controlled" },
            { id: "otc", label: "OTC" },
          ].map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setFilterZone(z.id)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition border",
                filterZone === z.id
                  ? "bg-sage text-white border-sage"
                  : "border-ink-200 text-ink-600 hover:bg-stone-50",
              )}
            >
              {z.label}
            </button>
          ))}
        </div>

        {(filterAlert !== "all" || filterZone !== "all" || searchQ) && (
          <button
            type="button"
            onClick={() => { setFilterAlert("all"); setFilterZone("all"); setSearchQ(""); }}
            className="flex items-center gap-1 text-[11px] text-clay hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-[11.5px] text-ink-500">
        <span className="font-semibold text-ink-700 uppercase tracking-wider text-[10px]">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-sage" /> In stock</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-mustard" /> Low stock</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-clay" /> Critical / out</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border-2 border-mustard bg-mustard/20" /> Near expiry</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-plum" /> Controlled</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-sky-400" /> Cold chain</span>
      </div>

      {/* Floor Plan Zones */}
      <div className="space-y-6">
        {FLOOR_ZONES.map((zone) => {
          const ZoneIcon = zone.icon;
          const zoneDrugs = drugsEnriched.filter((d) => d.location.zone === zone.id);
          if (filterZone !== "all" && filterZone !== zone.id) return null;

          return (
            <div
              key={zone.id}
              className={cn("rounded-xl border-2 p-5 space-y-4", zone.color, zone.floorColor)}
            >
              {/* Zone Header */}
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-white/60")}>
                  <ZoneIcon className={cn("h-5 w-5", zone.labelColor)} />
                </div>
                <div>
                  <h3 className={cn("font-heading text-[16px] font-bold", zone.labelColor)}>{zone.label}</h3>
                  <p className="text-[12px] text-ink-500 mt-0.5">
                    {zoneDrugs.length} SKUs · {zoneDrugs.filter(d => d.isLow).length} low stock · {zoneDrugs.filter(d => d.nearExpiry).length} near expiry
                  </p>
                </div>
              </div>

              {/* Aisles */}
              <div className="space-y-4">
                {zone.aisles.map((aisle) => (
                  <div key={aisle.id}>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-400 font-semibold pl-1">
                      {aisle.label}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {aisle.racks.map((rack) => {
                        const rackDrugs = rackMap[rack.id] ?? [];
                        const allRackDrugs = drugsEnriched.filter((d) => d.location.rack === rack.id);

                        return (
                          <RackUnit
                            key={rack.id}
                            rack={rack}
                            drugs={rackDrugs}
                            allDrugs={allRackDrugs}
                            onSelect={setSelected}
                            selected={selected}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Map Quick Reference */}
      <div className="surface p-5">
        <h3 className="font-heading text-[15px] font-semibold text-ink-900 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-mustard" /> Floor Layout Reference
        </h3>
        <div className="bg-stone-50 border border-ink-200 rounded-lg p-4 overflow-x-auto">
          <FloorPlanSVG drugsEnriched={drugsEnriched} onSelect={setSelected} />
        </div>
      </div>

      {/* Drug Detail Panel */}
      {selected && (
        <DrugDetailPanel drug={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── Rack Unit Component ──────────────────────────────────────────────────────
function RackUnit({
  rack,
  drugs,
  allDrugs,
  onSelect,
  selected,
}: {
  rack: { id: string; label: string; shelves: number; color: string };
  drugs: DrugWithStats[];
  allDrugs: DrugWithStats[];
  onSelect: (d: DrugWithStats) => void;
  selected: DrugWithStats | null;
}) {
  const shelves = Array.from({ length: rack.shelves }, (_, i) => i + 1);

  return (
    <div className={cn("rounded-lg border-2 bg-white overflow-hidden shadow-sm min-w-[220px] max-w-[280px]", rack.color)}>
      {/* Rack header */}
      <div className={cn("px-3 py-2 border-b", rack.color)}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold text-ink-900">{rack.label}</span>
          <span className="text-[10px] text-ink-500 font-mono">{allDrugs.length} SKUs</span>
        </div>
      </div>

      {/* Shelf rows */}
      <div className="divide-y divide-ink-100/60">
        {shelves.map((shelfNum) => {
          const shelfDrugs = drugs.filter((d) => {
            const trayNum = parseInt(d.location.tray.replace(/\D/g, ""));
            return trayNum % rack.shelves === (shelfNum - 1) % rack.shelves;
          });
          const allShelfDrugs = allDrugs.filter((d) => {
            const trayNum = parseInt(d.location.tray.replace(/\D/g, ""));
            return trayNum % rack.shelves === (shelfNum - 1) % rack.shelves;
          });

          return (
            <div key={shelfNum} className="p-1.5">
              {/* Shelf label */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[9px] text-ink-400 uppercase">Shelf {shelfNum}</span>
                <div className="flex-1 h-px bg-ink-100" />
              </div>

              {/* Drug slots on this shelf */}
              {allShelfDrugs.length === 0 ? (
                <div className="h-8 flex items-center justify-center border border-dashed border-ink-200 rounded text-[10px] text-ink-300">
                  Empty shelf
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {allShelfDrugs.map((d) => {
                    const isFiltered = drugs.includes(d);
                    const isSelected = selected?.id === d.id;

                    let slotColor = "bg-sage/20 border-sage/40 text-sage-dark";
                    if (d.location.zone === "cold") slotColor = "bg-sky-100 border-sky-300 text-sky-700";
                    else if (d.location.zone === "controlled") slotColor = "bg-plum-soft border-plum/50 text-plum";
                    else if (d.location.zone === "otc") slotColor = "bg-mustard-soft border-mustard/40 text-mustard";
                    else if (d.availQty === 0) slotColor = "bg-clay-soft border-clay/60 text-clay";
                    else if (d.isLow) slotColor = "bg-mustard-soft/70 border-mustard/50 text-mustard";

                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onSelect(d)}
                        title={`${d.generic_name} ${d.strength} — ${d.location.location_code}`}
                        className={cn(
                          "relative border rounded px-1.5 py-1 text-left transition-all hover:scale-105 hover:shadow-sm",
                          slotColor,
                          isSelected && "ring-2 ring-offset-1 ring-mustard scale-105 shadow",
                          !isFiltered && "opacity-30 cursor-default",
                        )}
                      >
                        {/* Stock indicator dot */}
                        <div className={cn(
                          "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white",
                          d.availQty === 0 ? "bg-clay" : d.isLow ? "bg-mustard animate-pulse" : "bg-sage",
                        )} />

                        {/* Near expiry indicator */}
                        {d.nearExpiry && (
                          <div className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-mustard border border-white animate-pulse" />
                        )}

                        <div className="font-mono text-[9px] font-bold leading-tight">{d.location.slot}</div>
                        <div className="text-[8.5px] leading-tight max-w-[60px] truncate">{d.generic_name.split(" ")[0]}</div>
                        <div className="font-mono text-[7.5px] opacity-70">{d.availQty}u</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rack footer — alerts */}
      {(allDrugs.some(d => d.isLow) || allDrugs.some(d => d.nearExpiry)) && (
        <div className="px-3 py-1.5 bg-stone-50 border-t border-ink-100 flex flex-wrap gap-2">
          {allDrugs.some(d => d.isLow) && (
            <span className="flex items-center gap-1 text-[9.5px] text-mustard font-medium">
              <AlertTriangle className="h-2.5 w-2.5" /> {allDrugs.filter(d => d.isLow).length} low
            </span>
          )}
          {allDrugs.some(d => d.nearExpiry) && (
            <span className="flex items-center gap-1 text-[9.5px] text-clay font-medium">
              <Clock className="h-2.5 w-2.5" /> {allDrugs.filter(d => d.nearExpiry).length} expiry
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drug Detail Panel ────────────────────────────────────────────────────────
function DrugDetailPanel({ drug, onClose }: { drug: DrugWithStats; onClose: () => void }) {
  const zoneColors: Record<string, string> = {
    main: "bg-sage-soft/30 border-sage/30",
    cold: "bg-sky-50 border-sky-200",
    controlled: "bg-plum-soft/30 border-plum/30",
    otc: "bg-mustard-soft/30 border-mustard/30",
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-screen w-[380px] z-40 bg-white border-l border-ink-200 shadow-2xl flex flex-col",
      "animate-in slide-in-from-right duration-200"
    )}>
      {/* Header */}
      <div className={cn("px-5 py-4 border-b border-ink-200", zoneColors[drug.location.zone])}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border",
                drug.location.zone === "cold" ? "bg-sky-100 border-sky-300 text-sky-700" :
                drug.location.zone === "controlled" ? "bg-plum-soft border-plum text-plum" :
                drug.location.zone === "otc" ? "bg-mustard-soft border-mustard text-mustard" :
                "bg-sage-soft border-sage text-sage"
              )}>
                {drug.location.zone}
              </span>
              {drug.high_alert && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-clay-soft border-clay text-clay">
                  High Alert
                </span>
              )}
              {drug.controlled_schedule && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-plum-soft border-plum/50 text-plum">
                  {drug.controlled_schedule}
                </span>
              )}
            </div>
            <h3 className="font-heading text-[18px] font-bold text-ink-900">{drug.generic_name}</h3>
            <p className="text-[13px] text-ink-500">{drug.strength} · {drug.form}</p>
            <p className="text-[12px] text-ink-400 mt-0.5">{drug.brand_names.join(", ")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-ink-100/70 transition-colors"
          >
            <X className="h-4 w-4 text-ink-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Location */}
        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-mustard" /> Storage Location
          </h4>
          <div className="bg-bone rounded-lg border border-ink-200 p-4 space-y-2.5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Aisle", value: drug.location.aisle },
                { label: "Rack", value: drug.location.rack },
                { label: "Tray", value: drug.location.tray },
                { label: "Slot", value: drug.location.slot },
                { label: "Zone", value: drug.location.zone.toUpperCase() },
                { label: "Temp", value: drug.location.temp },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-md border border-ink-200 p-2">
                  <div className="text-[9px] font-mono uppercase text-ink-400 mb-0.5">{item.label}</div>
                  <div className="font-mono text-[12px] font-bold text-ink-900">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-ink-200 mt-1">
              <div className="font-mono text-[11px] text-ink-500">Location Code:</div>
              <div className="font-mono text-[13px] font-bold text-ink-900 bg-white border border-ink-200 rounded px-2 py-0.5">
                {drug.location.location_code}
              </div>
            </div>
            {drug.location.temp !== "Room" && (
              <div className={cn(
                "flex items-center gap-2 p-2.5 rounded-md text-[12px] font-medium",
                drug.location.temp === "2–8 °C" ? "bg-sky-50 border border-sky-200 text-sky-700" : "bg-sky-100 border border-sky-300 text-sky-800"
              )}>
                <Thermometer className="h-4 w-4" />
                <span>Temperature: <strong>{drug.location.temp}</strong></span>
                {drug.location.temp === "2–8 °C" && <span className="ml-auto text-[10px]">Refrigerated</span>}
                {drug.location.temp === "Frozen" && <span className="ml-auto text-[10px]">Frozen storage</span>}
              </div>
            )}
          </div>
        </section>

        {/* Stock Status */}
        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-3 flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-sage" /> Inventory Status
          </h4>
          <div className="space-y-3">
            {/* Stock gauge */}
            <div className="bg-bone border border-ink-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-ink-700">Available Units</span>
                <span className={cn(
                  "font-mono text-[18px] font-bold",
                  drug.availQty === 0 ? "text-clay" : drug.isLow ? "text-mustard" : "text-sage"
                )}>
                  {drug.availQty}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    drug.availQty === 0 ? "bg-clay" : drug.isLow ? "bg-mustard" : "bg-sage"
                  )}
                  style={{ width: `${Math.min(100, (drug.availQty / (drug.reorder_level * 3)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-ink-400">
                <span>0</span>
                <span>Reorder level: {drug.reorder_level}</span>
                <span>{drug.reorder_level * 3}</span>
              </div>
            </div>

            {drug.isLow && (
              <div className="flex items-center gap-2 p-3 bg-mustard-soft/50 border border-mustard/30 rounded-md text-[12px] text-mustard font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Below reorder level! Raise PO to supplier.
              </div>
            )}
          </div>
        </section>

        {/* Batch Information */}
        {drug.batches.length > 0 && (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-3 flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-teal" /> Active Batches (FEFO order)
            </h4>
            <div className="space-y-2">
              {drug.batches
                .sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime())
                .map((batch, idx) => {
                  const daysLeft = Math.floor((new Date(batch.expiry).getTime() - Date.now()) / 86400000);
                  const isExpirySoon = daysLeft < 60;
                  const isExpired = daysLeft < 0;
                  return (
                    <div
                      key={batch.id}
                      className={cn(
                        "border rounded-md px-3 py-2.5 flex items-center justify-between text-[12px]",
                        idx === 0 ? "border-teal/40 bg-teal-soft/20" : "border-ink-200 bg-white",
                        isExpirySoon && !isExpired && "border-mustard/40 bg-mustard-soft/10",
                        isExpired && "border-clay/40 bg-clay-soft/10 opacity-70",
                      )}
                    >
                      <div>
                        <div className="font-mono font-semibold text-ink-900">{batch.lot}</div>
                        <div className="text-ink-500 text-[11px] mt-0.5">
                          Exp: {new Date(batch.expiry).toLocaleDateString()}
                          {isExpired ? (
                            <span className="ml-2 font-bold text-clay">EXPIRED</span>
                          ) : isExpirySoon ? (
                            <span className="ml-2 font-semibold text-mustard">{daysLeft}d left</span>
                          ) : (
                            <span className="ml-2 text-ink-400">{daysLeft}d left</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-ink-900">{batch.qty - batch.reserved_qty}</div>
                        <div className="text-ink-400 text-[10px]">available</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Clinical Info */}
        {(drug.lasa_pair || drug.counseling || drug.high_alert) && (
          <section>
            <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-plum" /> Clinical Notes
            </h4>
            <div className="space-y-2 text-[12.5px]">
              {drug.high_alert && (
                <div className="p-3 bg-clay-soft/30 border border-clay/30 rounded-md text-clay font-medium">
                  ⚠ High-Alert Medication — double-check dose and patient before dispensing.
                </div>
              )}
              {drug.lasa_pair && (
                <div className="p-3 bg-mustard-soft/30 border border-mustard/30 rounded-md text-mustard font-medium">
                  LASA risk — looks/sounds similar to another drug. Verify label carefully.
                </div>
              )}
              {drug.counseling && (
                <div className="p-3 bg-stone-50 border border-ink-200 rounded-md text-ink-700">
                  <span className="font-semibold text-ink-900">Counseling: </span>{drug.counseling}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pricing */}
        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-3">Pricing</h4>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="bg-bone rounded-md border border-ink-200 p-2.5">
              <div className="text-ink-500 text-[10px] uppercase font-bold mb-0.5">Sell Price</div>
              <div className="font-mono font-bold text-ink-900">₹{(drug.unit_price * 90).toFixed(2)}</div>
            </div>
            <div className="bg-bone rounded-md border border-ink-200 p-2.5">
              <div className="text-ink-500 text-[10px] uppercase font-bold mb-0.5">Reorder Level</div>
              <div className="font-mono font-bold text-ink-900">{drug.reorder_level} units</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Simplified Floor Plan SVG ────────────────────────────────────────────────
function FloorPlanSVG({
  drugsEnriched,
  onSelect,
}: {
  drugsEnriched: DrugWithStats[];
  onSelect: (d: DrugWithStats) => void;
}) {
  const getZoneColor = (zone: string) => {
    if (zone === "cold") return "#e0f2fe";
    if (zone === "controlled") return "#f3e8ff";
    if (zone === "otc") return "#fef9c3";
    return "#f0fdf4";
  };

  const zones = [
    { id: "main", x: 20, y: 20, width: 340, height: 200, label: "MAIN DISPENSING", fill: "#f0fdf4", stroke: "#86efac" },
    { id: "otc", x: 380, y: 20, width: 160, height: 90, label: "OTC COUNTER", fill: "#fef9c3", stroke: "#fde047" },
    { id: "controlled", x: 380, y: 130, width: 160, height: 90, label: "CONTROLLED VAULT", fill: "#f3e8ff", stroke: "#c084fc" },
    { id: "cold", x: 20, y: 240, width: 200, height: 100, label: "COLD CHAIN", fill: "#e0f2fe", stroke: "#7dd3fc" },
    { id: "dispensing-counter", x: 240, y: 240, width: 300, height: 100, label: "DISPENSING COUNTER", fill: "#fafaf9", stroke: "#d4d4d4" },
  ];

  const rackMarkers = [
    { id: "A1", x: 40, y: 50, w: 70, h: 70, label: "A1", zone: "main" },
    { id: "A2", x: 130, y: 50, w: 70, h: 70, label: "A2", zone: "main" },
    { id: "A3", x: 220, y: 50, w: 70, h: 70, label: "A3", zone: "main" },
    { id: "B2", x: 40, y: 145, w: 80, h: 60, label: "B2", zone: "main" },
    { id: "B3", x: 140, y: 145, w: 80, h: 60, label: "B3", zone: "main" },
    { id: "C1", x: 395, y: 40, w: 120, h: 55, label: "C1 OTC", zone: "otc" },
    { id: "X-VAULT-1", x: 395, y: 148, w: 55, h: 55, label: "V1", zone: "controlled" },
    { id: "X-VAULT-2", x: 465, y: 148, w: 55, h: 55, label: "V2", zone: "controlled" },
    { id: "FRIDGE-1", x: 35, y: 258, w: 70, h: 60, label: "FRIDGE-1", zone: "cold" },
    { id: "FRIDGE-2", x: 120, y: 258, w: 70, h: 60, label: "FRIDGE-2", zone: "cold" },
  ];

  return (
    <svg viewBox="0 0 560 360" className="w-full max-w-3xl mx-auto" style={{ height: "320px" }}>
      {/* Background */}
      <rect x={0} y={0} width={560} height={360} fill="#f5f5f4" rx={8} />

      {/* Walkways */}
      <rect x={362} y={0} width={16} height={360} fill="#e7e5e4" />
      <rect x={0} y={220} width={560} height={16} fill="#e7e5e4" />

      {/* Zones */}
      {zones.map((z) => (
        <g key={z.id}>
          <rect x={z.x} y={z.y} width={z.width} height={z.height} rx={6} fill={z.fill} stroke={z.stroke} strokeWidth={1.5} />
          <text x={z.x + z.width / 2} y={z.y + 13} textAnchor="middle" fontSize={7} fill="#737373" fontWeight={700} letterSpacing={1} style={{ fontFamily: "monospace" }}>
            {z.label}
          </text>
        </g>
      ))}

      {/* Rack markers */}
      {rackMarkers.map((r) => {
        const rackDrugs = drugsEnriched.filter((d) => d.location.rack === r.id);
        const hasLow = rackDrugs.some(d => d.isLow);
        const hasExpiry = rackDrugs.some(d => d.nearExpiry);
        const rackFill =
          r.zone === "cold" ? "#bae6fd" :
          r.zone === "controlled" ? "#e9d5ff" :
          r.zone === "otc" ? "#fef08a" :
          "#bbf7d0";
        const rackStroke =
          r.zone === "cold" ? "#38bdf8" :
          r.zone === "controlled" ? "#a855f7" :
          r.zone === "otc" ? "#eab308" :
          "#22c55e";

        return (
          <g key={r.id} style={{ cursor: "pointer" }} onClick={() => rackDrugs[0] && onSelect(rackDrugs[0])}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={rackFill} stroke={rackStroke} strokeWidth={1.5} />
            {/* Shelf lines */}
            <line x1={r.x + 4} y1={r.y + r.h * 0.35} x2={r.x + r.w - 4} y2={r.y + r.h * 0.35} stroke={rackStroke} strokeWidth={0.8} strokeDasharray="3,2" />
            <line x1={r.x + 4} y1={r.y + r.h * 0.65} x2={r.x + r.w - 4} y2={r.y + r.h * 0.65} stroke={rackStroke} strokeWidth={0.8} strokeDasharray="3,2" />
            {/* Label */}
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="#404040" style={{ fontFamily: "monospace" }}>
              {r.label}
            </text>
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 14} textAnchor="middle" fontSize={7} fill="#737373">
              {rackDrugs.length} SKU
            </text>
            {/* Alert indicators */}
            {hasLow && <circle cx={r.x + r.w - 5} cy={r.y + 5} r={4} fill="#f59e0b" />}
            {hasExpiry && <circle cx={r.x + 5} cy={r.y + 5} r={4} fill="#ef4444" />}
          </g>
        );
      })}

      {/* Door */}
      <rect x={248} y={345} width={60} height={8} rx={2} fill="#d4d4d4" />
      <text x={278} y={358} textAnchor="middle" fontSize={7} fill="#737373" style={{ fontFamily: "monospace" }}>ENTRANCE</text>

      {/* Emergency exit */}
      <rect x={535} y={150} width={12} height={40} rx={2} fill="#fca5a5" />
      <text x={549} y={178} fontSize={7} fill="#dc2626" style={{ fontFamily: "monospace" }}>EXIT</text>
    </svg>
  );
}
