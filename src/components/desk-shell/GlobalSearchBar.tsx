import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { globalSearch, type SearchResult } from "@/lib/shared/global-search";
import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  className?: string;
  searchRing?: string;
};

export function GlobalSearchBar({
  placeholder = "Search patient, MRN, invoice…",
  className,
  searchRing = "focus:border-sage focus:ring-sage",
}: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(globalSearch(q));
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(r: SearchResult) {
    setOpen(false);
    setQ("");
    navigate({ to: r.to });
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        data-testid="global-search"
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-md border border-ink-200 bg-white pl-9 pr-3 text-[13px] placeholder:text-ink-400 focus:outline-none focus:ring-1",
          searchRing,
        )}
      />
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-ink-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-ink-400">No matches</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => pick(r)}
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-bone"
              >
                <span className="text-[13px] font-medium text-ink-900">{r.label}</span>
                <span className="font-mono text-[11px] text-ink-400">
                  {r.aiEnhanced && (
                    <Sparkles className="mr-1 inline h-3 w-3 text-teal" aria-hidden />
                  )}
                  {r.type} · {r.sub}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
