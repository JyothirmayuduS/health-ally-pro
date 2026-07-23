import { useState, useRef, useEffect } from "react";
import { searchIcd, type IcdDiagnosis } from "@/lib/hospital-masters";

type Props = {
  value: string;
  onChange: (code: string, entry?: IcdDiagnosis) => void;
  placeholder?: string;
  className?: string;
};

/** Searchable ICD-10 picker (Masters-backed). */
export function IcdPicker({ value, onChange, placeholder = "Search ICD-10…", className = "" }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<IcdDiagnosis[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    setResults(searchIcd(query));
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-[13px] focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-ink-200 bg-white shadow-soft">
          {results.map((r) => (
            <li key={r.code}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-sage-soft"
                onClick={() => {
                  onChange(r.code, r);
                  setQuery(`${r.code} — ${r.description}`);
                  setOpen(false);
                }}
              >
                <span className="font-mono font-medium text-sage">{r.code}</span>
                <span className="ml-2 text-ink-600">{r.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
