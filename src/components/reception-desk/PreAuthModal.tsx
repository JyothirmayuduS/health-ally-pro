import React, { useState, useEffect, useMemo } from "react";
import { X, Shield, Search, Save, Send, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/reception-desk/store";
import { toast } from "sonner";

interface PreAuthModalProps {
  open: boolean;
  onClose: () => void;
  patientId?: string | null;
}

export default function PreAuthModal({ open, onClose, patientId }: PreAuthModalProps) {
  const { patients, addPreAuth } = useStore();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [q, setQ] = useState("");

  const [provider, setProvider] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [procedureType, setProcedureType] = useState("OPD Consultation");
  const [diagnosis, setDiagnosis] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    if (patientId) setSelectedPatientId(patientId);
    else setSelectedPatientId("");
  }, [patientId, open]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [selectedPatientId, patients],
  );

  useEffect(() => {
    if (selectedPatient) {
      setProvider(selectedPatient.insurance?.provider || "");
      setPolicyId(selectedPatient.insurance?.policyId || "");
    } else {
      setProvider("");
      setPolicyId("");
    }
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients.slice(0, 5);
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        (p.phone || "").includes(s),
    );
  }, [q, patients]);

  if (!open) return null;

  const handleSave = (status: "draft" | "submitted") => {
    if (!selectedPatientId) return toast.error("Please select a patient");
    if (!provider || !policyId) return toast.error("Provider and Policy ID are required");
    if (!procedureType) return toast.error("Service type is required");
    if (!diagnosis) return toast.error("Diagnosis is required");
    if (!estimatedCost || Number(estimatedCost) <= 0) return toast.error("Invalid estimated cost");

    const newPa = addPreAuth({
      patientId: selectedPatientId,
      provider,
      policyId,
      procedureType,
      diagnosis,
      estimatedCost: Number(estimatedCost),
      notes,
      documentName: documentName || undefined,
      status,
      submittedAt: status === "submitted" ? new Date().toISOString() : undefined,
    });

    toast.success(
      status === "submitted"
        ? `Pre-auth ${newPa.id} submitted successfully!`
        : `Pre-auth ${newPa.id} saved as draft.`,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 grid place-items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-ink-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sage-soft text-sage grid place-items-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-ink-400">Insurance Desk</div>
              <h3 className="text-[15px] font-heading font-semibold text-ink-900">New Pre-Auth Request</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!selectedPatientId ? (
          /* ── Step 1: Patient picker ── */
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <p className="text-[12.5px] text-ink-500">Search by patient name, MRN, or phone.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
                <input
                  type="text"
                  placeholder="Name, MRN, or phone…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-[13px] border border-ink-200 rounded-xl focus:outline-none focus:border-sage bg-white"
                  autoFocus
                />
              </div>
              <div className="border border-ink-200 rounded-xl divide-y divide-ink-100 overflow-hidden">
                {filteredPatients.map((p) => {
                  const initials = p.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-bone/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sage-soft text-sage flex items-center justify-center text-[12px] font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-ink-900 group-hover:text-sage transition-colors">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-ink-400 font-mono">{p.id} · {p.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.insurance?.provider ? (
                          <span className="chip-teal text-[10.5px]">{p.insurance.provider}</span>
                        ) : (
                          <span className="text-[10.5px] text-ink-400 italic">No insurance</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-ink-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <div className="p-6 text-center text-[12.5px] text-ink-400">No patients match.</div>
                )}
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-ink-200 flex justify-end shrink-0">
              <button type="button" onClick={onClose} className="h-9 px-4 text-[12.5px] text-ink-600 hover:bg-ink-100 rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </>
        ) : (
          /* ── Step 2: Form ── */
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Patient banner */}
              <div className="rounded-xl border border-ink-200 bg-bone/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sage text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    {selectedPatient?.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{selectedPatient?.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{selectedPatient?.id} · {selectedPatient?.phone}</div>
                  </div>
                </div>
                {!patientId && (
                  <button
                    type="button"
                    onClick={() => { setSelectedPatientId(""); setQ(""); }}
                    className="text-[11.5px] font-medium text-clay hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Provider + Policy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="preauth-provider" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Insurance Provider *</label>
                  <input id="preauth-provider" type="text" value={provider} onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage"
                    placeholder="e.g. Star Health" />
                </div>
                <div>
                  <label htmlFor="preauth-policy" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Policy / Member ID *</label>
                  <input id="preauth-policy" type="text" value={policyId} onChange={(e) => setPolicyId(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage"
                    placeholder="e.g. SH-12345" />
                </div>
              </div>

              {/* Procedure */}
              <div>
                <label htmlFor="preauth-service" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Service / Procedure Type *</label>
                <select id="preauth-service" value={procedureType} onChange={(e) => setProcedureType(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage">
                  <option>OPD Consultation</option>
                  <option>Inpatient Procedure</option>
                  <option>Diagnostic Scan</option>
                  <option>Daycare Surgery</option>
                </select>
              </div>

              {/* Diagnosis */}
              <div>
                <label htmlFor="preauth-diagnosis" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Diagnosis &amp; ICD-10 Code *</label>
                <input id="preauth-diagnosis" type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage"
                  placeholder="e.g. Chronic Kidney Disease (ICD N18.9)" />
              </div>

              {/* Cost */}
              <div>
                <label htmlFor="preauth-cost" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Estimated Cost (INR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-400 font-mono">₹</span>
                  <input id="preauth-cost" type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage"
                    placeholder="0" />
                </div>
              </div>

              {/* Document */}
              <div>
                <label htmlFor="preauth-doc" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Supporting Document (Filename)</label>
                <input id="preauth-doc" type="text" value={documentName} onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-sage"
                  placeholder="e.g. prescription_scan.pdf" />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="preauth-notes" className="text-[11.5px] font-semibold text-ink-700 block mb-1.5">Additional Notes</label>
                <textarea id="preauth-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-[13px] h-20 bg-white resize-none focus:outline-none focus:border-sage"
                  placeholder="Emergency notes, TPA details, past history…" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-ink-200 flex justify-end gap-2 shrink-0">
              <button type="button" onClick={onClose} className="h-9 px-4 text-[12.5px] text-ink-600 hover:bg-ink-100 rounded-lg transition font-medium">
                Cancel
              </button>
              <button type="button" onClick={() => handleSave("draft")} className="btn-outline flex items-center gap-1.5 h-9">
                <Save className="w-3.5 h-3.5" /> Save Draft
              </button>
              <button type="button" onClick={() => handleSave("submitted")} className="btn-primary flex items-center gap-1.5 h-9">
                <Send className="w-3.5 h-3.5" /> Submit Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
