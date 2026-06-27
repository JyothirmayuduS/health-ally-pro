import { useMemo, useState } from "react";
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
import { Boxes, Snowflake, Thermometer, MapPin, TestTube2, CheckCircle2, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const { acceptSampleAtLab } = useLabStore();
  const p = getPatient(order, patients);
  const cat = findCatalog(order.test_code);
  const spec = getSpecimenMeta(order, cat);
  const tube = tubeVisual(spec.tube);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [condition, setCondition] = useState("Adequate");
  const [verifyNote, setVerifyNote] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  const isReceived = order.chainOfCustody?.some((c) => c.step === "received_at_lab");

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    acceptSampleAtLab(order.id, condition, verifyNote);
    setVerifyOpen(false);
    setVerifyNote("");
  };

  return (
    <>
      <div
        className="surface overflow-hidden hover:bg-stone-50/70 transition-colors cursor-pointer"
        data-testid={`sample-${order.id}`}
        onClick={() => setDetailOpen(true)}
      >
      <div className={cn("flex gap-4 border-l-4 p-4", tube.ring)}>
        <div className={`flex h-16 w-11 shrink-0 flex-col items-center rounded-full border-2 ${tube.ring} bg-white shadow-sm`}>
          <div className={`h-4 w-full rounded-t-full ${tube.cap}`} />
          <div className="flex-1" />
          <span className="pb-1 font-mono text-[8px] text-ink-500">{spec.volume_ml}mL</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-ink-900">{order.accession}</span>
            <span className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold",
              (!order.specimen?.condition || order.specimen.condition === "Adequate")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}>
              {order.specimen?.condition || "Adequate"}
            </span>
            {order.sampleConditionOverride && (
              <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold">
                Override active
              </span>
            )}
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

          <div className="flex flex-wrap items-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
            {order.status === "collected" && !isReceived && (
              <Button
                size="sm"
                className="bg-teal text-white hover:bg-teal/90 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setVerifyOpen(true);
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Receive & verify condition
              </Button>
            )}

            {isReceived && (order.status === "collected" || order.status === "processing") && (
              (() => {
                const cond = order.specimen?.condition;
                const isBlocked = cond && cond !== "Adequate" && !order.sampleConditionOverride;

                if (isBlocked) {
                  return (
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                      <AlertOctagon className="h-3.5 w-3.5" /> Blocked — Non-adequate specimen (Requires Supervisor Override)
                    </div>
                  );
                }

                return (
                  <Link
                    to="/lab/processing"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TestTube2 className="h-3.5 w-3.5" /> Process at bench →
                  </Link>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Reception Verify Modal */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Specimen Reception Quality Verification</DialogTitle>
              <DialogDescription>
                Inspect tube integrity and volume before bench processing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Sample Condition</Label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mt-1 w-full h-8 px-2 border border-ink-200 bg-white rounded text-sm outline-none focus:border-teal"
                >
                  <option value="Adequate">Adequate (Clear/Normal)</option>
                  <option value="Hemolyzed">Hemolyzed (Rejection)</option>
                  <option value="Lipemic">Lipemic (Warning)</option>
                  <option value="Clotted">Clotted (Rejection)</option>
                  <option value="Insufficient volume">Insufficient Volume (Rejection)</option>
                </select>
              </div>

              <div>
                <Label>Verification Comment</Label>
                <input
                  placeholder="e.g. Volume checked, label matched."
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  className="mt-1 w-full h-8 px-2 border border-ink-200 bg-white rounded text-sm outline-none focus:border-teal"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setVerifyOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-teal text-white hover:bg-teal/90">
                Record Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Specimen Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink-900 font-heading">
              <Boxes className="h-5 w-5 text-teal" /> Specimen Lifecycle Details
            </DialogTitle>
            <DialogDescription>
              Chain of custody audit trail, collection log, and storage configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-sm text-ink-700">
            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Accession ID</span>
                <span className="font-mono font-semibold text-ink-900">{order.accession}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Test Parameter</span>
                <span className="font-semibold text-ink-900">{order.test_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Patient Name</span>
                <span>{p?.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Patient MRN</span>
                <span className="font-mono">{p?.mrn || "N/A"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Tube Type & Cap</span>
                <span className="capitalize">{spec.tube} ({tube.cap.replace("bg-", "")})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Volume & Condition</span>
                <span>{spec.volume_ml} mL · <span className="font-bold">{isReceived ? "Checked in" : spec.condition}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Storage Coordinates</span>
                <span className="font-mono">Rack {spec.storage_rack}, Slot {spec.storage_slot}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Required Temp</span>
                <span>{spec.temp}</span>
              </div>
            </div>

            {order.chainOfCustody && order.chainOfCustody.length > 0 ? (
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block mb-2">Chain of Custody History</span>
                <div className="space-y-3 pl-3 border-l-2 border-sage-soft">
                  {order.chainOfCustody.map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full border bg-white border-teal" />
                      <div className="font-semibold capitalize text-ink-900">{step.step.replace(/_/g, " ")}</div>
                      <div className="text-ink-500">{step.location} · {step.performedBy}</div>
                      <div className="text-[10px] text-ink-400">{new Date(step.performedAt).toLocaleString()}</div>
                      {step.notes && <div className="text-[11px] text-ink-600 bg-stone-50 p-1.5 rounded mt-1">{step.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-stone-50 rounded-lg text-center text-xs text-ink-400 italic">
                No chain of custody events recorded.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)} className="bg-teal text-white hover:bg-teal/90">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
