import { useState, useMemo } from "react";
import { useLabStore, formatRelative, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Printer, CheckCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { LabShiftReport } from "@/lib/lab-desk/store";

interface ShiftReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShiftReportModal({ open, onOpenChange }: ShiftReportModalProps) {
  const { orders, patients, qcRuns, criticalNotifications, reagents, qcLocks, staff, findCatalog, saveShiftReport } = useLabStore();
  const { name, isSupervisor } = useLabAuth();

  const [shift, setShift] = useState<"morning" | "afternoon" | "night">("morning");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [supervisorCoSign, setSupervisorCoSign] = useState("");

  const metrics = useMemo(() => {
    // 1. Throughput
    const shiftOrders = orders.filter((o) => {
      const hours = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
      return hours <= 12; // approximate shift duration
    });
    const received = shiftOrders.length;
    const stat = shiftOrders.filter((o) => o.priority === "stat").length;
    const urgent = shiftOrders.filter((o) => o.priority === "urgent").length;
    const routine = shiftOrders.filter((o) => o.priority === "routine").length;
    const completed = shiftOrders.filter((o) => o.status === "validated").length;
    const pending = shiftOrders.filter((o) => o.status !== "validated" && o.status !== "cancelled").length;

    // Dynamic TAT Rate calculation
    const completedWithTat = shiftOrders.filter((o) => o.status === "validated");
    const onTime = completedWithTat.filter((o) => {
      const cat = findCatalog(o.test_code);
      if (!cat || !o.validated_at) return true;
      const elapsed = (new Date(o.validated_at).getTime() - new Date(o.ordered_at).getTime()) / 3_600_000;
      return elapsed <= cat.tat_hours;
    });
    const tatComplianceRate = completedWithTat.length > 0
      ? Math.round((onTime.length / completedWithTat.length) * 100)
      : 100;

    // 2. Quality
    const recentQc = qcRuns.filter((q) => {
      const hours = (Date.now() - new Date(q.date).getTime()) / 3_600_000;
      return hours <= 12;
    });
    const qcPass = recentQc.filter((q) => q.status === "pass").length;
    const qcWarning = recentQc.filter((q) => q.status === "warning").length;
    const qcFail = recentQc.filter((q) => q.status === "fail").length;

    const criticalAlertsCount = criticalNotifications.filter((n) => {
      const hours = (Date.now() - new Date(n.notifiedAt).getTime()) / 3_600_000;
      return hours <= 12;
    }).length;

    const shiftCriticalsList = criticalNotifications
      .filter((n) => {
        const hours = (Date.now() - new Date(n.notifiedAt).getTime()) / 3_600_000;
        return hours <= 12;
      })
      .map((n) => {
        const p = getPatient({ patient_id: n.patientId } as any, patients);
        return {
          patientName: p?.name || "Unknown Patient",
          notifiedPerson: n.notifiedPerson,
          method: n.method,
          parameters: n.parameters.map((pr) => `${pr.parameterName}: ${pr.value} ${pr.unit}`).join(", "),
          status: n.status
        };
      });

    // 3. Integrity & Rejections
    const rejectedCollection = orders.filter((o) =>
      o.history.some((h) => h.action === "Rejected at collection")
    ).length;
    const rejectedReception = orders.filter((o) =>
      o.history.some((h) => h.action.includes("Sample Accepted -") && !h.action.includes("Adequate"))
    ).length;
    const storedCount = orders.filter((o) => o.sampleStorage !== undefined).length;

    const shiftRejectionsList: Array<{ orderId: string; patientName: string; test: string; reason: string }> = [];
    orders.forEach((o) => {
      o.history.forEach((h) => {
        const hours = (Date.now() - new Date(h.timestamp).getTime()) / 3_600_000;
        if (hours <= 12 && (h.action.includes("Rejected") || h.action.includes("Cancel") || h.action.includes("Reject"))) {
          const p = getPatient(o, patients);
          if (!shiftRejectionsList.some((r) => r.orderId === o.id)) {
            shiftRejectionsList.push({
              orderId: o.id,
              patientName: p?.name || "Unknown Patient",
              test: o.test_code,
              reason: h.comment || "No reason recorded"
            });
          }
        }
      });
    });

    // 4. Reagents
    const lowOrExpiredCount = reagents.filter((r) => {
      const isExpired = new Date(r.expiryDate).getTime() < Date.now();
      const isLow = r.testsRemaining / r.maxTests < 0.2;
      return isExpired || isLow;
    }).length;

    const shiftReagentIssuesList = reagents
      .filter((r) => {
        const isExpired = new Date(r.expiryDate).getTime() < Date.now();
        const isLow = r.testsRemaining / r.maxTests < 0.2;
        return isExpired || isLow;
      })
      .map((r) => {
        const isExpired = new Date(r.expiryDate).getTime() < Date.now();
        return {
          name: r.name,
          lot: r.lotNumber,
          issue: isExpired ? "Expired" : "Low Stock (< 20%)",
          remaining: r.testsRemaining
        };
      });

    return {
      throughput: { received, stat, urgent, routine, completed, pending, tatComplianceRate },
      quality: { qcPass, qcWarning, qcFail, criticalAlertsCount, deltaFailuresCount: 0, criticals: shiftCriticalsList },
      integrity: { rejectedCollection, rejectedReception, storedCount, rejections: shiftRejectionsList },
      reagents: { lowOrExpiredCount, blockedTestsCount: qcLocks.length, reagentIssues: shiftReagentIssuesList },
    };
  }, [orders, qcRuns, criticalNotifications, reagents, qcLocks, patients]);

  const handleSignOff = () => {
    if (!supervisorCoSign) {
      toast.error("Supervisor co-sign signature selection is required to lock shift.");
      return;
    }

    const report: LabShiftReport = {
      id: `REP-SHIFT-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      shift,
      technicianName: isSupervisor ? "J. Mensah" : name, // tech who saves or current
      supervisorName: supervisorCoSign,
      handoverNotes,
      throughput: metrics.throughput,
      quality: metrics.quality,
      integrity: metrics.integrity,
      reagents: metrics.reagents,
      status: isSupervisor ? "signed" : "draft",
      signedAt: isSupervisor ? new Date().toISOString() : undefined,
    };

    saveShiftReport(report);
    toast.success(isSupervisor ? "Shift report signed off successfully" : "Shift handover saved as draft");
    onOpenChange(false);
  };

  const handlePrint = () => {
    const criticalRows = metrics.quality.criticals.length > 0
      ? metrics.quality.criticals.map(c => `<div class="row"><span>Patient: ${c.patientName} (${c.parameters})</span><span>Notified: ${c.notifiedPerson} [${c.status}]</span></div>`).join("")
      : "<div>No critical alerts reported.</div>";

    const rejectionRows = metrics.integrity.rejections.length > 0
      ? metrics.integrity.rejections.map(r => `<div class="row"><span>ID: ${r.orderId} - Patient: ${r.patientName} (${r.test})</span><span>Reason: ${r.reason}</span></div>`).join("")
      : "<div>No sample or order rejections recorded.</div>";

    const reagentRows = metrics.reagents.reagentIssues.length > 0
      ? metrics.reagents.reagentIssues.map(rg => `<div class="row"><span>Reagent: ${rg.name} (Lot: ${rg.lot})</span><span>Issue: ${rg.issue} (${rg.remaining} tests left)</span></div>`).join("")
      : "<div>No reagent stock or expiry issues reported.</div>";

    const html = `<html><head><title>Lab Shift Handover Report</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 2rem; color: #1c1c1c; }
        .header { border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
        h2 { margin: 1.5rem 0 0.5rem; font-size: 14px; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 3px; }
        .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
        .bold { font-weight: bold; }
        .footer { margin-top: 3rem; border-top: 1px solid #000; padding-top: 1rem; font-size: 11px; }
      </style></head>
      <body>
        <div class="header">
          <h1>MAPLE HOSPITAL LABORATORY</h1>
          <div class="row"><span>Report Type:</span><span class="bold">SHIFT HANDOVER SUMMARY</span></div>
          <div class="row"><span>Shift Date:</span><span>${new Date().toLocaleDateString()}</span></div>
          <div class="row"><span>Shift Cycle:</span><span class="bold">${shift.toUpperCase()}</span></div>
        </div>

        <h2>I. Throughput Summary</h2>
        <div class="row"><span>Total Orders Received:</span><span>${metrics.throughput.received}</span></div>
        <div class="row"><span>STAT Orders Drawn:</span><span>${metrics.throughput.stat}</span></div>
        <div class="row"><span>Urgent Orders:</span><span>${metrics.throughput.urgent}</span></div>
        <div class="row"><span>Routine Orders:</span><span>${metrics.throughput.routine}</span></div>
        <div class="row"><span>Successfully Released:</span><span>${metrics.throughput.completed}</span></div>
        <div class="row"><span>TAT Compliance Rate:</span><span class="bold">${metrics.throughput.tatComplianceRate}%</span></div>

        <h2>II. Quality Control Metrics</h2>
        <div class="row"><span>QC Runs Passed:</span><span>${metrics.quality.qcPass}</span></div>
        <div class="row"><span>QC Run Warnings:</span><span>${metrics.quality.qcWarning}</span></div>
        <div class="row"><span>QC Violations/Failures:</span><span>${metrics.quality.qcFail}</span></div>
        <div class="row"><span>Critical Alerts Dispatched:</span><span>${metrics.quality.criticalAlertsCount}</span></div>

        <h2>III. Critical Values List (Shift)</h2>
        ${criticalRows}

        <h2>IV. Specimen Integrity & Rejections</h2>
        <div class="row"><span>Rejected at Collection:</span><span>${metrics.integrity.rejectedCollection}</span></div>
        <div class="row"><span>Rejected at Reception:</span><span>${metrics.integrity.rejectedReception}</span></div>
        <div class="row"><span>Active Bio-Storage Retained:</span><span>${metrics.integrity.storedCount}</span></div>
        <div class="bold" style="margin-top: 8px;">Rejection Details:</div>
        ${rejectionRows}

        <h2>V. Reagent Issues</h2>
        <div class="row"><span>Low or Expired Reagents Count:</span><span>${metrics.reagents.lowOrExpiredCount}</span></div>
        <div class="row"><span>Analyzer Lockouts active:</span><span>${metrics.reagents.blockedTestsCount}</span></div>
        <div class="bold" style="margin-top: 8px;">Reagent Warnings:</div>
        ${reagentRows}

        <h2>VI. Signatures and Handover</h2>
        <div class="row"><span>Reporting Operator:</span><span>${isSupervisor ? "J. Mensah" : name}</span></div>
        <div class="row"><span>Supervisor Co-Sign:</span><span class="bold">${supervisorCoSign}</span></div>
        <div class="row"><span>Handover Notes:</span><span>${handoverNotes || "None recorded."}</span></div>

        <div class="footer">
          Printed on ${new Date().toLocaleString()} · System Verified Audit Trail Log
        </div>
        <script>window.print();</script>
      </body></html>`;

    const w = window.open("", "_blank", "width=600,height=800");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-sage" /> Lab Shift Handover Sign-off
          </DialogTitle>
          <DialogDescription>
            Verify shift statistics, QC counts, and reagent levels before signature lock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-2 text-sm">
          {/* Shift Cycle Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Active Shift</Label>
              <Select value={shift} onValueChange={(val: any) => setShift(val)}>
                <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Shift (06:00 - 14:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon Shift (14:00 - 22:00)</SelectItem>
                  <SelectItem value="night">Night Shift (22:00 - 06:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shift Date</Label>
              <Input value={new Date().toLocaleDateString()} disabled className="mt-1 bg-stone-50 border-ink-200" />
            </div>
          </div>

          {/* Section A: Throughput */}
          <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50">
            <h3 className="font-heading font-semibold text-ink-900 border-b pb-1 mb-2 text-xs uppercase tracking-wider text-ink-400">
              Throughput Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] text-ink-400 uppercase">Received</div>
                <div className="font-mono text-lg font-bold">{metrics.throughput.received}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-400 uppercase">STAT / Urgent</div>
                <div className="font-mono text-lg font-bold text-red-600">
                  {metrics.throughput.stat} / {metrics.throughput.urgent}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-ink-400 uppercase">Completed</div>
                <div className="font-mono text-lg font-bold text-green-600">{metrics.throughput.completed}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-400 uppercase">TAT Compliance</div>
                <div className="font-mono text-lg font-bold text-sage">{metrics.throughput.tatComplianceRate}%</div>
              </div>
            </div>
          </div>

          {/* Section B: Quality and Integrity */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-stone-200 rounded-lg p-4">
              <h3 className="font-heading font-semibold text-ink-900 border-b pb-1 mb-2 text-xs uppercase tracking-wider text-ink-400">
                Quality &amp; Controls
              </h3>
              <ul className="space-y-1.5 text-xs text-ink-600">
                <li className="flex justify-between"><span>QC Runs Passed / Warn:</span><span className="font-semibold text-ink-900">{metrics.quality.qcPass} / {metrics.quality.qcWarning}</span></li>
                <li className="flex justify-between"><span>QC Failures / Locks:</span><span className="font-semibold text-red-600">{metrics.quality.qcFail} / {metrics.reagents.blockedTestsCount}</span></li>
                <li className="flex justify-between"><span>Critical Alerts Released:</span><span className="font-semibold text-ink-900">{metrics.quality.criticalAlertsCount}</span></li>
              </ul>
            </div>
            <div className="border border-stone-200 rounded-lg p-4">
              <h3 className="font-heading font-semibold text-ink-900 border-b pb-1 mb-2 text-xs uppercase tracking-wider text-ink-400">
                Specimen Integrity
              </h3>
              <ul className="space-y-1.5 text-xs text-ink-600">
                <li className="flex justify-between"><span>Rejected at Collection:</span><span className="font-semibold text-ink-900">{metrics.integrity.rejectedCollection}</span></li>
                <li className="flex justify-between"><span>Rejected at Reception:</span><span className="font-semibold text-ink-900">{metrics.integrity.rejectedReception}</span></li>
                <li className="flex justify-between"><span>Specimens in Bio-Storage:</span><span className="font-semibold text-ink-900">{metrics.integrity.storedCount}</span></li>
              </ul>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="space-y-4 border border-stone-200 rounded-lg p-4 bg-stone-50/30">
            <div>
              <h4 className="font-semibold text-xs text-ink-700 uppercase mb-1">Critical Values logged ({metrics.quality.criticals.length})</h4>
              {metrics.quality.criticals.length === 0 ? (
                <div className="text-xs text-ink-400 italic">No critical values logged.</div>
              ) : (
                <div className="max-h-20 overflow-y-auto space-y-1 divide-y divide-stone-100">
                  {metrics.quality.criticals.map((c, idx) => (
                    <div key={idx} className="text-xs py-1 text-ink-600">
                      <strong>{c.patientName}</strong>: {c.parameters} · <span className="text-[10px] text-ink-400">Notified {c.notifiedPerson} ({c.status})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-xs text-ink-700 uppercase mb-1">Rejected Sample Reasons ({metrics.integrity.rejections.length})</h4>
              {metrics.integrity.rejections.length === 0 ? (
                <div className="text-xs text-ink-400 italic">No rejections logged.</div>
              ) : (
                <div className="max-h-20 overflow-y-auto space-y-1 divide-y divide-stone-100">
                  {metrics.integrity.rejections.map((r, idx) => (
                    <div key={idx} className="text-xs py-1 text-ink-600">
                      <strong>Order {r.orderId}</strong> ({r.patientName}): <span className="text-red-700 font-medium">{r.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-xs text-ink-700 uppercase mb-1">Reagent Warnings / Issues ({metrics.reagents.reagentIssues.length})</h4>
              {metrics.reagents.reagentIssues.length === 0 ? (
                <div className="text-xs text-ink-400 italic">No reagent warnings.</div>
              ) : (
                <div className="max-h-20 overflow-y-auto space-y-1 divide-y divide-stone-100">
                  {metrics.reagents.reagentIssues.map((rg, idx) => (
                    <div key={idx} className="text-xs py-1 text-ink-600">
                      <strong>{rg.name}</strong> (Lot {rg.lot}): <span className="text-amber-700">{rg.issue}</span> · {rg.remaining} remaining
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Handover & Notes */}
          <div className="space-y-2">
            <Label>Handover / Notes</Label>
            <textarea
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Sysmex analyzer calibrated at 10am; Freezer B rack 3 storage updated; Awaiting urgent lipid profile validations..."
              className="w-full h-20 p-2 border border-ink-200 rounded text-sm bg-white outline-none focus:border-sage"
            />
          </div>

          {/* Sign-off */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <Label>Reporting Person</Label>
              <Input value={isSupervisor ? "J. Mensah" : name} disabled className="mt-1 bg-stone-50 border-ink-200" />
            </div>
            <div>
              <Label className="flex justify-between">
                <span>Supervisor Signature / Co-sign</span>
                <span className="text-red-600 font-bold">*</span>
              </Label>
              <Select value={supervisorCoSign} onValueChange={setSupervisorCoSign}>
                <SelectTrigger className="w-full bg-white border-ink-200 mt-1">
                  <SelectValue placeholder={isSupervisor ? "Select your signature" : "Select Supervisor"} />
                </SelectTrigger>
                <SelectContent>
                  {staff
                    .filter((s) => s.role === "lab_supervisor")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex gap-2">
          <Button variant="outline" className="border-ink-200" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Report
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSignOff} className="btn-primary">
              <CheckCircle className="h-4 w-4 mr-1" /> {isSupervisor ? "Sign & Close Shift" : "Save Handover"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
