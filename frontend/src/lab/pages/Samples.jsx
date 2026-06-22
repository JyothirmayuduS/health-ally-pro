import { useMemo } from "react";
import { useLab, formatDateTime, getPatient } from "@/lab/store";
import { SectionLabel, StatusPill } from "@/lab/components/Pills";
import { Boxes, Snowflake } from "lucide-react";

const STAGES = ["ordered", "collected", "processing", "validation", "validated"];
const STAGE_LABEL = {
  ordered: "Ordered",
  collected: "Collected",
  processing: "Received in lab",
  validation: "Processed",
  validated: "Released",
};

export default function Samples() {
  const { orders, patients } = useLab();

  const active = useMemo(
    () => orders.filter((o) => o.status !== "cancelled").sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at)),
    [orders],
  );

  const stageIndex = (status) => {
    if (status === "validated") return 4;
    return STAGES.indexOf(status);
  };

  return (
    <div className="space-y-6" data-testid="samples-page">
      <SectionLabel
        action={<div className="text-xs font-mono uppercase tracking-wider text-stone-500">{active.length} active samples</div>}
      >
        Sample &amp; chain-of-custody tracking
      </SectionLabel>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-4">Accession lifecycle</div>
        <div className="space-y-5">
          {active.map((o) => {
            const p = getPatient(o, patients);
            const idx = stageIndex(o.status);
            return (
              <div key={o.id} className="border-b border-stone-100 pb-5 last:border-0 last:pb-0" data-testid={`sample-${o.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-mono text-sm font-semibold">{o.accession}</div>
                    <div className="text-xs text-stone-500">
                      {p?.name} · {o.test_code} · {p?.mrn}
                    </div>
                  </div>
                  <StatusPill status={o.status} />
                </div>

                <div className="flex items-center gap-2">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            i <= idx
                              ? "h-3 w-3 rounded-full bg-[var(--sage-700)] ring-4 ring-[var(--sage-100)]"
                              : "h-3 w-3 rounded-full bg-stone-200"
                          }
                        />
                        <div className={i <= idx ? "text-[10px] font-mono uppercase tracking-wider mt-1.5 text-[var(--sage-900)]" : "text-[10px] font-mono uppercase tracking-wider mt-1.5 text-stone-400"}>
                          {STAGE_LABEL[s]}
                        </div>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={i < idx ? "flex-1 h-0.5 bg-[var(--sage-500)]" : "flex-1 h-0.5 bg-stone-200"} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-stone-600">
                  <div><span className="text-stone-500">Ordered:</span> {formatDateTime(o.ordered_at)}</div>
                  <div><span className="text-stone-500">Collected:</span> {formatDateTime(o.collected_at)}</div>
                  <div><span className="text-stone-500">Reported:</span> {formatDateTime(o.released_at)}</div>
                  <div className="flex items-center gap-1"><Snowflake className="h-3 w-3 text-sky-500" /><span className="text-stone-500">Storage:</span> Rack A-{(parseInt(o.id.slice(-2), 10) % 12) + 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
