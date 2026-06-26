import { useMemo, useState, useEffect } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { usePharmacyStore, searchMedicines, availableQty } from "@/lib/pharmacy-desk/store";
import { SectionLabel, LocationChip, PickPath, EmptyState } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Package, Snowflake, AlertTriangle } from "lucide-react";
import { expiryStatus, formatLocation, zoneLabel } from "@/lib/pharmacy-desk/location";

export default function MedicineSearch() {
  const { drugs, batches } = usePharmacyStore();
  const searchParams = useSearch({ strict: false }) as { q?: string };
  const [query, setQuery] = useState(searchParams.q ?? "");
  const [zone, setZone] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.q) setQuery(searchParams.q);
  }, [searchParams.q]);

  const results = useMemo(
    () =>
      searchMedicines(query, drugs, batches, {
        zone: zone === "all" ? undefined : (zone as "main" | "cold" | "controlled" | "otc"),
        inStockOnly,
      }),
    [query, drugs, batches, zone, inStockOnly],
  );

  const selected = results.find((r) => r.drug.id === selectedId) ?? results[0];

  return (
    <div className="space-y-6" data-testid="medicine-search">
      <SectionLabel>Medicine search</SectionLabel>

      <div className="surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mustard" />
          <Input
            autoFocus
            placeholder="Drug name, brand, SKU, barcode, rack A3, tray T12…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 border-ink-200 bg-white pl-11 text-[15px]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "main", "cold", "controlled", "otc"] as const).map((z) => (
            <Button key={z} size="sm" variant={zone === z ? "default" : "outline"} className={zone === z ? "btn-primary" : "border-ink-200"} onClick={() => setZone(z)}>
              {z === "all" ? "All zones" : zoneLabel(z)}
            </Button>
          ))}
          <Button size="sm" variant={inStockOnly ? "default" : "outline"} className={inStockOnly ? "btn-primary" : "border-ink-200"} onClick={() => setInStockOnly(!inStockOnly)}>
            In stock only
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="surface lg:col-span-2">
          <div className="border-b border-ink-200 px-4 py-3 text-[12px] text-ink-500">{results.length} results</div>
          <div className="max-h-[520px] divide-y divide-ink-100 overflow-y-auto">
            {results.length === 0 ? (
              <EmptyState icon={Search} title="No matches" hint="Try generic name, SKU, or location code like A3-T12-S4" />
            ) : (
              results.map((hit) => (
                <button
                  key={hit.drug.id}
                  type="button"
                  onClick={() => setSelectedId(hit.drug.id)}
                  className={`w-full px-4 py-3 text-left transition ${selected?.drug.id === hit.drug.id ? "bg-mustard-soft/40" : "hover:bg-stone-50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-ink-900">{hit.drug.generic_name}</div>
                      <div className="text-[11px] text-ink-400">{hit.drug.strength} · {hit.drug.form}</div>
                    </div>
                    {hit.lowStock && <AlertTriangle className="h-4 w-4 shrink-0 text-clay" />}
                  </div>
                  <div className="mt-1.5"><LocationChip location={hit.drug.location} /></div>
                  <div className="mt-1 font-mono text-[11px] text-ink-500">Avail {hit.available} · {hit.matchReason}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="surface lg:col-span-3">
          {!selected ? (
            <EmptyState icon={MapPin} title="Select a medicine" hint="Search results show rack, tray, and slot." />
          ) : (
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-[22px] font-semibold text-ink-900">{selected.drug.generic_name}</h3>
                  <p className="text-[13px] text-ink-600">{selected.drug.strength} · {selected.drug.form} · {selected.drug.route}</p>
                  <p className="mt-1 text-[12px] text-ink-400">Brands: {selected.drug.brand_names.join(", ")}</p>
                </div>
                {selected.drug.controlled_schedule && (
                  <span className="rounded-sm bg-plum-soft px-2 py-1 text-[10px] font-medium uppercase text-plum">{selected.drug.controlled_schedule}</span>
                )}
              </div>

              <div className="mt-6 rounded-lg border border-mustard/30 bg-mustard-soft/30 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mustard">
                  <MapPin className="h-3.5 w-3.5" /> Storage location
                </div>
                <div className="mt-2 font-heading text-[18px] font-semibold text-ink-900">{formatLocation(selected.drug.location)}</div>
                <div className="mt-1 text-[12px] text-ink-600">{zoneLabel(selected.drug.location.zone)} · {selected.drug.location.temp}</div>
                <div className="mt-3"><LocationChip location={selected.drug.location} size="md" /></div>
                <div className="mt-4"><PickPath location={selected.drug.location} /></div>
                <Link to="/pharmacy/map" search={{ highlight: selected.drug.location.location_code }} className="btn-outline mt-4 inline-flex !h-8 !text-[12px]">
                  <MapPin className="mr-1.5 h-3.5 w-3.5" /> View on shelf map
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-ink-200 p-4">
                  <div className="font-mono text-[10px] uppercase text-ink-400">Stock</div>
                  <div className="font-heading mt-1 text-[28px] font-semibold tabular-nums">{selected.available}</div>
                  <div className="text-[12px] text-ink-500">Reorder at {selected.drug.reorder_level}</div>
                </div>
                <div className="rounded-lg border border-ink-200 p-4">
                  <div className="font-mono text-[10px] uppercase text-ink-400">Identifiers</div>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-ink-600">
                    <div>SKU {selected.drug.sku}</div>
                    <div>Barcode {selected.drug.barcode}</div>
                  </div>
                </div>
              </div>

              {selected.fefo && (
                <div className="mt-4 rounded-lg border border-sage/30 bg-sage-soft/30 p-4">
                  <div className="text-[12px] font-medium text-sage">FEFO — pick this batch first</div>
                  <div className="mt-1 font-mono text-[13px]">Lot {selected.fefo.lot} · Exp {expiryStatus(selected.fefo.expiry).label} · Qty {selected.fefo.qty - selected.fefo.reserved_qty}</div>
                </div>
              )}

              <div className="mt-4">
                <div className="mb-2 font-mono text-[10px] uppercase text-ink-400">All batches</div>
                <div className="space-y-2">
                  {selected.batches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-md border border-ink-100 px-3 py-2 text-[12px]">
                      <span className="font-mono">{b.lot}</span>
                      <span>{b.qty - b.reserved_qty} avail</span>
                      <span className={expiryStatus(b.expiry).level === "critical" ? "text-clay" : "text-ink-400"}>{expiryStatus(b.expiry).label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.drug.counseling && (
                <div className="mt-4 text-[12px] text-ink-600"><strong>Counseling:</strong> {selected.drug.counseling}</div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/pharmacy/dispense" className="btn-primary !h-9"><Package className="mr-1.5 h-4 w-4" /> Add to dispense</Link>
                <Link to="/pharmacy/inventory" className="btn-outline !h-9">Manage stock</Link>
                {selected.drug.location.zone === "cold" && (
                  <span className="inline-flex items-center gap-1 self-center text-[11px] text-teal"><Snowflake className="h-3.5 w-3.5" /> Cold chain</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
