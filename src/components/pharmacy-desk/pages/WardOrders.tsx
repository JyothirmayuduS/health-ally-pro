import { useMemo, useState } from "react";
import { usePharmacyStore, getPatient } from "@/lib/pharmacy-desk/store";
import { SectionLabel, PriorityPill, LocationChip, PickPath, EmptyState } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { BedDouble, Truck, PackageCheck, MapPin } from "lucide-react";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { formatRelative } from "@/lib/pharmacy-desk/utils";

const STATUS_FILTERS = ["all", "pending", "picking", "in_transit", "delivered"] as const;

export default function WardOrders() {
  const { wardOrders, patients, startWardPick, deliverWardOrder } = usePharmacyStore();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = filter === "all" ? wardOrders : wardOrders.filter((w) => w.status === filter);
    return [...list].sort((a, b) => {
      const p = { stat: 0, urgent: 1, routine: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [wardOrders, filter]);

  const selected = filtered.find((w) => w.id === selectedId) ?? filtered[0];
  const patient = selected && getPatient(selected.patient_id, patients);
  const drug = selected && findDrug(selected.drug_id);

  return (
    <div className="space-y-6" data-testid="ward-orders">
      <SectionLabel action={
        <Button variant="outline" size="sm" className="border-ink-200">
          <BedDouble className="mr-1.5 h-3.5 w-3.5" /> {filtered.filter((w) => w.status !== "delivered").length} active
        </Button>
      }>
        Ward & IPD deliveries
      </SectionLabel>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className={filter === f ? "btn-primary" : "border-ink-200"} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.replace("_", " ")}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface lg:col-span-1 divide-y divide-ink-100">
          {filtered.length === 0 ? (
            <EmptyState icon={BedDouble} title="No ward orders" />
          ) : (
            filtered.map((w) => {
              const p = getPatient(w.patient_id, patients);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  className={`w-full px-4 py-3 text-left transition ${selected?.id === w.id ? "bg-teal-soft/50" : "hover:bg-stone-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <PriorityPill priority={w.priority} />
                    <span className="font-mono text-[11px] uppercase text-ink-400">{w.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 font-medium text-ink-900">{w.ward} · Bed {w.bed}</div>
                  <div className="text-[12px] text-ink-600">{p?.name} · Nurse {w.nurse}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="surface lg:col-span-2 p-5">
          {!selected || !drug ? (
            <EmptyState icon={Truck} title="Select ward order" />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-[20px] font-semibold">{selected.ward} — Bed {selected.bed}</h3>
                  <p className="text-[13px] text-ink-600">{patient?.name} · {patient?.mrn} · Nurse {selected.nurse}</p>
                  <p className="mt-1 text-[12px] text-ink-400">Requested {formatRelative(selected.requested_at)}</p>
                </div>
                <PriorityPill priority={selected.priority} />
              </div>

              <div className="mt-6 rounded-lg border border-teal/30 bg-teal-soft/30 p-4">
                <div className="font-medium text-ink-900">{drug.generic_name} {drug.strength}</div>
                <div className="text-[12px] text-ink-600">Qty {selected.qty} · {drug.form}</div>
                {selected.notes && <p className="mt-2 text-[12px] text-ink-500">{selected.notes}</p>}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase text-ink-400">
                  <MapPin className="h-3.5 w-3.5" /> Pick location
                </div>
                <LocationChip location={drug.location} size="md" />
                <div className="mt-3"><PickPath location={drug.location} /></div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selected.status === "pending" && (
                  <Button className="btn-primary" onClick={() => startWardPick(selected.id)}>
                    <PackageCheck className="mr-1.5 h-4 w-4" /> Start pick
                  </Button>
                )}
                {["picking", "in_transit"].includes(selected.status) && (
                  <Button className="btn-primary" onClick={() => deliverWardOrder(selected.id)}>
                    <Truck className="mr-1.5 h-4 w-4" /> Confirm delivered to ward
                  </Button>
                )}
                {selected.status === "delivered" && (
                  <span className="text-[13px] text-sage font-medium">✓ Delivered</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
