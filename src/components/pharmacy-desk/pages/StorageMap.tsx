import { useMemo, useState } from "react";
import { usePharmacyStore, availableQty, isLowStock } from "@/lib/pharmacy-desk/store";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Package, ShieldCheck, ShoppingBag,
  Snowflake, X, Search, Clock, Thermometer, Lock,
  Info,
} from "lucide-react";
import { type Drug, type StockBatch } from "@/lib/pharmacy-desk/mockData";

// ── Types ─────────────────────────────────────────────────────────────────────
type DrugEnriched = Drug & {
  availQty: number;
  isLow: boolean;
  nearExpiry: boolean;
  batches: StockBatch[];
};

// ── Zone display config ────────────────────────────────────────────────────────
const ZONE_CFG = {
  main: {
    label: "Main Dispensing",
    sub: "Prescription drugs · oral solids · injectables",
    icon: Package,
    outerCls: "border-sage/30 bg-[#f0fdf5]",
    headerCls: "bg-sage-soft/40 border-sage/20",
    textCls: "text-sage",
    rackFrameCls: "bg-[#F4F6F4] border-stone-300/80",
    railCls: "border-stone-300/60 bg-stone-100/70",
  },
  otc: {
    label: "OTC Counter",
    sub: "Over-the-counter · analgesics · supplements",
    icon: ShoppingBag,
    outerCls: "border-mustard/30 bg-[#fffdf0]",
    headerCls: "bg-mustard-soft/40 border-mustard/20",
    textCls: "text-mustard",
    rackFrameCls: "bg-[#FFFDE8] border-amber-300/60",
    railCls: "border-amber-200/60 bg-amber-50/70",
  },
  cold: {
    label: "Cold Chain Storage",
    sub: "Refrigerated 2–8 °C · biological · vaccines",
    icon: Snowflake,
    outerCls: "border-sky-200/60 bg-[#f0f8ff]",
    headerCls: "bg-sky-50/60 border-sky-200/40",
    textCls: "text-sky-600",
    rackFrameCls: "bg-[#EFF6FF] border-sky-300/60",
    railCls: "border-sky-200/60 bg-sky-50/80",
  },
  controlled: {
    label: "Controlled Substance Vault",
    sub: "Schedule II–IV · narcotics · psychotropics",
    icon: ShieldCheck,
    outerCls: "border-plum/30 bg-[#faf5ff]",
    headerCls: "bg-plum-soft/40 border-plum/20",
    textCls: "text-plum",
    rackFrameCls: "bg-[#FAF5FF] border-purple-300/60",
    railCls: "border-purple-200/60 bg-purple-50/80",
  },
} as const;

