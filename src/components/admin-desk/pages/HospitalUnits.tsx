import { useEffect, useMemo, useState } from "react";
import {
  HOSPITAL_UNITS,
  addUnitRecord,
  loadUnitRecords,
  subscribeUnitRecords,
  updateUnitStatus,
  type HospitalUnitId,
  type UnitRecord,
} from "@/lib/admin-desk/hospital-units";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CLASS: Record<string, string> = {
  routine: "bg-stone-100 text-ink-500",
  urgent: "bg-amber-50 text-amber-800",
  stat: "bg-rose-50 text-rose-700",
};

export default function HospitalUnitsPage() {
  const [unitId, setUnitId] = useState<HospitalUnitId>("blood_bank");
  const [records, setRecords] = useState<UnitRecord[]>([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const refresh = () => setRecords(loadUnitRecords());
  useEffect(() => {
    refresh();
    void import("@/lib/admin-desk/hospital-units").then(({ hydrateUnitRecordsFromRemote }) =>
      hydrateUnitRecordsFromRemote().then(() => refresh()),
    );
    return subscribeUnitRecords(refresh);
  }, []);

  const unit = HOSPITAL_UNITS.find((u) => u.id === unitId)!;
  const filtered = useMemo(() => records.filter((r) => r.unitId === unitId), [records, unitId]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addUnitRecord({
      unitId,
      title: title.trim(),
      detail: detail.trim() || "—",
      status: unit.statuses[0],
      priority: "routine",
    });
    setTitle("");
    setDetail("");
    toast.success(`Added to ${unit.name}`);
    refresh();
  };

  return (
    <div className="space-y-6" data-testid="admin-hospital-units">
      <div className="surface border border-ink-100 rounded-lg p-4">
        <h2 className="font-heading text-[15px] font-semibold text-ink-950">
          Hospital support units
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-500">
          Blood bank, CSSD, ambulance, ICU board, dialysis, mortuary, biomedical, cath lab, chemo
          day-care and physiotherapy — operational boards for a multi-specialty hospital.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {HOSPITAL_UNITS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setUnitId(u.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
              unitId === u.id
                ? "bg-plum text-white"
                : "bg-white border border-ink-100 text-ink-600 hover:border-plum/40",
            )}
          >
            {u.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <form
          onSubmit={add}
          className="surface border border-ink-100 rounded-lg p-4 space-y-3 h-fit"
        >
          <p className="text-[12px] font-semibold text-ink-800">Add to {unit.name}</p>
          <p className="text-[11px] text-ink-400">{unit.description}</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title / item"
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-[13px]"
          />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Detail"
            className="w-full min-h-[72px] rounded-md border border-ink-200 px-3 py-2 text-[13px]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add record
          </button>
        </form>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="surface border border-dashed border-ink-200 rounded-lg p-8 text-center text-[13px] text-ink-400">
              No records in this unit yet.
            </div>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="surface border border-ink-100 rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-[14px] font-semibold text-ink-950">
                        {r.title}
                      </h3>
                      {r.priority ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            PRIORITY_CLASS[r.priority],
                          )}
                        >
                          {r.priority}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-500">{r.detail}</p>
                    {r.meta ? (
                      <p className="mt-0.5 text-[11px] font-mono text-ink-400">{r.meta}</p>
                    ) : null}
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => {
                      updateUnitStatus(r.id, e.target.value);
                      refresh();
                    }}
                    className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink-700"
                  >
                    {unit.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {!unit.statuses.includes(r.status) ? (
                      <option value={r.status}>{r.status}</option>
                    ) : null}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
