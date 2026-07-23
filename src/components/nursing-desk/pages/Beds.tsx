import { useEffect, useMemo, useState } from "react";
import { ErpStatusPill } from "@/components/hospital-erp/ErpStatusPill";
import {
  loadReceptionAdmissions,
  loadReceptionBeds,
  RECEPTION_IPD_EVENT,
  WARD_CATEGORIES,
  type AdmissionRecord,
  type Bed,
} from "@/lib/reception-desk/store";
import { DOCTORS } from "@/lib/reception-desk/mockData";
import { getSharedPatient } from "@/lib/shared/patients";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";

function doctorName(id: string): string {
  return DOCTORS.find((d) => d.id === id)?.name ?? id;
}

function wardLabel(category: Bed["wardCategory"]): string {
  return WARD_CATEGORIES.find((w) => w.id === category)?.name ?? category;
}

export default function NursingBedsPage() {
  const [beds, setBeds] = useState<Bed[]>(() => loadReceptionBeds());
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>(() => loadReceptionAdmissions());

  useEffect(() => {
    const refresh = () => {
      setBeds(loadReceptionBeds());
      setAdmissions(loadReceptionAdmissions());
    };
    refresh();
    window.addEventListener(RECEPTION_IPD_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECEPTION_IPD_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const summary = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.status === "occupied").length;
    const available = beds.filter((b) => b.status === "available").length;
    const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, occupancyRate };
  }, [beds]);

  const wardOccupancy = useMemo(() => {
    return WARD_CATEGORIES.map((cat) => {
      const wardBeds = beds.filter((b) => b.wardCategory === cat.id);
      const occupied = wardBeds.filter((b) => b.status === "occupied").length;
      return { ward: cat.name, total: wardBeds.length, occupied };
    }).filter((w) => w.total > 0);
  }, [beds]);

  const currentAdmissions = useMemo(
    () => admissions.filter((a) => a.status === "active" || a.status === "pending-clearance"),
    [admissions],
  );

  const pendingAdmissions = useMemo(
    () => admissions.filter((a) => a.status === "pending-clearance"),
    [admissions],
  );

  return (
    <div className="space-y-6" data-testid="nursing-beds">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskKpi label="Total beds" value={summary.total} accent="text-teal" />
        <DeskKpi label="Occupied" value={summary.occupied} accent="text-plum" />
        <DeskKpi label="Available" value={summary.available} accent="text-sage" />
        <DeskKpi label="Occupancy rate" value={`${summary.occupancyRate}%`} accent="text-teal" />
      </div>

      <DeskPanel title="Ward occupancy overview">
        <div className="space-y-4 p-5">
          {wardOccupancy.map((w) => {
            const pct = w.total ? Math.round((w.occupied / w.total) * 100) : 0;
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
            {currentAdmissions.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-500">No active admissions.</li>
            ) : (
              currentAdmissions.map((a) => {
                const patient = getSharedPatient(a.patientId);
                const bed = beds.find((b) => b.id === a.bedId);
                return (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">
                        {patient?.name ?? a.patientId}
                      </span>
                      <ErpStatusPill
                        status={a.status === "pending-clearance" ? "pending" : "active"}
                      />
                    </div>
                    <p className="mt-1 text-sm text-ink-600">
                      {bed ? `${bed.name} · ${wardLabel(bed.wardCategory)}` : a.bedId}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {a.patientId} · {doctorName(a.doctorId)} · Admitted{" "}
                      {new Date(a.admittedAt).toLocaleDateString()}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </DeskPanel>

        <DeskPanel title="Pending clearance">
          <ul className="divide-y divide-ink-100">
            {pendingAdmissions.length === 0 ? (
              <li className="px-5 py-4 text-sm text-ink-500">No discharges pending clearance.</li>
            ) : (
              pendingAdmissions.map((a) => {
                const patient = getSharedPatient(a.patientId);
                return (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">
                        {patient?.name ?? a.patientId}
                      </span>
                      <ErpStatusPill status="pending" />
                    </div>
                    <p className="mt-1 text-sm text-ink-600">
                      Awaiting pharmacy / billing clearance
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {a.patientId} · {doctorName(a.doctorId)}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </DeskPanel>
      </div>
    </div>
  );
}
