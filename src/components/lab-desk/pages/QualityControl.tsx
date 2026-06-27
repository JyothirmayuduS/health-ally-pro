import { useMemo, useState } from "react";
import { useLabStore } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
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
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Dot,
} from "recharts";
import {
  Activity,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QCRun } from "@/lib/lab-desk/qcData";

export default function QualityControl() {
  const { qcRuns, catalog, qcLocks, logQCRun, logQCCorrectiveAction } = useLabStore();
  const { name } = useLabAuth();

  const [activeTab, setActiveTab] = useState<"runs" | "charts">("runs");
  const [selectedAnalyte, setSelectedAnalyte] = useState<string>("glu");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<QCRun | null>(null);
  const [correctiveActionText, setCorrectiveActionText] = useState("");

  // Form State
  const [formAnalyte, setFormAnalyte] = useState("glu");
  const [formLot, setFormLot] = useState("LOT-GLU-A5");
  const [formLevel, setFormLevel] = useState<"Level 1" | "Level 2" | "Level 3">("Level 2");
  const [formShift, setFormShift] = useState<"morning" | "afternoon" | "night">("morning");
  const [formValue, setFormValue] = useState("");
  const [formMean, setFormMean] = useState("100");
  const [formSD, setFormSD] = useState("5");

  const analytesList = useMemo(() => {
    return [
      { code: "glu", name: "Glucose", defaultMean: 100, defaultSD: 5, defaultLot: "LOT-GLU-A5" },
      { code: "hb", name: "Hemoglobin", defaultMean: 12.0, defaultSD: 0.4, defaultLot: "LOT-HEM-H2" },
    ];
  }, []);

  const handleAnalyteChange = (code: string) => {
    setFormAnalyte(code);
    const found = analytesList.find((a) => a.code === code);
    if (found) {
      setFormMean(String(found.defaultMean));
      setFormSD(String(found.defaultSD));
      setFormLot(found.defaultLot);
    }
  };

  const handleSaveQC = (e: React.FormEvent) => {
    e.preventDefault();
    const analyteObj = analytesList.find((a) => a.code === formAnalyte);
    logQCRun({
      shift: formShift,
      analyte: formAnalyte,
      analyteName: analyteObj?.name || formAnalyte,
      lotNumber: formLot,
      level: formLevel,
      value: Number(formValue),
      mean: Number(formMean),
      sd: Number(formSD),
      runBy: name,
    });
    setFormValue("");
    setModalOpen(false);
  };

  const handleCorrectiveActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRun) {
      logQCCorrectiveAction(selectedRun.id, correctiveActionText);
      setCorrectiveActionText("");
      setActionModalOpen(false);
      setSelectedRun(null);
    }
  };

  // Filter QC Runs for the Levey-Jennings Chart
  const chartData = useMemo(() => {
    return qcRuns
      .filter((r) => r.analyte === selectedAnalyte)
      .slice(0, 30)
      .reverse() // Chronological order
      .map((r, index) => {
        const diff = r.value - r.mean;
        const sdUnits = diff / r.sd;
        let pointColor = "#10b981"; // green
        if (Math.abs(sdUnits) >= 3.0) pointColor = "#ef4444"; // red
        else if (Math.abs(sdUnits) >= 2.0) pointColor = "#f59e0b"; // amber

        return {
          name: `${new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric" })} (${r.shift[0].toUpperCase()})`,
          value: r.value,
          mean: r.mean,
          plus1SD: r.mean + r.sd,
          plus2SD: r.mean + r.sd * 2,
          plus3SD: r.mean + r.sd * 3,
          minus1SD: r.mean - r.sd,
          minus2SD: r.mean - r.sd * 2,
          minus3SD: r.mean - r.sd * 3,
          pointColor,
          runId: r.id,
        };
      });
  }, [qcRuns, selectedAnalyte]);

  // Current Analyte Stats for chart boundaries
  const currentTarget = useMemo(() => {
    const found = analytesList.find((a) => a.code === selectedAnalyte);
    return found || { defaultMean: 100, defaultSD: 5 };
  }, [selectedAnalyte, analytesList]);

  return (
    <div className="space-y-6" data-testid="qc-page">
      <SectionLabel
        action={
          <div className="flex gap-2">
            <Button className="btn-primary !h-8 !px-3 !text-[12px]" onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Log QC Run
            </Button>
          </div>
        }
      >
        Quality control
      </SectionLabel>

      {/* Tabs */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-sm">
        {[
          { value: "runs", label: "QC Runs Log" },
          { value: "charts", label: "Levey-Jennings Charts" },
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

      {qcLocks.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-[13px] text-red-800 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5 animate-pulse" />
          <div>
            <strong>QC FAILURE LOCK IN PLACE:</strong> Releases are blocked for patient results matching:{" "}
            <span className="font-mono font-bold">{qcLocks.map((l) => l.toUpperCase()).join(", ")}</span>. Log corrective action on the failed run below to resume patient validations.
          </div>
        </div>
      )}

      {activeTab === "runs" ? (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Date / Shift</th>
                <th className="px-4 py-3 text-left">Analyte / Lot</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-left">Target (Mean ± SD)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Run By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {qcRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <EmptyState icon={Activity} title="No QC runs recorded" hint="Log a run to get started." />
                  </td>
                </tr>
              ) : (
                qcRuns.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-stone-100 text-[13px] hover:bg-stone-50/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRun(r);
                      setViewModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{new Date(r.date).toLocaleDateString()}</div>
                      <div className="text-[10px] capitalize text-ink-400">{r.shift} shift</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{r.analyteName}</div>
                      <div className="font-mono text-[10px] text-ink-400">{r.lotNumber}</div>
                    </td>
                    <td className="px-4 py-3">{r.level}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{r.value}</td>
                    <td className="px-4 py-3 text-ink-600 font-mono">
                      {r.mean} ± {r.sd * 2} (SD: {r.sd})
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          r.status === "pass"
                            ? "bg-green-100 text-green-800"
                            : r.status === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{r.runBy}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {r.status === "fail" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRun(r);
                            setActionModalOpen(true);
                          }}
                        >
                          <Wrench className="h-3 w-3 mr-1" /> Fix lock
                        </Button>
                      ) : r.correctiveAction ? (
                        <div className="text-[11px] text-stone-500 italic max-w-xs truncate" title={r.correctiveAction}>
                          Fixed: {r.correctiveAction}
                        </div>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Select Analyte:</Label>
            <Select value={selectedAnalyte} onValueChange={setSelectedAnalyte}>
              <SelectTrigger className="w-48 bg-white border-ink-200">
                <SelectValue placeholder="Select Analyte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glu">Glucose (Mean: 100)</SelectItem>
                <SelectItem value="hb">Hemoglobin (Mean: 12.0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="surface p-5 h-96">
            <h3 className="font-heading font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sage" /> Levey-Jennings Control Chart — {selectedAnalyte.toUpperCase()}
            </h3>
            {chartData.length === 0 ? (
              <p className="text-center text-ink-400 py-16">No QC data available for chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[
                      (dataMin) => Math.min(dataMin, currentTarget.defaultMean - currentTarget.defaultSD * 3.5),
                      (dataMax) => Math.max(dataMax, currentTarget.defaultMean + currentTarget.defaultSD * 3.5),
                    ]}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  {/* Westgard Limits lines */}
                  <ReferenceLine y={currentTarget.defaultMean} stroke="#6b7280" strokeWidth={1.5} label={{ value: "Mean", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean + currentTarget.defaultSD} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: "+1SD", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean - currentTarget.defaultSD} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: "-1SD", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean + currentTarget.defaultSD * 2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "+2SD (Warning)", position: "right", fill: "#d97706", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean - currentTarget.defaultSD * 2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "-2SD (Warning)", position: "right", fill: "#d97706", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean + currentTarget.defaultSD * 3} stroke="#ef4444" strokeWidth={1.5} label={{ value: "+3SD (Fail)", position: "right", fill: "#dc2626", fontSize: 10 }} />
                  <ReferenceLine y={currentTarget.defaultMean - currentTarget.defaultSD * 3} stroke="#ef4444" strokeWidth={1.5} label={{ value: "-3SD (Fail)", position: "right", fill: "#dc2626", fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3f6b58"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return <Dot cx={cx} cy={cy} r={5} fill={payload.pointColor} stroke="#fff" strokeWidth={1.5} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Log QC Run Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSaveQC} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Log Quality Control Run</DialogTitle>
              <DialogDescription>Run controls and log the values to verify calibration status.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Analyte</Label>
                <Select value={formAnalyte} onValueChange={handleAnalyteChange}>
                  <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                    <SelectValue placeholder="Select Analyte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glu">Glucose (Cobas C311)</SelectItem>
                    <SelectItem value="hb">Hemoglobin (Sysmex XN-550)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Control Lot</Label>
                  <Input value={formLot} onChange={(e) => setFormLot(e.target.value)} className="mt-1 border-ink-200 bg-white" required />
                </div>
                <div>
                  <Label>Control Level</Label>
                  <Select value={formLevel} onValueChange={(val: any) => setFormLevel(val)}>
                    <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1">Level 1 (Low)</SelectItem>
                      <SelectItem value="Level 2">Level 2 (Normal)</SelectItem>
                      <SelectItem value="Level 3">Level 3 (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Current Shift</Label>
                  <Select value={formShift} onValueChange={(val: any) => setFormShift(val)}>
                    <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                      <SelectValue placeholder="Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Measured Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="mt-1 border-ink-200 bg-white font-mono"
                    placeholder="Enter value"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
                <div>
                  <Label className="text-[10px]">Expected Mean</Label>
                  <Input value={formMean} onChange={(e) => setFormMean(e.target.value)} className="mt-1 h-7 border-ink-200 bg-white" required />
                </div>
                <div>
                  <Label className="text-[10px]">1 Standard Deviation (SD)</Label>
                  <Input value={formSD} onChange={(e) => setFormSD(e.target.value)} className="mt-1 h-7 border-ink-200 bg-white" required />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-primary">Save & Evaluate Rules</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Corrective Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleCorrectiveActionSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Log Corrective Action</DialogTitle>
              <DialogDescription>
                Corrective action is required to resolve failed QC runs and lift validation locks.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label>Description of action taken</Label>
              <textarea
                value={correctiveActionText}
                onChange={(e) => setCorrectiveActionText(e.target.value)}
                placeholder="e.g. Cleaned reagent lines, performed calibration, loaded fresh reagent lot..."
                className="w-full h-24 p-2 border border-ink-200 rounded text-sm bg-white outline-none focus:border-sage"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setActionModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Save & Unlock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View QC Run Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink-900 font-heading">
              <Activity className="h-5 w-5 text-sage" /> QC Run Details
            </DialogTitle>
            <DialogDescription>
              Evaluation parameters and Westgard validation checks.
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-4 my-2 text-sm text-ink-700">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Analyte / Instrument</span>
                  <span className="font-semibold text-ink-900">{selectedRun.analyteName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Lot Number</span>
                  <span className="font-mono text-ink-900">{selectedRun.lotNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Date & Shift</span>
                  <span>{new Date(selectedRun.date).toLocaleString()} ({selectedRun.shift})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Run By Operator</span>
                  <span>{selectedRun.runBy}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Measured vs Target Stats</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border">
                    <span className="block font-semibold text-[13px] font-mono text-ink-900">{selectedRun.value}</span>
                    <span className="text-[10px] text-ink-400">Observed</span>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <span className="block font-semibold text-[13px] font-mono text-ink-900">{selectedRun.mean}</span>
                    <span className="text-[10px] text-ink-400">Mean Target</span>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <span className="block font-semibold text-[13px] font-mono text-ink-900">± {selectedRun.sd}</span>
                    <span className="text-[10px] text-ink-400">Std Dev (SD)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-ink-400 block">Westgard Evaluation Status</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      selectedRun.status === "pass"
                        ? "bg-green-100 text-green-800"
                        : selectedRun.status === "warning"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {selectedRun.status}
                  </span>
                  <span className="text-xs text-ink-600">
                    {selectedRun.status === "pass"
                      ? "Control run is within acceptable calibration limits."
                      : selectedRun.status === "warning"
                      ? "Value exceeds ±2SD limit. Routine warning."
                      : "Control value is outside ±3SD limit. Analyte Locked!"}
                  </span>
                </div>
                {selectedRun.rulesTriggered && selectedRun.rulesTriggered.length > 0 && (
                  <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-100">
                    Violations: {selectedRun.rulesTriggered.join(", ")}
                  </div>
                )}
              </div>

              {selectedRun.correctiveAction && (
                <div className="p-3 bg-green-50/50 rounded-lg border border-green-200 text-xs text-green-900">
                  <strong>Corrective Action Logged:</strong>
                  <p className="mt-1 italic">{selectedRun.correctiveAction}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)} className="btn-primary">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
