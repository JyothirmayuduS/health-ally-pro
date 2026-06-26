import { ErpStatusPill } from "@/components/hospital-erp/ErpStatusPill";
import {
  IPD_ADMISSIONS_CURRENT,
  IPD_ADMISSIONS_PENDING,
  IPD_SUMMARY,
  WARD_OCCUPANCY,
} from "@/lib/hospital-erp-data";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";

export default function NursingBedsPage() {
  return (
    <div className="space-y-6" data-testid="nursing-beds">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskKpi label="Total beds" value={IPD_SUMMARY.totalBeds} accent="text-teal" />
        <DeskKpi label="Occupied" value={IPD_SUMMARY.occupied} accent="text-plum" />
        <DeskKpi label="Available" value={IPD_SUMMARY.available} accent="text-sage" />
        <DeskKpi label="Occupancy rate" value={`${IPD_SUMMARY.occupancyRate}%`} accent="text-teal" />
      </div>

      <DeskPanel title="Ward occupancy overview">
        <div className="space-y-4 p-5">
          {WARD_OCCUPANCY.map((w) => {
            const pct = Math.round((w.occupied / w.total) * 100);
            return (
              <div key={w.ward}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{w.ward}</span>
                  <span className="text-ink-400">
                    {w.occupied}/{w.total} beds · {pct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </DeskPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DeskPanel title="Current admissions">
          <ul className="divide-y divide-ink-100">
            {IPD_ADMISSIONS_CURRENT.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{a.patient}</span>
                  <ErpStatusPill status={a.priority} />
                </div>
                <p className="mt-1 text-sm text-ink-600">{a.diagnosis}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {a.mrn} · {a.doctor} · Admitted {a.admitted}
                </p>
              </li>
            ))}
          </ul>
        </DeskPanel>

        <DeskPanel title="Pending admissions">
          <ul className="divide-y divide-ink-100">
            {IPD_ADMISSIONS_PENDING.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{a.patient}</span>
                  <ErpStatusPill status={a.priority} />
                </div>
                <p className="mt-1 text-sm text-ink-600">{a.diagnosis}</p>
                <p className="mt-1 text-xs text-ink-400">
                  Requested {a.requested} · {a.doctor}
                </p>
              </li>
            ))}
          </ul>
        </DeskPanel>
      </div>
    </div>
  );
}
