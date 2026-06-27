import { useMemo, useState } from "react";
import { useLabStore, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import { SectionLabel, EmptyState } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Boxes,
  Database,
  Snowflake,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  Flame,
  Wrench,
  Edit2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Aliquot } from "@/lib/lab-desk/store";

export default function SampleStorage() {
  const {
    orders,
    patients,
    aliquots,
    storeSample,
    disposeSample,
    createAliquots,
  } = useLabStore();

  const [activeTab, setActiveTab] = useState<"storage" | "aliquots">("storage");

  // Aliquoting states
  const [aliquotModalOpen, setAliquotModalOpen] = useState(false);
  const [selectedParentOrder, setSelectedParentOrder] = useState<string>("");
  const [aliquotCount, setAliquotCount] = useState("2");
  const [aliquotVolume, setAliquotVolume] = useState("1.0");
  const [aliquotContainer, setAliquotContainer] = useState("Microcentrifuge tube");
  const [aliquotDest, setAliquotDest] = useState("Bench — Biochemistry");

  // Storage Location edits states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<string>("");
  const [editRack, setEditRack] = useState("");
  const [editBox, setEditBox] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<LabOrder | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const storedOrders = useMemo(() => {
    return orders.filter((o) => o.sampleStorage !== undefined);
  }, [orders]);

  const nonStoredOrders = useMemo(() => {
    return orders.filter((o) => o.collected_at !== null && o.sampleStorage === undefined);
  }, [orders]);

  const handleCreateAliquots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentOrder) return;
    const count = Number(aliquotCount);
    const list = Array.from({ length: count }).map(() => ({
      volume: Number(aliquotVolume),
      containerType: aliquotContainer,
      destination: aliquotDest,
    }));
    createAliquots(selectedParentOrder, list);
    setAliquotModalOpen(false);
  };

  const handleEditLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForEdit) return;
    // Set storage sample coordinates (defaults 5 days retention)
    storeSample(selectedOrderForEdit, editRack, editBox, editPosition, 5);
    setEditModalOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="storage-page">
      <div className="border-l-4 border-sky-500 bg-sky-50/40 px-4 py-3 text-[13px] text-ink-700">
        <strong className="text-sky-600">Bio-Repository Operations</strong> — Log specimen storage coordinates, track retention dates, and perform tube aliquoting.
      </div>

      <SectionLabel
        action={
          <div className="flex gap-2">
            <Button
              className="btn-outline !h-8 !px-3 !text-[12px]"
              onClick={() => {
                if (nonStoredOrders.length > 0) {
                  setSelectedOrderForEdit(nonStoredOrders[0].id);
                  setEditRack("A");
                  setEditBox("1");
                  setEditPosition("01");
                  setEditModalOpen(true);
                }
              }}
              disabled={nonStoredOrders.length === 0}
            >
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Store Sample
            </Button>
            <Button
              className="btn-primary !h-8 !px-3 !text-[12px]"
              onClick={() => {
                if (orders.length > 0) {
                  setSelectedParentOrder(orders[0].id);
                  setAliquotModalOpen(true);
                }
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Aliquots
            </Button>
          </div>
        }
      >
        Sample storage & aliquoting
      </SectionLabel>

      {/* Tabs */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-sm">
        {[
          { value: "storage", label: "Active Storage" },
          { value: "aliquots", label: "Aliquoting Log" },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActiveTab(t.value as any)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
              activeTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "storage" ? (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Accession / Patient</th>
                <th className="px-4 py-3 text-left">Sample Details</th>
                <th className="px-4 py-3 text-left">Storage Location</th>
                <th className="px-4 py-3 text-left">Retention Expiry</th>
                <th className="px-4 py-3 text-left">Stored By</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {storedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState icon={Database} title="No samples stored" hint="Move collected tubes to Freezer Storage." />
                  </td>
                </tr>
              ) : (
                storedOrders.map((o) => {
                  const p = getPatient(o, patients);
                  const storage = o.sampleStorage!;
                  const timeDiff = new Date(storage.retentionExpiry).getTime() - Date.now();
                  const hoursLeft = timeDiff / 3_600_000;

                  let dateColor = "text-green-600";
                  if (storage.status === "disposed") {
                    dateColor = "text-ink-300 line-through";
                  } else if (hoursLeft < 0) {
                    dateColor = "text-red-600 font-bold";
                  } else if (hoursLeft < 48) {
                    dateColor = "text-amber-600";
                  }

                  return (
                    <tr
                      key={o.id}
                      className={cn(
                        "border-b border-stone-100 text-[13px] hover:bg-stone-50/70 transition-colors cursor-pointer",
                        storage.status === "disposed" && "bg-stone-50/50"
                      )}
                      onClick={() => {
                        setSelectedOrderDetails(o);
                        setDetailModalOpen(true);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-ink-900">{o.accession}</div>
                        <div className="font-medium text-ink-600">{p?.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.test_code}</div>
                        <div className="text-[10px] text-ink-400">{o.specimen?.sample_type || "EDTA Tube"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {storage.status === "disposed" ? (
                          <span className="text-ink-400 line-through">Discarded</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Snowflake className="h-3.5 w-3.5 text-sky-500" />
                            Freezer A · R-{storage.rack} / B-{storage.box} / P-{storage.position}
                          </div>
                        )}
                      </td>
                      <td className={cn("px-4 py-3 font-mono", dateColor)}>
                        {storage.status === "disposed" ? (
                          <span>Disposed</span>
                        ) : (
                          <div>
                            {new Date(storage.retentionExpiry).toLocaleDateString()}{" "}
                            {new Date(storage.retentionExpiry).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {hoursLeft < 0 && <span className="text-[10px] block font-semibold">(Retention Expired)</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-ink-700">{storage.storedBy}</div>
                        <div className="text-[10px] text-ink-400">{new Date(storage.storedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            storage.status === "stored" ? "bg-sky-100 text-sky-800" : "bg-stone-200 text-stone-700"
                          )}
                        >
                          {storage.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {storage.status === "stored" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 !px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForEdit(o.id);
                                setEditRack(storage.rack);
                                setEditBox(storage.box);
                                setEditPosition(storage.position);
                                setEditModalOpen(true);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-red-200 text-red-600 hover:bg-red-50 !px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                disposeSample(o.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Disposed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Aliquot ID</th>
                <th className="px-4 py-3 text-left">Parent Accession</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-left">Container Type</th>
                <th className="px-4 py-3 text-left">Destination Workspace</th>
                <th className="px-4 py-3 text-left">Created Date</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {aliquots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState icon={Layers} title="No aliquots split" hint="Create aliquots from sample tubes." />
                  </td>
                </tr>
              ) : (
                aliquots.map((a) => (
                  <tr key={a.id} className="border-b border-stone-100 text-[13px]">
                    <td className="px-4 py-3 font-mono font-bold text-ink-950">{a.id}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{a.parentAccession}</td>
                    <td className="px-4 py-3 text-right font-mono">{a.volume.toFixed(1)} mL</td>
                    <td className="px-4 py-3">{a.containerType}</td>
                    <td className="px-4 py-3 text-ink-700">{a.destination}</td>
                    <td className="px-4 py-3 font-mono text-ink-500">
                      {new Date(a.createdAt).toLocaleDateString()}{" "}
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-teal-soft text-teal px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Storage Location coordinates Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-sm bg-white">
          <form onSubmit={handleEditLocation} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Assign Freezer Storage</DialogTitle>
              <DialogDescription>
                Assign rack, box, and position coordinates for sample storage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Select Order Accession</Label>
                <Select value={selectedOrderForEdit} onValueChange={setSelectedOrderForEdit}>
                  <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                    <SelectValue placeholder="Select Accession" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders
                      .filter((o) => o.collected_at !== null)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.accession} — {o.test_code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Rack</Label>
                  <Input value={editRack} onChange={(e) => setEditRack(e.target.value)} className="mt-1 border-ink-200 bg-white" placeholder="A" required />
                </div>
                <div>
                  <Label>Box</Label>
                  <Input value={editBox} onChange={(e) => setEditBox(e.target.value)} className="mt-1 border-ink-200 bg-white" placeholder="1" required />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="mt-1 border-ink-200 bg-white" placeholder="01" required />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-primary">Save Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Aliquot Modal */}
      <Dialog open={aliquotModalOpen} onOpenChange={setAliquotModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleCreateAliquots} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Sample Aliquots</DialogTitle>
              <DialogDescription>Split the primary collected specimen into children tubes.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Parent Sample Accession</Label>
                <Select value={selectedParentOrder} onValueChange={setSelectedParentOrder}>
                  <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                    <SelectValue placeholder="Select Parent Tube" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders
                      .filter((o) => o.collected_at !== null)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.accession} — {o.test_code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Number of Aliquots</Label>
                  <Input type="number" min="1" max="10" value={aliquotCount} onChange={(e) => setAliquotCount(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
                <div>
                  <Label>Volume per Aliquot (mL)</Label>
                  <Input type="number" step="0.1" min="0.1" value={aliquotVolume} onChange={(e) => setAliquotVolume(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Container Type</Label>
                  <Select value={aliquotContainer} onValueChange={setAliquotContainer}>
                    <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Microcentrifuge tube">Microcentrifuge Tube</SelectItem>
                      <SelectItem value="Cryovial">Cryovial</SelectItem>
                      <SelectItem value="EDTA tube">EDTA tube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination</Label>
                  <Select value={aliquotDest} onValueChange={setAliquotDest}>
                    <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                      <SelectValue placeholder="Select Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bench — Hematology">Bench — Hematology</SelectItem>
                      <SelectItem value="Bench — Biochemistry">Bench — Biochemistry</SelectItem>
                      <SelectItem value="Send-out lab">Send-out lab</SelectItem>
                      <SelectItem value="Archive">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAliquotModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-primary">Create Aliquots</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sample & Aliquot Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink-900 font-heading">
              <Boxes className="h-5 w-5 text-sky-500" /> Stored Specimen Details
            </DialogTitle>
            <DialogDescription>
              Bio-Repository coordinate tracking, temperature logs, and chain of custody.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderDetails && (
            <div className="space-y-4 my-2 text-sm text-ink-700">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Accession Number</span>
                  <span className="font-mono font-semibold text-ink-900">{selectedOrderDetails.accession}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Test Parameter</span>
                  <span className="font-semibold text-ink-900">{selectedOrderDetails.test_name} ({selectedOrderDetails.test_code.toUpperCase()})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Specimen Type</span>
                  <span>{selectedOrderDetails.specimen?.sample_type || "EDTA Blood Tube"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Patient Name</span>
                  <span>{getPatient(selectedOrderDetails, patients)?.name || "N/A"}</span>
                </div>
              </div>

              {selectedOrderDetails.sampleStorage && (
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">Freezer Coordinates</span>
                    <span className="font-mono">
                      Rack {selectedOrderDetails.sampleStorage.rack}, Box {selectedOrderDetails.sampleStorage.box}, Position {selectedOrderDetails.sampleStorage.position}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">Retention Expiry</span>
                    <span className="font-mono text-amber-700">
                      {new Date(selectedOrderDetails.sampleStorage.retentionExpiry).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-sky-700 block">Freezer Environment Status</span>
                <div className="flex items-center justify-between text-xs text-ink-800">
                  <span className="flex items-center gap-1"><Snowflake className="h-3.5 w-3.5 text-sky-500" /> Temperature:</span>
                  <span className="font-mono font-semibold">-81.3 °C (Optimal)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-800">
                  <span>Compressor Health:</span>
                  <span className="text-green-700 font-bold">100% (Normal)</span>
                </div>
              </div>

              {selectedOrderDetails.chainOfCustody && selectedOrderDetails.chainOfCustody.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block mb-2">Chain of Custody History</span>
                  <div className="space-y-3 pl-3 border-l-2 border-sage-soft">
                    {selectedOrderDetails.chainOfCustody.map((step, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full border bg-white border-sage" />
                        <div className="font-semibold capitalize text-ink-900">{step.step.replace(/_/g, " ")}</div>
                        <div className="text-ink-500">{step.location} · {step.performedBy}</div>
                        <div className="text-[10px] text-ink-400">{new Date(step.performedAt).toLocaleString()}</div>
                        {step.notes && <div className="text-[11px] text-ink-600 bg-stone-50 p-1.5 rounded mt-1">{step.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)} className="btn-primary">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
