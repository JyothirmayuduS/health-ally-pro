import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useLabStore, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { useTechnicianOrders } from "@/lib/lab-desk/technician";
import {
  getSpecimenMeta,
  hasPhysicalSpecimen,
  tubeVisual,
} from "@/lib/lab-desk/specimen";
import { SectionLabel, EmptyState } from "@/components/lab-desk/Pills";
import { Boxes, Snowflake, Thermometer, MapPin, TestTube2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpecimenGroup = {
  id: string;
  title: string;
  hint: string;
  accent: string;
  filter: (status: string) => boolean;
};

const TECH_GROUPS: SpecimenGroup[] = [
  {
    id: "bench",
    title: "On my bench",
    hint: "Collected — run analyzer or enter results",
    accent: "border-teal",
    filter: (s) => s === "collected" || s === "processing",
  },
  {
    id: "lab",
    title: "In lab storage",
    hint: "Submitted — awaiting supervisor sign-off",
    accent: "border-mustard",
    filter: (s) => s === "validation",
  },
  {
    id: "released",
    title: "Released specimens",
    hint: "Report signed — retain per policy",
    accent: "border-sage",
    filter: (s) => s === "validated",
  },
];

function SpecimenCard({
  order,
  patients,
  findCatalog,
}: {
  order: ReturnType<typeof useTechnicianOrders>[0];
  patients: ReturnType<typeof useLabStore>["patients"];
  findCatalog: ReturnType<typeof useLabStore>["findCatalog"];
}) {
  const p = getPatient(order, patients);
  const cat = findCatalog(order.test_code);
  const spec = getSpecimenMeta(order, cat);
  const tube = tubeVisual(spec.tube);

  return (
    <div className="surface overflow-hidden" data-testid={`sample-${order.id}`}>
        <div className={cn("flex gap-4 border-l-4 p-4", tube.ring)}>
        <div className={`flex h-16 w-11 shrink-0 flex-col items-center rounded-full border-2 ${tube.ring} bg-white shadow-sm`}>
          <div className={`h-4 w-full rounded-t-full ${tube.cap}`} />
          <div className="flex-1" />
          <span className="pb-1 font-mono text-[8px] text-ink-500">{spec.volume_ml}mL</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-ink-900">{order.accession}</span>
            <span className="rounded bg-ink-200/60 px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-600">
              {spec.condition}
            </span>
          </div>
          <div className="mt-0.5 font-medium">{p?.name}</div>
          <div className="text-[12px] text-ink-500">
            {order.test_code} · {spec.sample_type}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <div className="flex items-center gap-1.5 text-ink-600">
              <MapPin className="h-3.5 w-3.5 text-teal" />
              {spec.storage_rack}-{spec.storage_slot}
            </div>
            <div className="flex items-center gap-1.5 text-ink-600">
              <Thermometer className="h-3.5 w-3.5 text-plum" />
              {spec.temp}
            </div>
            <div className="flex items-center gap-1.5 text-ink-600">
              <Snowflake className="h-3.5 w-3.5 text-sky-500" />
              {spec.tube}
            </div>
            <div className="text-ink-500">
              Drawn {formatDateTime(order.collected_at)}
            </div>
          </div>

          {(order.status === "collected" || order.status === "processing") && (
            <Link
              to="/lab/processing"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline"
            >
              <TestTube2 className="h-3.5 w-3.5" /> Process at bench →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Samples() {
  const { orders, patients, findCatalog } = useLabStore();
  const { isSupervisor } = useLabAuth();
  const myOrders = useTechnicianOrders();

  const specimens = useMemo(() => {
    const list = isSupervisor
      ? orders.filter(hasPhysicalSpecimen)
      : myOrders.filter(hasPhysicalSpecimen);
    return list.sort(
      (a, b) => new Date(b.collected_at!).getTime() - new Date(a.collected_at!).getTime(),
    );
  }, [orders, myOrders, isSupervisor]);

  const groups = isSupervisor
    ? [{ id: "all", title: "All specimens", hint: "Hospital-wide chain of custody", accent: "border-sage", filter: () => true }]
    : TECH_GROUPS;

  return (
    <div className="space-y-6" data-testid="samples-page">
      <div className="border-l-4 border-teal bg-teal-soft/40 px-4 py-3 text-[13px] text-ink-700">
        <strong className="text-teal">Specimen tracking</strong> — physical tubes only. Orders still
        awaiting draw stay in{" "}
        <Link to="/lab/collection" className="font-medium text-plum hover:underline">Collection</Link>.
        Results sent for sign-off appear in{" "}
        <Link to="/lab/my-submissions" className="font-medium text-sage hover:underline">My submissions</Link>.
      </div>

      <SectionLabel
        action={
          <span className="font-mono text-[11px] uppercase tracking-wider text-teal">
            {specimens.length} specimen{specimens.length === 1 ? "" : "s"}
          </span>
        }
      >
        {isSupervisor ? "All samples" : "My samples"}
      </SectionLabel>

      {specimens.length === 0 ? (
        <div className="surface p-8">
          <EmptyState
            icon={Boxes}
            title="No specimens on record"
            hint="Draw a patient in Collection — the tube will appear here with rack and temperature."
          />
          <div className="mt-4 text-center">
            <Link to="/lab/collection" className="btn-primary !inline-flex !h-9">
              Go to Collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const list = specimens.filter((o) => group.filter(o.status));
            if (list.length === 0 && !isSupervisor) return null;
            return (
              <div key={group.id}>
                <div className={cn("mb-3 border-l-4 pl-3", group.accent)}>
                  <div className="font-heading font-semibold text-ink-900">
                    {group.title} ({list.length})
                  </div>
                  <div className="text-[12px] text-ink-500">{group.hint}</div>
                </div>
                {list.length === 0 ? (
                  <p className="text-[13px] text-ink-400">None in this stage.</p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {list.map((o) => (
                      <SpecimenCard key={o.id} order={o} patients={patients} findCatalog={findCatalog} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
