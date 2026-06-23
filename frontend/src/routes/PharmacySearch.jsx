import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import LocationChip from "@/components/pharmacy-desk/LocationChip";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import {
  Pill, Boxes, AlertTriangle, Star, Tag, ArrowRight, ShieldCheck, Snowflake, Lock,
} from "lucide-react";

const FILTERS = [
  { key: "all",        label: "All" },
  { key: "in_stock",   label: "In stock" },
  { key: "low",        label: "Low" },
  { key: "expiring",   label: "Expiring < 90d" },
  { key: "controlled", label: "Controlled" },
  { key: "fridge",     label: "Cold chain" },
  { key: "otc",        label: "OTC" },
];

export default function PharmacySearch() {
  const ph = usePharmacy();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState(params.get("q") || "");
  const navigate = useNavigate();

  useEffect(() => {
    if (q) ph.recordSearch(q);
    setParams(q ? { q } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const results = useMemo(() => {
    const base = q ? ph.searchCatalog(q, { limit: 50 }) : ph.inventory;
    return base.filter((d) => {
      const onHand = d.batches.reduce((a, b) => a + b.qty, 0);
      if (filter === "in_stock"   && onHand === 0) return false;
      if (filter === "low"        && onHand > d.reorderLevel) return false;
      if (filter === "expiring"   && !d.batches.some((b) => b.qty > 0 && fmt.daysUntil(b.expiry) < 90)) return false;
      if (filter === "controlled" && !d.controlled) return false;
      if (filter === "fridge"     && d.location.zone !== "COLD_CHAIN") return false;
      if (filter === "otc"        && !d.flags.includes("otc")) return false;
      return true;
    });
  }, [ph, q, filter]);

  const favorites = ph.inventory.filter((d) => (ph.favorites || []).includes(d.sku));

  return (
    <div data-testid="search-page">
      <PageHeader
        title="Medicine search"
        subtitle="Type a drug name, generic, brand, SKU, barcode or rack code. Press / from anywhere to focus."
        hideSearch
      >
        <div className="flex items-center gap-2 flex-wrap" data-testid="search-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              data-testid={`search-filter-${f.key}`}
              onClick={() => setFilter(f.key)}
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                filter === f.key
                  ? "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))]"
                  : "text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="max-w-[1500px] mx-auto px-8 py-7">
        <div className="pharm-card p-4 mb-6">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Query</label>
          <input
            autoFocus
            data-testid="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Amoxicillin · 500mg · A1-T01-S2 · 8901234560011 …"
            className="pharm-input mt-1"
          />
          {q && (
            <div className="mt-2 text-[12px] text-muted-foreground">
              <span data-testid="search-result-count">{results.length}</span> result{results.length === 1 ? "" : "s"} for “{q}”
            </div>
          )}
        </div>

        {/* Favourites */}
        {!q && filter === "all" && favorites.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Star className="h-3 w-3" /> Pinned favourites
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorites.map((d, idx) => <DrugCard key={d.id} drug={d} ph={ph} navigate={navigate} idx={idx} pinned />)}
            </div>
          </section>
        )}

        <section className="space-y-3" data-testid="search-results">
          {results.length === 0 && (
            <div className="text-center text-muted-foreground py-12">No drugs match.</div>
          )}
          {results.map((d, idx) => <DrugCard key={d.id} drug={d} ph={ph} navigate={navigate} idx={idx} />)}
        </section>
      </div>
    </div>
  );
}

function DrugCard({ drug, ph, navigate, idx, pinned }) {
  const onHand = drug.batches.reduce((a, b) => a + b.qty, 0);
  const low = onHand <= drug.reorderLevel;
  const out = onHand === 0;
  const fefo = [...drug.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];

  return (
    <article className="pharm-card p-5" data-testid={`drug-card-${idx}`}>
      <div className="flex items-start gap-5">
        <div className="h-11 w-11 rounded-md bg-[hsl(var(--sage-50))] flex items-center justify-center shrink-0">
          <Pill className="h-5 w-5 text-[hsl(var(--sage-500))]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-[19px] text-[hsl(var(--ink))]">
              {drug.name} <span className="text-muted-foreground text-[14px]">· {drug.strength}</span>
            </h3>
            <span className="pharm-pill bg-[hsl(var(--paper-100))] border-border/70 text-muted-foreground">{drug.form}</span>
            {drug.flags?.includes("otc") && <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800"><Tag className="h-3 w-3" />OTC</span>}
            {drug.rxRequired && <span className="pharm-pill bg-sky-50 border-sky-200 text-sky-800"><ShieldCheck className="h-3 w-3" />Rx</span>}
            {drug.flags?.includes("fridge") && <span className="pharm-pill bg-sky-50 border-sky-200 text-sky-800"><Snowflake className="h-3 w-3" />Cold chain</span>}
            {drug.controlled && <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800"><Lock className="h-3 w-3" />Schedule {drug.controlled}</span>}
            {drug.flags?.includes("high-alert") && <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800">High-alert</span>}
            {pinned && <span className="pharm-pill bg-emerald-50 border-emerald-200 text-emerald-800"><Star className="h-3 w-3" />Pinned</span>}
          </div>
          <div className="text-[12px] text-muted-foreground mt-1 font-mono">
            Generic <span className="text-foreground/80">{drug.generic}</span>
            {drug.brand ? <> · Brand <span className="text-foreground/80">{drug.brand}</span></> : null}
            · SKU {drug.sku}{drug.barcode ? ` · ${drug.barcode}` : ""}
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Location</div>
              <LocationChip location={drug.location} />
              <div className="mt-1 text-[11px] text-muted-foreground">
                {drug.location.zone} · Aisle {drug.location.aisle}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Stock</div>
              <div className={classNames("font-display text-[18px] tabular-nums", out ? "text-rose-700" : low ? "text-amber-700" : "text-[hsl(var(--ink))]")}>
                {onHand} <span className="text-muted-foreground text-[12px]">on hand</span>
              </div>
              <div className="text-[11px] text-muted-foreground">reorder @ {drug.reorderLevel}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">FEFO pick</div>
              {fefo ? (
                <div className="text-[12px] font-mono">{fefo.lot} <span className="text-muted-foreground">× {fefo.qty}</span></div>
              ) : (
                <div className="text-[12px] text-rose-700 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Out of stock</div>
              )}
              {fefo && <div className="text-[11px] text-muted-foreground">Exp {fmt.date(fefo.expiry)}</div>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            data-testid={`go-inventory-${drug.sku}`}
            onClick={() => navigate(`/pharmacy/inventory?focus=${drug.id}`)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] hover:bg-[hsl(var(--paper-200))]/60"
          >
            <Boxes className="h-3 w-3" /> Inventory
          </button>
          <button
            data-testid={`go-map-${drug.sku}`}
            onClick={() => navigate(`/pharmacy/inventory/map?focus=${drug.id}`)}
            className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-2.5 py-1.5 text-[12px] hover:bg-[hsl(var(--sage-700))]"
          >
            View on map <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
