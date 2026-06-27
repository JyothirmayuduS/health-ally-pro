import { useMemo, useState } from "react";
import { useLabStore } from "@/lib/lab-desk/store";
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
  Plus,
  Flame,
  AlertTriangle,
  Beaker,
  ShieldCheck,
  Calendar,
  Hourglass,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reagent } from "@/lib/reagentData";

export default function ReagentInventory() {
  const { reagents, addReagentLot } = useLabStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formInstrument, setFormInstrument] = useState("Sysmex XN-550");
  const [formLot, setFormLot] = useState("");
  const [formExpiry, setFormExpiry] = useState("");
  const [formMaxTests, setFormMaxTests] = useState("300");
  const [formStability, setFormStability] = useState("30");
  const [formTestCodes, setFormTestCodes] = useState("cbc");

  const stats = useMemo(() => {
    let lowCount = 0;
    let expiredCount = 0;

    reagents.forEach((r) => {
      const isExpired = new Date(r.expiryDate).getTime() < Date.now();
      const isLow = r.testsRemaining / r.maxTests < 0.2 && r.testsRemaining > 0;
      if (isExpired || r.testsRemaining <= 0) expiredCount++;
      else if (isLow) lowCount++;
    });

    return { lowCount, expiredCount, total: reagents.length };
  }, [reagents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReagentLot({
      name: formName,
      instrument: formInstrument,
      lotNumber: formLot,
      expiryDate: formExpiry,
      testsRemaining: Number(formMaxTests),
      maxTests: Number(formMaxTests),
      openedOn: new Date().toISOString().slice(0, 10),
      stabilityDays: Number(formStability),
      testCodes: formTestCodes.split(",").map((c) => c.trim().toLowerCase()),
    });
    setFormName("");
    setFormLot("");
    setFormExpiry("");
    setModalOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="reagents-page">
      <SectionLabel
        action={
          <Button className="btn-primary !h-8 !px-3 !text-[12px]" onClick={() => setModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Register Lot
          </Button>
        }
      >
        Reagent & consumable inventory
      </SectionLabel>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-teal-soft flex items-center justify-center rounded-lg">
            <Beaker className="h-5 w-5 text-teal" />
          </div>
          <div>
            <div className="font-mono text-xl font-bold text-ink-900">{stats.total}</div>
            <div className="text-[11px] text-ink-400">Total registered reagents</div>
          </div>
        </div>

        <div className="surface p-4 flex items-center gap-3">
          <div className={cn("h-10 w-10 flex items-center justify-center rounded-lg", stats.lowCount > 0 ? "bg-amber-100" : "bg-stone-50")}>
            <AlertTriangle className={cn("h-5 w-5", stats.lowCount > 0 ? "text-amber-600" : "text-ink-400")} />
          </div>
          <div>
            <div className="font-mono text-xl font-bold text-ink-900">{stats.lowCount}</div>
            <div className="text-[11px] text-ink-400">Low stock reagents (&lt; 20%)</div>
          </div>
        </div>

        <div className="surface p-4 flex items-center gap-3">
          <div className={cn("h-10 w-10 flex items-center justify-center rounded-lg", stats.expiredCount > 0 ? "bg-red-100" : "bg-stone-50")}>
            <Flame className={cn("h-5 w-5", stats.expiredCount > 0 ? "text-red-600 animate-pulse" : "text-ink-400")} />
          </div>
          <div>
            <div className="font-mono text-xl font-bold text-ink-900">{stats.expiredCount}</div>
            <div className="text-[11px] text-ink-400">Expired or out of stock</div>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 text-left">Reagent Name</th>
              <th className="px-4 py-3 text-left">Instrument</th>
              <th className="px-4 py-3 text-left">Lot Number</th>
              <th className="px-4 py-3 text-left">Expiration</th>
              <th className="px-4 py-3 text-right">Tests Left</th>
              <th className="px-4 py-3 text-left">Stability Period</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {reagents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8">
                  <EmptyState icon={Beaker} title="No reagents logged" hint="Register your first reagent lot." />
                </td>
              </tr>
            ) : (
              reagents.map((r) => {
                const isExpired = new Date(r.expiryDate).getTime() < Date.now();
                const isExpiringSoon = new Date(r.expiryDate).getTime() < Date.now() + 7 * 24 * 3600 * 1000 && !isExpired;
                const isLow = r.testsRemaining / r.maxTests < 0.2 && r.testsRemaining > 0;
                const isOutOfStock = r.testsRemaining <= 0;

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase">
                    OK
                  </span>
                );

                if (isExpired) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                      Expired
                    </span>
                  );
                } else if (isOutOfStock) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                      Out of stock
                    </span>
                  );
                } else if (isLow) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      Low
                    </span>
                  );
                }

                 return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-stone-100 text-[13px] hover:bg-stone-50/70 transition-colors cursor-pointer",
                      isExpired && "bg-red-50/10"
                    )}
                    onClick={() => {
                      setSelectedReagent(r);
                      setDetailModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{r.name}</div>
                      <div className="text-[10px] text-ink-400">Mapped tests: {r.testCodes.map((c) => c.toUpperCase()).join(", ")}</div>
                    </td>
                    <td className="px-4 py-3">{r.instrument}</td>
                    <td className="px-4 py-3 font-mono">{r.lotNumber}</td>
                    <td className="px-4 py-3">
                      <div className={cn("flex items-center gap-1.5", isExpired ? "text-red-600 font-bold" : isExpiringSoon ? "text-amber-600" : "text-ink-900")}>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {r.expiryDate}
                        {isExpiringSoon && <span className="text-[10px] font-semibold">(Expiring soon)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono font-semibold">
                        {r.testsRemaining} / {r.maxTests}
                      </div>
                      <div className="text-[10px] text-ink-400">{(r.testsRemaining / r.maxTests * 100).toFixed(0)}% remaining</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Hourglass className="h-3.5 w-3.5 text-stone-400" />
                        {r.stabilityDays ? `${r.stabilityDays} days stable` : "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lot Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Register Reagent Lot</DialogTitle>
              <DialogDescription>Add a new lot of reagent or consumable material to active stock.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Reagent Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Sysmex Lysercell WDF" className="mt-1 border-ink-200 bg-white" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Instrument</Label>
                  <Select value={formInstrument} onValueChange={setFormInstrument}>
                    <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                      <SelectValue placeholder="Instrument" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sysmex XN-550">Sysmex XN-550</SelectItem>
                      <SelectItem value="Cobas C311">Cobas C311</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lot Number</Label>
                  <Input value={formLot} onChange={(e) => setFormLot(e.target.value)} placeholder="e.g. LOT-WDF-12" className="mt-1 border-ink-200 bg-white" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiration Date</Label>
                  <Input type="date" value={formExpiry} onChange={(e) => setFormExpiry(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
                <div>
                  <Label>Max Test Count</Label>
                  <Input type="number" value={formMaxTests} onChange={(e) => setFormMaxTests(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stability Period (Days)</Label>
                  <Input type="number" value={formStability} onChange={(e) => setFormStability(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
                <div>
                  <Label>Mapped Test Codes (comma sep)</Label>
                  <Input value={formTestCodes} onChange={(e) => setFormTestCodes(e.target.value)} placeholder="e.g. cbc, hb" className="mt-1 border-ink-200 bg-white font-mono text-xs" required />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-primary">Register Lot</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Reagent Lot Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink-900 font-heading">
              <Beaker className="h-5 w-5 text-sage" /> Reagent Lot Details
            </DialogTitle>
            <DialogDescription>
              Inventory parameters, active stability, and remaining tests.
            </DialogDescription>
          </DialogHeader>

          {selectedReagent && (
            <div className="space-y-4 my-2 text-sm text-ink-700">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Reagent Name</span>
                  <span className="font-semibold text-ink-900">{selectedReagent.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Instrument</span>
                  <span>{selectedReagent.instrument}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Lot Number</span>
                  <span className="font-mono text-ink-900">{selectedReagent.lotNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Expiration Date</span>
                  <span className={cn(
                    "font-semibold",
                    new Date(selectedReagent.expiryDate).getTime() < Date.now() ? "text-red-600" : "text-ink-900"
                  )}>{selectedReagent.expiryDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Opened On</span>
                  <span>{selectedReagent.openedOn || "Not opened"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">On-Board Stability</span>
                  <span>{selectedReagent.stabilityDays ? `${selectedReagent.stabilityDays} days` : "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">Stock Level</span>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span>{selectedReagent.testsRemaining} / {selectedReagent.maxTests} tests remaining</span>
                  <span>{(selectedReagent.testsRemaining / selectedReagent.maxTests * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      (selectedReagent.testsRemaining / selectedReagent.maxTests) < 0.2
                        ? "bg-red-500"
                        : "bg-sage"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, (selectedReagent.testsRemaining / selectedReagent.maxTests * 100)))}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Mapped Test Codes</span>
                <div className="flex gap-1 mt-1">
                  {selectedReagent.testCodes.map((code) => (
                    <span key={code} className="bg-stone-100 border text-[10px] uppercase font-mono px-2 py-0.5 rounded text-ink-700">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border text-xs">
                <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">Simulated Consumption Log</span>
                <div className="space-y-1 font-mono text-[11px] text-ink-600">
                  <div>· Depleted 1 test (Operator: Tech-1) · Just now</div>
                  <div>· Depleted 1 test (Operator: Tech-1) · 2 hours ago</div>
                  <div>· Depleted 1 test (Operator: Tech-2) · 4 hours ago</div>
                </div>
              </div>
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
