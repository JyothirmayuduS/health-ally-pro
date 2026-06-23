import React, { useMemo, useState } from "react";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import { Search, PackagePlus, Plus, Minus, AlertTriangle, Trash2 } from "lucide-react";

export default function Inventory() {
  const ph = usePharmacy();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | low | expiring | out
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ lot: "", qty: 100, expiry: "2027-06-01" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ph.inventory.filter((d) => {
      const onHand = d.batches.reduce((a, b) => a + b.qty, 0);
      const nearestExpiry = d.batches.reduce(
        (min, b) => (b.qty > 0 && (!min || new Date(b.expiry) < new Date(min)) ? b.expiry : min),
        null,
      );
      const days = nearestExpiry ? fmt.daysUntil(nearestExpiry) : Infinity;

      if (filter === "low" && onHand > d.reorderLevel) return false;
      if (filter === "expiring" && days >= 90) return false;
      if (filter === "out" && onHand > 0) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.sku.toLowerCase().includes(q) ||
        d.supplier.toLowerCase().includes(q)
      );
    });
  }, [ph.inventory, query, filter]);

  const filters = [
    { key: "all",      label: "All" },
    { key: "low",      label: `Low stock (${ph.counts.lowStock})` },
    { key: "expiring", label: `Expiring soon (${ph.counts.expiringSoon})` },
    { key: "out",      label: "Out of stock" },
  ];

  return (
    <div data-testid="inventory-page">
      <PageHeader
        title="Inventory"
        subtitle="Stock on hand, batches, expiries, and reorder levels."
        actions={
          <div className="relative" data-testid="inv-search">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drug, SKU, supplier…"
              data-testid="inv-search-input"
              className="pharm-input pl-9 w-[280px]"
            />
          </div>
        }
      >
        <div className="flex items-center gap-1" data-testid="inv-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              data-testid={`inv-filter-${f.key}`}
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

      <div className="max-w-[1400px] mx-auto px-8 py-7 space-y-3" data-testid="inv-list">
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12">No drugs match.</div>
        )}
        {filtered.map((drug, idx) => {
          const onHand = drug.batches.reduce((a, b) => a + b.qty, 0);
          const low = onHand <= drug.reorderLevel;
          const out = onHand === 0;
          const nearestExpiry = drug.batches.reduce(
            (min, b) => (b.qty > 0 && (!min || new Date(b.expiry) < new Date(min)) ? b.expiry : min),
            null,
          );
          const daysToExpiry = nearestExpiry ? fmt.daysUntil(nearestExpiry) : null;
          const expiringSoon = daysToExpiry !== null && daysToExpiry < 90 && onHand > 0;

          return (
            <article key={drug.id} data-testid={`drug-row-${idx}`} className="pharm-card p-4">
              <div className="flex items-start gap-5">
                {/* drug info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-[18px] text-[hsl(var(--ink))]">
                      {drug.name} <span className="text-muted-foreground text-[14px]">· {drug.strength}</span>
                    </h3>
                    <span className="pharm-pill bg-[hsl(var(--paper-100))] border-border/70 text-muted-foreground">
                      {drug.form}
                    </span>
                    {out && (
                      <span className="pharm-pill bg-rose-50 border-rose-200 text-rose-800">
                        <AlertTriangle className="h-3 w-3" /> Out of stock
                      </span>
                    )}
                    {!out && low && (
                      <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Low stock
                      </span>
                    )}
                    {expiringSoon && (
                      <span className="pharm-pill bg-amber-50 border-amber-200 text-amber-800">
                        Expiring {daysToExpiry}d
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 font-mono">
                    {drug.sku} · supplier {drug.supplier}
                  </div>
                </div>

                {/* on hand */}
                <div className="text-right shrink-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">On hand</div>
                  <div className={classNames(
                    "font-display text-[28px] leading-none tabular-nums",
                    out ? "text-rose-700" : low ? "text-amber-700" : "text-[hsl(var(--ink))]",
                  )}>
                    {onHand}
                  </div>
                  <div className="text-[11px] text-muted-foreground">reorder @ {drug.reorderLevel}</div>
                </div>

                <button
                  data-testid={`receive-${drug.id}`}
                  onClick={() => { setReceiveTarget(drug.id); setReceiveForm({ lot: "", qty: 100, expiry: "2027-06-01" }); }}
                  className="self-start inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))] transition-colors"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> Receive
                </button>
              </div>

              {/* batches */}
              <div className="mt-3 border-t border-border/60 pt-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Batches</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {drug.batches.length === 0 && (
                    <div className="text-[12px] text-muted-foreground italic">No batches recorded.</div>
                  )}
                  {drug.batches.map((b) => {
                    const d = fmt.daysUntil(b.expiry);
                    const expWarn = d !== null && d < 90;
                    return (
                      <div
                        key={b.lot}
                        className={classNames(
                          "rounded-md border bg-card px-3 py-2 flex items-center gap-3",
                          expWarn ? "border-amber-200" : "border-border/70",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[12px] text-[hsl(var(--ink))]">{b.lot}</div>
                          <div className={classNames("text-[11px]", expWarn ? "text-amber-700" : "text-muted-foreground")}>
                            Exp {fmt.date(b.expiry)} {expWarn ? `· ${d}d` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-[16px] tabular-nums">{b.qty}</div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            data-testid={`inc-${drug.id}-${b.lot}`}
                            onClick={() => ph.adjustStock(drug.id, b.lot, 10)}
                            className="rounded border border-border/70 bg-card p-0.5 hover:bg-[hsl(var(--paper-200))]/60"
                            title="+10"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            data-testid={`dec-${drug.id}-${b.lot}`}
                            onClick={() => ph.adjustStock(drug.id, b.lot, -10)}
                            className="rounded border border-border/70 bg-card p-0.5 hover:bg-[hsl(var(--paper-200))]/60"
                            title="-10"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          data-testid={`quarantine-${drug.id}-${b.lot}`}
                          onClick={() => ph.quarantineBatch(drug.id, b.lot)}
                          className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                          title="Quarantine batch (set qty 0)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {receiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="receive-modal">
          <div className="absolute inset-0 bg-[hsl(var(--ink))]/40 backdrop-blur-sm" onClick={() => setReceiveTarget(null)} />
          <div className="relative pharm-card w-full max-w-[420px] p-5 animate-rise">
            <h3 className="font-display text-[18px] mb-1">Receive stock</h3>
            <p className="text-[12px] text-muted-foreground mb-4">
              Adding a new batch to <strong>{ph.inventory.find((d) => d.id === receiveTarget)?.name}</strong>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Lot</label>
                <input
                  data-testid="receive-lot"
                  value={receiveForm.lot}
                  onChange={(e) => setReceiveForm({ ...receiveForm, lot: e.target.value.toUpperCase() })}
                  placeholder="e.g. AMX-8H22"
                  className="pharm-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quantity</label>
                  <input
                    data-testid="receive-qty"
                    type="number"
                    value={receiveForm.qty}
                    onChange={(e) => setReceiveForm({ ...receiveForm, qty: Number(e.target.value) || 0 })}
                    className="pharm-input"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Expiry</label>
                  <input
                    data-testid="receive-expiry"
                    type="date"
                    value={receiveForm.expiry}
                    onChange={(e) => setReceiveForm({ ...receiveForm, expiry: e.target.value })}
                    className="pharm-input"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setReceiveTarget(null)} className="px-3 py-1.5 text-sm border rounded-md hover:bg-[hsl(var(--paper-200))]/60">Cancel</button>
              <button
                data-testid="receive-confirm"
                disabled={!receiveForm.lot || receiveForm.qty <= 0}
                onClick={() => {
                  ph.receiveStock(receiveTarget, { lot: receiveForm.lot, qty: receiveForm.qty, expiry: receiveForm.expiry });
                  setReceiveTarget(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--sage-700))] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
