import { useState, useMemo } from "react";
import { useLabStore } from "@/lib/lab-desk/store";
import { SectionLabel } from "@/components/lab-desk/Pills";
import { Input } from "@/components/ui/input";
import { Search, Beaker, Clock, DollarSign, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "hematology", label: "Hematology" },
  { id: "biochemistry", label: "Biochemistry" },
  { id: "microbiology", label: "Microbiology" },
  { id: "serology", label: "Serology" },
  { id: "urinalysis", label: "Urinalysis" },
  { id: "endocrinology", label: "Endocrinology" },
];

export default function Catalog() {
  const { catalog } = useLabStore();
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");

  const filtered = useMemo(() => catalog.filter((t) => {
    if (section !== "all" && t.section !== section) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    return t.name.toLowerCase().includes(ql) || t.code.toLowerCase().includes(ql);
  }), [catalog, q, section]);

  return (
    <div className="space-y-6" data-testid="catalog-page">
      <SectionLabel action={<div className="text-xs font-mono uppercase tracking-wider text-ink-400">{filtered.length} of {catalog.length} tests</div>}>
        Test catalog
      </SectionLabel>

      <div className="surface p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input data-testid="catalog-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or code (CBC, LIPID…)" className="pl-9 bg-white border-ink-200" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setSection("all")} data-testid="section-all"
            className={cn("px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition",
              section === "all" ? "bg-sage text-white" : "bg-stone-100 text-ink-600 hover:bg-stone-200")}>All</button>
          {SECTIONS.map((s) => (
            <button key={s.id} data-testid={`section-${s.id}`} onClick={() => setSection(s.id)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition",
                section === s.id ? "bg-sage text-white" : "bg-stone-100 text-ink-600 hover:bg-stone-200")}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.code} className="surface p-5" data-testid={`catalog-${t.code}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400">{t.section}</div>
                <h3 className="font-display text-lg font-semibold mt-0.5">{t.name}</h3>
                <div className="font-mono text-xs text-ink-400">{t.code}</div>
              </div>
              <div className="flex items-center gap-1 text-sm font-mono text-[var(--sage-700)]"><DollarSign className="h-3.5 w-3.5" />{t.price}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs bg-stone-50 rounded-lg p-3 mb-3 border border-stone-100">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 flex items-center gap-1"><Clock className="h-3 w-3" /> TAT</div>
                <div className="font-medium">{t.tat_hours}h</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 flex items-center gap-1"><Droplet className="h-3 w-3" /> Tube</div>
                <div className="font-medium truncate">{t.tube}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 flex items-center gap-1"><Beaker className="h-3 w-3" /> Prep</div>
                <div className="font-medium">{t.fasting ? "Fasting" : "None"}</div>
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">Parameters & reference ranges</div>
            <div className="space-y-1">
              {t.parameters.map((p) => (
                <div key={p.key} className="flex justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                  <span className="text-ink-900">{p.label}</span>
                  <span className="font-mono text-ink-400">
                    {p.ref_text ? p.ref_text : `${p.ref_low ?? "—"}–${p.ref_high ?? "—"} ${p.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
