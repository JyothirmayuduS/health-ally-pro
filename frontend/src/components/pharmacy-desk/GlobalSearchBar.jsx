import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import LocationChip from "./LocationChip";
import { Search, MapPin, Pill, ArrowRight, History as HistoryIcon } from "lucide-react";
import { classNames } from "@/lib/pharmacy-desk/utils";

export default function GlobalSearchBar() {
  const ph = usePharmacy();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut: "/"
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => ph.searchCatalog(q, { limit: 8 }), [ph, q]);

  const recents = ph.recentSearches.slice(0, 5);

  const goToDrug = (drug) => {
    ph.recordSearch(drug.name);
    setOpen(false);
    setQ("");
    navigate(`/pharmacy/search?q=${encodeURIComponent(drug.name)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[420px]" data-testid="global-search">
      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        data-testid="global-search-input"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search drug, SKU, barcode, rack… ( / )"
        className="pharm-input pl-9 pr-12"
      />
      <span className="pharm-kbd absolute right-3 top-1/2 -translate-y-1/2">/</span>

      {open && (q || recents.length > 0) && (
        <div
          data-testid="global-search-results"
          className="absolute z-30 mt-1 left-0 right-0 pharm-card p-2 max-h-[60vh] overflow-y-auto scrollbar-thin animate-rise"
        >
          {!q && recents.length > 0 && (
            <div className="px-2 py-1">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1 flex items-center gap-1.5">
                <HistoryIcon className="h-3 w-3" /> Recent
              </div>
              <div className="flex flex-wrap gap-1">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setQ(r); inputRef.current?.focus(); }}
                    className="pharm-pill bg-[hsl(var(--paper-100))] border-border/70 text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && results.length === 0 && (
            <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">No drugs match “{q}”.</div>
          )}

          <ul>
            {results.map((d) => {
              const onHand = d.batches.reduce((a, b) => a + b.qty, 0);
              return (
                <li key={d.id}>
                  <button
                    data-testid={`global-result-${d.sku}`}
                    onClick={() => goToDrug(d)}
                    className="w-full text-left rounded-md px-2.5 py-2 hover:bg-[hsl(var(--paper-200))]/60 flex items-center gap-3 group"
                  >
                    <div className="h-8 w-8 rounded-md bg-[hsl(var(--sage-50))] flex items-center justify-center shrink-0">
                      <Pill className="h-4 w-4 text-[hsl(var(--sage-500))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[hsl(var(--ink))] truncate">
                        {d.name} <span className="text-muted-foreground">· {d.strength} · {d.form}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {d.sku} · on hand {onHand}{d.brand ? ` · brand ${d.brand}` : ""}
                      </div>
                    </div>
                    <LocationChip location={d.location} compact />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              );
            })}
          </ul>

          {q && (
            <div className="border-t border-border/60 mt-1 pt-1">
              <button
                data-testid="see-all-results"
                onClick={() => { ph.recordSearch(q); navigate(`/pharmacy/search?q=${encodeURIComponent(q)}`); setOpen(false); }}
                className="w-full rounded-md px-2.5 py-2 text-[12px] text-[hsl(var(--sage-500))] hover:bg-[hsl(var(--paper-200))]/60 flex items-center justify-between"
              >
                <span>See all results for “{q}”</span>
                <MapPin className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