type ZoneKey = keyof typeof ZONE_CFG;
const ZONE_ORDER: ZoneKey[] = ["main", "otc", "cold", "controlled"];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StorageMap() {
  const { drugs, batches } = usePharmacyStore();
  const [selected, setSelected] = useState<DrugEnriched | null>(null);
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterAlert, setFilterAlert] = useState<"all" | "low" | "expiry">("all");
  const [searchQ, setSearchQ] = useState("");

  // Enrich all drugs with live stock data
  const drugsEnriched = useMemo<DrugEnriched[]>(
    () =>
      drugs.map((d) => {
        const db = batches.filter(
          (b) => b.drug_id === d.id && b.status === "active",
        );
        const avail = availableQty(db);
        const low = isLowStock(d, db);
        const now = Date.now();
        const nearExpiry = db.some((b) => {
          const diff =
            (new Date(b.expiry).getTime() - now) / 86_400_000;
          return diff > 0 && diff < 60;
        });
        return { ...d, availQty: avail, isLow: low, nearExpiry, batches: db };
      }),
    [drugs, batches],
  );

  // Group filtered drugs: zone → aisle → rack → [drugs]
  const zoneMap = useMemo(() => {
    const m: Record<string, Record<string, Record<string, DrugEnriched[]>>> =
      {};
    for (const d of drugsEnriched) {
      let pass = true;
      if (filterZone !== "all" && d.location.zone !== filterZone) pass = false;
      if (filterAlert === "low" && !d.isLow) pass = false;
      if (filterAlert === "expiry" && !d.nearExpiry) pass = false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        pass = [d.generic_name, ...d.brand_names, d.location.location_code, d.sku]
          .join(" ")
          .toLowerCase()
          .includes(q);
      }
      if (!pass) continue;
      const z = d.location.zone;
      const a = d.location.aisle;
      const r = d.location.rack;
      (((m[z] ??= {})[a] ??= {})[r] ??= []).push(d);
    }
    return m;
  }, [drugsEnriched, filterZone, filterAlert, searchQ]);

  const stats = useMemo(
    () => ({
      total: drugsEnriched.length,
      low: drugsEnriched.filter((d) => d.isLow).length,
      expiry: drugsEnriched.filter((d) => d.nearExpiry).length,
      cold: drugsEnriched.filter((d) => d.location.zone === "cold").length,
    }),
    [drugsEnriched],
  );

  const hasFilter = !!(searchQ || filterAlert !== "all" || filterZone !== "all");

  return (
    <div className="space-y-5" data-testid="storage-map">

      {/* ── KPI bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total SKUs"  value={stats.total}  accent="border-l-sage"     sub="Across all zones" />
        <KpiCard label="Low Stock"   value={stats.low}    accent={stats.low > 0 ? "border-l-clay" : "border-l-stone-200"}
          sub="Below reorder level" active={filterAlert === "low"}
          onClick={() => setFilterAlert((f) => (f === "low" ? "all" : "low"))} />
        <KpiCard label="Near Expiry" value={stats.expiry} accent={stats.expiry > 0 ? "border-l-mustard" : "border-l-stone-200"}
          sub="Within 60 days"      active={filterAlert === "expiry"}
          onClick={() => setFilterAlert((f) => (f === "expiry" ? "all" : "expiry"))} />
        <KpiCard label="Cold Chain"  value={stats.cold}  accent="border-l-sky-400"   sub="2–8 °C or frozen" />
      </div>

      {/* ── Search + filter toolbar ───────────────────────────────────────── */}
      <div className="surface px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search drug name, brand, SKU, location code…"
            className="w-full h-8 pl-8 pr-3 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sage"
          />
        </div>

        {/* Zone filter chips */}
        <div className="flex items-center gap-1.5">
          {([
            { id: "all", label: "All zones" },
            { id: "main", label: "Main Rx" },
            { id: "cold", label: "Cold" },
            { id: "controlled", label: "Controlled" },
            { id: "otc", label: "OTC" },
          ] as const).map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setFilterZone(z.id)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium border transition",
                filterZone === z.id
                  ? "bg-sage text-white border-sage"
                  : "border-ink-200 text-ink-600 hover:bg-stone-50",
              )}
            >
              {z.label}
            </button>
          ))}
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSearchQ("");
              setFilterAlert("all");
              setFilterZone("all");
            }}
            className="flex items-center gap-1 text-[11px] text-clay hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Legend strip ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-5 px-1 text-[11.5px] text-ink-500">
        <span className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400">Legend</span>
        {[
          { dot: "bg-sage",    label: "In stock" },
          { dot: "bg-mustard", label: "Low stock" },
          { dot: "bg-clay",    label: "Empty / critical" },
          { dot: "bg-orange-400", label: "Near expiry" },
          { dot: "bg-sky-400", label: "Cold chain" },
          { dot: "bg-plum",    label: "Controlled" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-full", l.dot)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Zone panels ──────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {ZONE_ORDER.map((zone) => {
          if (filterZone !== "all" && filterZone !== zone) return null;
          const cfg = ZONE_CFG[zone];
          const ZoneIcon = cfg.icon;
          const aisleMap = zoneMap[zone] ?? {};
          const zoneDrugs = drugsEnriched.filter((d) => d.location.zone === zone);
          const zoneLow = zoneDrugs.filter((d) => d.isLow).length;
          const zoneExpiry = zoneDrugs.filter((d) => d.nearExpiry).length;

          return (
            <div key={zone} className={cn("rounded-xl border-2 p-5 space-y-4", cfg.outerCls)}>

              {/* Zone header */}
              <div className={cn("rounded-lg border p-3 flex items-center justify-between", cfg.headerCls)}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/60 border border-white/80 shadow-sm">
                    <ZoneIcon className={cn("h-5 w-5", cfg.textCls)} />
                  </div>
                  <div>
                    <h3 className={cn("font-heading text-[16px] font-bold", cfg.textCls)}>
                      {cfg.label}
                    </h3>
                    <p className="text-[11.5px] text-ink-500 mt-0.5">{cfg.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-[11px] text-ink-500">
                    <div className="font-mono font-bold text-ink-800 text-[13px]">{zoneDrugs.length}</div>
                    <div>SKUs stored</div>
                  </div>
                  {zoneLow > 0 && (
                    <div className="flex items-center gap-1 bg-mustard-soft border border-mustard/40 rounded px-2 py-1">
                      <AlertTriangle className="h-3 w-3 text-mustard" />
                      <span className="text-[10px] font-bold text-mustard">{zoneLow} low</span>
                    </div>
                  )}
                  {zoneExpiry > 0 && (
                    <div className="flex items-center gap-1 bg-orange-50 border border-orange-300 rounded px-2 py-1">
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span className="text-[10px] font-bold text-orange-600">{zoneExpiry} expiring</span>
                    </div>
                  )}
                  {zone === "cold" && (
                    <div className="flex items-center gap-1.5 bg-sky-100 border border-sky-300 rounded-md px-2.5 py-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-sky-600" />
                      <span className="text-[11px] font-bold text-sky-700">2–8 °C</span>
                    </div>
                  )}
                  {zone === "controlled" && (
                    <div className="flex items-center gap-1.5 bg-plum-soft border border-plum/30 rounded-md px-2.5 py-1.5">
                      <Lock className="h-3.5 w-3.5 text-plum" />
                      <span className="text-[11px] font-bold text-plum">SECURED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aisles */}
              {Object.keys(aisleMap).length === 0 ? (
                <div className="text-center text-[13px] text-ink-400 py-8 bg-white/40 rounded-lg border border-dashed border-ink-200">
                  No drugs match the current filter in this zone
                </div>
              ) : (
                Object.entries(aisleMap).map(([aisleId, rackMap]) => (
                  <div key={aisleId}>
                    {/* Aisle divider label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="font-mono text-[9.5px] uppercase tracking-widest font-bold text-ink-400 shrink-0">
                        {zone === "main"
                          ? aisleId === "A"
                            ? "Aisle A — Cardiovascular / Antibiotics"
                            : aisleId === "B"
                            ? "Aisle B — Metabolic / Liquids"
                            : `Aisle ${aisleId}`
                          : zone === "cold"
                          ? "Refrigeration Units"
                          : zone === "controlled"
                          ? "Vault Cabinets"
                          : "OTC Shelving"}
                      </div>
                      <div className="flex-1 h-px bg-ink-200/60" />
                    </div>

                    {/* Rack units for this aisle */}
                    <div className="flex flex-wrap gap-5">
                      {Object.entries(rackMap).map(([rackId, rackDrugs]) => (
                        <RackUnit
                          key={rackId}
                          rackId={rackId}
                          drugs={rackDrugs}
                          zone={zone}
                          cfg={cfg}
                          selected={selected}
                          onSelect={setSelected}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* ── Drug detail panel (fixed right drawer) ───────────────────────── */}
      {selected && (
        <DrugDetailPanel drug={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, accent, sub, onClick, active,
}: {
  label: string; value: number; accent: string; sub: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "surface p-3 border-l-4 transition-all select-none",
        accent,
        onClick && "cursor-pointer hover:bg-bone",
        active && "ring-2 ring-sage/30 bg-sage-soft/20",
      )}
    >
      <div className="font-mono text-[10px] uppercase text-ink-400 font-bold">{label}</div>
      <div className="text-[22px] font-heading font-bold text-ink-900 mt-0.5">{value}</div>
      <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Rack Unit — frontal elevation view of a pharmacy shelving unit ─────────────
function RackUnit({
  rackId, drugs, zone, cfg, selected, onSelect,
}: {
  rackId: string;
  drugs: DrugEnriched[];
  zone: ZoneKey;
  cfg: typeof ZONE_CFG[ZoneKey];
  selected: DrugEnriched | null;
  onSelect: (d: DrugEnriched) => void;
}) {
  // Group drugs by tray (= shelf level within this rack)
  const trays = useMemo(() => {
    const m: Record<string, DrugEnriched[]> = {};
    for (const d of drugs) (m[d.location.tray] ??= []).push(d);
    return Object.entries(m).sort(([a], [b]) => {
      const na = parseInt(a.replace(/\D/g, ""), 10);
      const nb = parseInt(b.replace(/\D/g, ""), 10);
      return na - nb;
    });
  }, [drugs]);

  const hasLow = drugs.some((d) => d.isLow);
  const hasExpiry = drugs.some((d) => d.nearExpiry);
  const hasCritical = drugs.some((d) => d.availQty === 0);

  const statusDot = hasCritical
    ? "bg-clay"
    : hasLow
    ? "bg-mustard animate-pulse"
    : "bg-sage";

  const isCold = zone === "cold";
  const isControlled = zone === "controlled";

  return (
    <div
      className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden"
      style={{ minWidth: "280px", maxWidth: "520px", flex: "1 1 300px" }}
    >
      {/* ── Rack header bar ──────────────────────────────────────────────── */}
      <div className="px-3 py-2 bg-stone-50 border-b border-ink-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusDot)} />
          <span className="font-mono text-[13px] font-bold text-ink-900">{rackId}</span>
          {isCold && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded px-1.5 py-0.5">
              <Thermometer className="h-3 w-3" />
              2–8°C
            </span>
          )}
          {isControlled && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-plum bg-plum-soft border border-plum/30 rounded px-1.5 py-0.5">
              <Lock className="h-3 w-3" /> SECURED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasCritical && <AlertTriangle className="h-3.5 w-3.5 text-clay" />}
          {hasLow && !hasCritical && <AlertTriangle className="h-3.5 w-3.5 text-mustard" />}
          {hasExpiry && <Clock className="h-3.5 w-3.5 text-orange-400" />}
          <span className="text-[11px] text-ink-400 font-mono">{drugs.length} SKU</span>
        </div>
      </div>

      {/* ── Rack frame body (shelving unit frontal view) ─────────────────── */}
      <div className={cn("m-2 rounded-lg border-2 overflow-hidden", cfg.rackFrameCls)}>
        {/* Left upright rail */}
        <div className="flex">
          {/* Left edge rail */}
          <div className={cn("w-2.5 shrink-0 border-r", cfg.railCls)} />

          {/* Shelf rows (one per tray) */}
          <div className="flex-1">
            {trays.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-ink-300">Empty rack</div>
            ) : (
              trays.map(([trayId, trayDrugs], idx) => (
                <div key={trayId} className={cn(idx > 0 && "border-t-2", cfg.railCls)}>
                  {/* Shelf rail + tray label */}
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-0.5 border-b",
                    cfg.railCls,
                  )}>
                    <span className="font-mono text-[8.5px] font-bold text-ink-400 uppercase shrink-0">
                      {trayId}
                    </span>
                    <div className="flex-1 h-px bg-ink-200/50" />
                    <span className="text-[8px] text-ink-300 shrink-0">{trayDrugs.length} slot{trayDrugs.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Drug bins on this shelf */}
                  <div className="p-2 flex flex-wrap gap-2">
                    {trayDrugs
                      .sort((a, b) => parseInt(a.location.slot, 10) - parseInt(b.location.slot, 10))
                      .map((drug) => (
                        <DrugBin
                          key={drug.id}
                          drug={drug}
                          zone={zone}
                          isSelected={selected?.id === drug.id}
                          onSelect={() => onSelect(drug)}
                        />
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right edge rail */}
          <div className={cn("w-2.5 shrink-0 border-l", cfg.railCls)} />
        </div>
      </div>

      {/* ── Rack footer alerts ──────────────────────────────────────────── */}
      {(hasCritical || hasLow || hasExpiry) && (
        <div className="px-3 py-1.5 bg-stone-50 border-t border-ink-100 flex flex-wrap gap-3">
          {hasCritical && (
            <span className="flex items-center gap-1 text-[10px] text-clay font-semibold">
              <AlertTriangle className="h-3 w-3" />
              {drugs.filter((d) => d.availQty === 0).length} empty slot{drugs.filter((d) => d.availQty === 0).length !== 1 ? "s" : ""}
            </span>
          )}
          {hasLow && (
            <span className="flex items-center gap-1 text-[10px] text-mustard font-semibold">
              <AlertTriangle className="h-3 w-3" />
              {drugs.filter((d) => d.isLow).length} below reorder
            </span>
          )}
          {hasExpiry && (
            <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold">
              <Clock className="h-3 w-3" />
              {drugs.filter((d) => d.nearExpiry).length} near expiry
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drug Bin — single bin slot in a shelf ─────────────────────────────────────
function DrugBin({
  drug, zone, isSelected, onSelect,
}: {
  drug: DrugEnriched;
  zone: ZoneKey;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const maxQty = Math.max(drug.reorder_level * 3, 1);
  const pct = Math.min(100, (drug.availQty / maxQty) * 100);

  const isEmpty = drug.availQty === 0;
  const isLow = drug.isLow;
  const isExpiry = drug.nearExpiry;

  // Bin background + border
  const binCls = isEmpty
    ? "bg-clay-soft/30 border-clay/50 hover:border-clay"
    : isLow
    ? "bg-mustard-soft/30 border-mustard/40 hover:border-mustard"
    : isExpiry
    ? "bg-orange-50 border-orange-200 hover:border-orange-400"
    : zone === "cold"
    ? "bg-sky-50/60 border-sky-200 hover:border-sky-400"
    : zone === "controlled"
    ? "bg-plum-soft/30 border-plum/30 hover:border-plum"
    : "bg-white border-ink-200 hover:border-sage";

  // Fill bar colour
  const fillHex = isEmpty
    ? "#EF4444"
    : isLow
    ? "#FBBF24"
    : isExpiry
    ? "#F97316"
    : zone === "cold"
    ? "#38BDF8"
    : zone === "controlled"
    ? "#A78BFA"
    : "#4ADE80";

  const qtyColor = isEmpty ? "text-clay" : isLow ? "text-mustard" : "text-ink-700";

  // Days to soonest expiry
  const soonest = drug.batches
    .map((b) => b.expiry)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const daysLeft = soonest
    ? Math.floor((new Date(soonest).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${drug.generic_name} ${drug.strength} — ${drug.location.location_code}`}
      className={cn(
        "relative border rounded-md p-2 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        binCls,
        isSelected && "ring-2 ring-sage ring-offset-1 shadow-md scale-[1.02]",
      )}
      style={{ width: "128px" }}
    >
      {/* Slot position code */}
      <div className="font-mono text-[8.5px] font-bold text-ink-400 mb-1 flex items-center gap-1">
        <span>{drug.location.tray}</span>
        <span className="opacity-50">·</span>
        <span>S{drug.location.slot}</span>
        {drug.high_alert && (
          <span className="ml-auto bg-clay/20 text-clay rounded text-[7px] px-1 font-bold">HA</span>
        )}
      </div>

      {/* Drug name */}
      <div className="font-semibold text-[12px] text-ink-900 leading-tight truncate">
        {drug.generic_name}
      </div>

      {/* Strength + form */}
      <div className="text-[10px] text-ink-500 mt-0.5 leading-tight truncate">
        {drug.strength} · {drug.form}
      </div>

      {/* Fill level bar (shows stock vs max) */}
      <div className="mt-2 mb-1.5">
        <div className="h-2 w-full rounded-full bg-ink-100/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: fillHex }}
          />
        </div>
      </div>

      {/* Quantity + status indicators row */}
      <div className="flex items-center justify-between mt-0.5">
        <span className={cn("font-mono text-[11px] font-bold", qtyColor)}>
          {drug.availQty}u
        </span>
        <div className="flex items-center gap-1">
          {isEmpty && <AlertTriangle className="h-3 w-3 text-clay" />}
          {!isEmpty && isLow && <AlertTriangle className="h-3 w-3 text-mustard" />}
          {isExpiry && daysLeft !== null && (
            <span className="text-[8px] font-bold text-orange-500 bg-orange-50 border border-orange-200 rounded px-1">
              {daysLeft}d
            </span>
          )}
          {!isEmpty && !isLow && !isExpiry && (
            <div className="h-2 w-2 rounded-full bg-sage" />
          )}
          {drug.lasa_pair && (
            <span className="text-[7px] font-bold text-mustard bg-mustard-soft border border-mustard/30 rounded px-0.5">
              LASA
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Drug Detail Panel ─────────────────────────────────────────────────────────
function DrugDetailPanel({
  drug, onClose,
}: {
  drug: DrugEnriched;
  onClose: () => void;
}) {
  const isEmpty = drug.availQty === 0;
  const maxQty = Math.max(drug.reorder_level * 3, 1);
  const pct = Math.min(100, (drug.availQty / maxQty) * 100);

  const zoneBadge = {
    main:       "bg-sage-soft border-sage/40 text-sage",
    otc:        "bg-mustard-soft border-mustard/40 text-mustard",
    cold:       "bg-sky-100 border-sky-300 text-sky-700",
    controlled: "bg-plum-soft border-plum/40 text-plum",
  }[drug.location.zone] ?? "bg-stone-100 border-stone-300 text-stone-700";

  return (
    <div className="fixed right-0 top-0 h-screen w-[380px] z-40 bg-white border-l border-ink-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink-200 bg-bone">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border", zoneBadge)}>
                {drug.location.zone}
              </span>
              {drug.high_alert && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-clay-soft border-clay text-clay">
                  High Alert
                </span>
              )}
              {drug.controlled_schedule && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-plum-soft border-plum/50 text-plum">
                  {drug.controlled_schedule}
                </span>
              )}
            </div>
            <h3 className="font-heading text-[19px] font-bold text-ink-900 leading-tight truncate">{drug.generic_name}</h3>
            <p className="text-[13px] text-ink-500 mt-0.5">{drug.strength} · {drug.form} · {drug.route}</p>
            {drug.brand_names.length > 0 && (
              <p className="text-[11px] text-ink-400 mt-0.5 truncate">Brands: {drug.brand_names.join(", ")}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-ink-100 transition-colors ml-2 shrink-0">
            <X className="h-4 w-4 text-ink-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Location */}
        <section>
          <h4 className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400 mb-2.5 flex items-center gap-1.5">
            <span className="h-px flex-1 bg-ink-100" />Storage Location<span className="h-px flex-1 bg-ink-100" />
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Aisle",  value: drug.location.aisle },
              { label: "Rack",   value: drug.location.rack  },
              { label: "Tray",   value: drug.location.tray  },
              { label: "Slot",   value: `S${drug.location.slot}` },
              { label: "Zone",   value: drug.location.zone.toUpperCase() },
              { label: "Temp",   value: drug.location.temp },
            ].map((item) => (
              <div key={item.label} className="bg-bone border border-ink-200 rounded-lg p-2">
                <div className="text-[8.5px] font-mono uppercase text-ink-400 mb-0.5">{item.label}</div>
                <div className="font-mono text-[11.5px] font-bold text-ink-900 truncate">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10.5px] text-ink-400">Location code:</span>
            <code className="font-mono text-[12px] font-bold text-ink-900 bg-bone border border-ink-200 rounded px-2 py-0.5">
              {drug.location.location_code}
            </code>
          </div>
          {drug.location.temp !== "Room" && (
            <div className={cn(
              "mt-2 flex items-center gap-2 p-2.5 rounded-md border text-[12px] font-medium",
              drug.location.temp.includes("2") ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-sky-100 border-sky-300 text-sky-800",
            )}>
              <Thermometer className="h-4 w-4 shrink-0" />
              Temperature-controlled: <strong>{drug.location.temp}</strong>
            </div>
          )}
        </section>

        {/* Stock status */}
        <section>
          <h4 className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400 mb-2.5 flex items-center gap-1.5">
            <span className="h-px flex-1 bg-ink-100" />Inventory<span className="h-px flex-1 bg-ink-100" />
          </h4>
          <div className="bg-bone border border-ink-200 rounded-lg p-4 space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-[12px] font-medium text-ink-700">Available units</span>
              <span className={cn(
                "font-mono text-[22px] font-bold leading-none",
                isEmpty ? "text-clay" : drug.isLow ? "text-mustard" : "text-sage",
              )}>
                {drug.availQty}
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-3 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isEmpty ? "#EF4444" : drug.isLow ? "#FBBF24" : "#4ADE80",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink-400">
                <span>0</span>
                <span>Reorder: {drug.reorder_level}</span>
                <span>{drug.reorder_level * 3}</span>
              </div>
            </div>
            {drug.isLow && (
              <div className="flex items-center gap-2 p-2 bg-mustard-soft/50 border border-mustard/30 rounded text-[11.5px] text-mustard font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Below reorder level — raise purchase order
              </div>
            )}
          </div>
        </section>

        {/* Active batches (FEFO order) */}
        {drug.batches.length > 0 && (
          <section>
            <h4 className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400 mb-2.5 flex items-center gap-1.5">
              <span className="h-px flex-1 bg-ink-100" />Active Batches — FEFO<span className="h-px flex-1 bg-ink-100" />
            </h4>
            <div className="space-y-2">
              {drug.batches
                .sort(
                  (a, b) =>
                    new Date(a.expiry).getTime() - new Date(b.expiry).getTime(),
                )
                .map((batch, idx) => {
                  const daysLeft = Math.floor(
                    (new Date(batch.expiry).getTime() - Date.now()) / 86_400_000,
                  );
                  const expired = daysLeft < 0;
                  const soon = !expired && daysLeft < 60;
                  return (
                    <div
                      key={batch.id}
                      className={cn(
                        "border rounded-lg px-3 py-2.5 flex items-center justify-between text-[12px]",
                        idx === 0 && "border-teal/40 bg-teal-soft/10",
                        soon && "border-orange-200 bg-orange-50",
                        expired && "border-clay/40 bg-clay-soft/10 opacity-60",
                        !idx && !soon && !expired && "border-ink-200 bg-white",
                      )}
                    >
                      <div>
                        <div className="font-mono font-bold text-ink-900">{batch.lot}</div>
                        <div className="text-ink-500 text-[11px] mt-0.5">
                          Exp: {new Date(batch.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          {expired ? (
                            <span className="ml-2 font-bold text-clay">EXPIRED</span>
                          ) : (
                            <span className={cn("ml-2", soon ? "font-semibold text-orange-500" : "text-ink-400")}>
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[14px] text-ink-900">
                          {batch.qty - batch.reserved_qty}
                        </div>
                        <div className="text-ink-400 text-[10px]">available</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Clinical notes */}
        {(drug.high_alert || drug.lasa_pair || drug.counseling || drug.controlled_schedule) && (
          <section>
            <h4 className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400 mb-2.5 flex items-center gap-1.5">
              <span className="h-px flex-1 bg-ink-100" />Clinical Notes<span className="h-px flex-1 bg-ink-100" />
            </h4>
            <div className="space-y-2 text-[12.5px]">
              {drug.high_alert && (
                <div className="p-3 bg-clay-soft/30 border border-clay/30 rounded-md text-clay font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  High-Alert Medication — double-check dose and patient identity before dispensing.
                </div>
              )}
              {drug.lasa_pair && (
                <div className="p-3 bg-mustard-soft/30 border border-mustard/30 rounded-md text-mustard font-semibold flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  LASA risk — looks/sounds like another drug. Verify label carefully.
                </div>
              )}
              {drug.controlled_schedule && (
                <div className="p-3 bg-plum-soft/30 border border-plum/30 rounded-md text-plum font-semibold flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                  {drug.controlled_schedule} — requires dual authorisation and narcotic register entry.
                </div>
              )}
              {drug.counseling && (
                <div className="p-3 bg-stone-50 border border-ink-200 rounded-md text-ink-700">
                  <span className="font-bold text-ink-900">Patient counseling: </span>
                  {drug.counseling}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pricing */}
        <section>
          <h4 className="font-mono text-[9.5px] uppercase tracking-wider font-bold text-ink-400 mb-2.5 flex items-center gap-1.5">
            <span className="h-px flex-1 bg-ink-100" />Pricing<span className="h-px flex-1 bg-ink-100" />
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bone border border-ink-200 rounded-lg p-3">
              <div className="text-[9.5px] font-mono uppercase text-ink-400 font-bold mb-1">Sell Price / unit</div>
              <div className="font-mono font-bold text-[15px] text-ink-900">₹{(drug.unit_price * 90).toFixed(2)}</div>
            </div>
            <div className="bg-bone border border-ink-200 rounded-lg p-3">
              <div className="text-[9.5px] font-mono uppercase text-ink-400 font-bold mb-1">Reorder Level</div>
              <div className="font-mono font-bold text-[15px] text-ink-900">{drug.reorder_level} u</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
