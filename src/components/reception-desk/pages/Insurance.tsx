import React, { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { CLAIM_STATUSES, STATUS_META } from "@/lib/reception-desk/opsData";
import { toast } from "sonner";
import { Route } from "@/routes/reception.insurance";
import {
  Search,
  ShieldCheck,
  Paperclip,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  IndianRupee,
  Stethoscope,
  Calendar,
  Shield,
  Clock,
  Check,
  Plus,
  FileText,
  Hospital,
  ArrowLeft,
  Save,
  ChevronRight,
  User,
  Filter,
} from "lucide-react";

const fmt = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ─── Status meta ──────────────────────────────────────────────────── */
const CLAIM_DOT: Record<string, string> = {
  pending: "dot-mustard",
  submitted: "dot-teal",
  approved: "dot-money",
  partial: "dot-plum",
  rejected: "dot-clay",
  "not-required": "w-1.5 h-1.5 rounded-full bg-ink-300 inline-block",
};
const PA_DOT: Record<string, string> = {
  draft: "w-1.5 h-1.5 rounded-full bg-ink-300 inline-block",
  submitted: "dot-teal",
  approved: "dot-money",
  rejected: "dot-clay",
  expired: "dot-clay",
};
const PA_META: Record<string, { label: string; chip: string }> = {
  draft: { label: "Draft", chip: "chip-ink" },
  submitted: { label: "Submitted", chip: "chip-teal" },
  approved: { label: "Approved", chip: "chip-money" },
  rejected: { label: "Rejected", chip: "chip-clay" },
  expired: { label: "Expired", chip: "chip-clay" },
};

/* ─── Step flow ─────────────────────────────────────────────────────── */
function StepFlow({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-1.5 px-3.5 h-7 rounded-full text-[11px] font-mono font-medium uppercase tracking-wide ${
              done || active ? "bg-sage text-white" : "bg-ink-100 text-ink-400"
            }`}>
              {done && <CheckCircle2 className="w-3 h-3" />}
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-10 shrink-0 ${i < current ? "bg-sage" : "bg-ink-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Field row (flat) ──────────────────────────────────────────────── */
function Field({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 py-2.5 border-b border-ink-100 last:border-0">
      <span className="w-36 shrink-0 text-[11.5px] text-ink-400">{label}</span>
      <span className={`flex-1 text-[13px] text-ink-900 ${mono ? "font-mono" : "font-medium"} leading-snug`}>
        {children}
      </span>
    </div>
  );
}

/* ─── Section head ──────────────────────────────────────────────────── */
function SectionHead({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.15em] text-ink-400 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {action}
    </div>
  );
}

/* ─── Form label + input ─────────────────────────────────────────────── */
function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-ink-100 last:border-0">
      <label className="w-44 shrink-0 text-[12px] text-ink-500 pt-2.5 leading-tight">
        {label}{required && <span className="text-clay ml-0.5">*</span>}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls = "w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors";
const selectCls = "w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors";

/* ══════════════════════════════════════════════════════════════════════ */
export default function Insurance() {
  const { claims, patients, doctors, updateClaim, preAuths, updatePreAuth, convertPreAuthToClaim, addPreAuth } = useStore();

  const [activeTab, setActiveTab] = useState<"claims" | "preauths">("claims");
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [selectedClaimId, setSelectedClaimId] = useState(claims[0]?.id || "");
  const [selectedPAId, setSelectedPAId] = useState(preAuths[0]?.id || "");
  const [approvedInput, setApprovedInput] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showPopover, setShowPopover] = useState(false);

  const [tempFilter, setTempFilter] = useState("All");
  const [tempSortBy, setTempSortBy] = useState<"date" | "name" | "amount">("date");
  const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc">("desc");

  /* ── New pre-auth inline panel state ── */
  const [showNewForm, setShowNewForm] = useState(false);
  const [formStep, setFormStep] = useState<"patient" | "form">("patient");
  const [patientQ, setPatientQ] = useState("");
  const [formPatientId, setFormPatientId] = useState("");
  const [fProvider, setFProvider] = useState("");
  const [fPolicy, setFPolicy] = useState("");
  const [fProcedure, setFProcedure] = useState("OPD Consultation");
  const [fDiagnosis, setFDiagnosis] = useState("");
  const [fCost, setFCost] = useState("");
  const [fDoc, setFDoc] = useState("");
  const [fNotes, setFNotes] = useState("");

  const search = Route.useSearch();
  useEffect(() => {
    if (search.action === "new-preauth" && search.patientId) {
      const pid = search.patientId;
      setFormPatientId(pid);
      const p = patients.find((x) => x.id === pid);
      setFProvider(p?.insurance?.provider || "");
      setFPolicy(p?.insurance?.policyId || "");
      setFormStep("form");
      setShowNewForm(true);
      setActiveTab("preauths");
    }
  }, [search.action, search.patientId, patients]);

  /* ── Derived ── */
  const filteredClaims = useMemo(() => {
    let list = [...claims];
    if (filter !== "All") list = list.filter((c) => STATUS_META[c.status]?.label === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((c) => {
        const p = patients.find((x) => x.id === c.patientId);
        return c.id.toLowerCase().includes(s) || c.provider.toLowerCase().includes(s) || p?.name.toLowerCase().includes(s);
      });
    }
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (sortBy === "date") {
        valA = a.submittedAt || a.decisionAt || "";
        valB = b.submittedAt || b.decisionAt || "";
      } else if (sortBy === "name") {
        valA = patients.find((p) => p.id === a.patientId)?.name || "";
        valB = patients.find((p) => p.id === b.patientId)?.name || "";
      } else if (sortBy === "amount") {
        valA = a.requestedAmount || 0;
        valB = b.requestedAmount || 0;
      }
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
    return list;
  }, [claims, filter, q, patients, sortBy, sortOrder]);

  const filteredPAs = useMemo(() => {
    let list = [...preAuths];
    if (filter !== "All") list = list.filter((pa) => PA_META[pa.status]?.label === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((pa) => {
        const p = patients.find((x) => x.id === pa.patientId);
        return pa.id.toLowerCase().includes(s) || pa.provider.toLowerCase().includes(s) || p?.name.toLowerCase().includes(s);
      });
    }
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (sortBy === "date") {
        valA = a.createdAt || a.submittedAt || "";
        valB = b.createdAt || b.submittedAt || "";
      } else if (sortBy === "name") {
        valA = patients.find((p) => p.id === a.patientId)?.name || "";
        valB = patients.find((p) => p.id === b.patientId)?.name || "";
      } else if (sortBy === "amount") {
        valA = a.estimatedCost || 0;
        valB = b.estimatedCost || 0;
      }
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
    return list;
  }, [preAuths, filter, q, patients, sortBy, sortOrder]);

  const filteredPatients = useMemo(() => {
    const s = patientQ.trim().toLowerCase();
    if (!s) return patients.slice(0, 6);
    return patients.filter((p) => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || (p.phone || "").includes(s));
  }, [patients, patientQ]);

  const claim = claims.find((c) => c.id === selectedClaimId) || filteredClaims[0];
  const pa = preAuths.find((x) => x.id === selectedPAId) || filteredPAs[0];

  const cPatient = useMemo(() => claim && patients.find((p) => p.id === claim.patientId), [claim, patients]);
  const cDoctor = useMemo(() => claim && doctors.find((d) => d.id === claim.doctorId), [claim, doctors]);
  const paPatient = useMemo(() => pa && patients.find((p) => p.id === pa.patientId), [pa, patients]);
  const formPatient = useMemo(() => patients.find((p) => p.id === formPatientId) || null, [patients, formPatientId]);

  const tsNow = () => {
    const d = new Date(), z = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:00`;
  };

  /* ── Claim actions ── */
  const doSubmitClaim = () => { updateClaim(claim.id, { status: "submitted", submittedAt: tsNow() }); toast.success(`${claim.id} submitted`); };
  const doApproveClaim = () => { updateClaim(claim.id, { status: "approved", approvedAmount: claim.requestedAmount, decisionAt: tsNow() }); toast.success("Approved in full"); };
  const doPartialClaim = () => { const a = Math.round(claim.requestedAmount * 0.75); updateClaim(claim.id, { status: "partial", approvedAmount: a, decisionAt: tsNow() }); toast(`Partial: ${fmt(a)}`); };
  const doRejectClaim = () => { updateClaim(claim.id, { status: "rejected", approvedAmount: 0, decisionAt: tsNow() }); toast.error(`${claim.id} rejected`); };
  const doUpload = () => { updateClaim(claim.id, { documents: [...claim.documents, { name: `Attachment-${claim.documents.length + 1}.pdf`, size: `${Math.floor(Math.random() * 900) + 200} KB` }] }); toast.success("Document attached"); };

  /* ── Pre-auth actions ── */
  const doSubmitPA = () => { updatePreAuth(pa.id, { status: "submitted", submittedAt: tsNow() }); toast.success(`${pa.id} submitted`); };
  const doApprovePA = () => { const a = Number(approvedInput) || pa.estimatedCost; updatePreAuth(pa.id, { status: "approved", approvedAmount: a, decisionAt: tsNow() }); toast.success(`Approved ${fmt(a)}`); setApprovedInput(""); };
  const doRejectPA = () => { updatePreAuth(pa.id, { status: "rejected", approvedAmount: 0, decisionAt: tsNow() }); toast.error(`${pa.id} rejected`); };
  const doConvert = () => { const nc = convertPreAuthToClaim(pa.id); if (nc) { toast.success(`Converted → ${nc.id}`); setActiveTab("claims"); setFilter("All"); setSelectedClaimId(nc.id); setShowNewForm(false); } else toast.error("Must be approved first."); };

  /* ── New Pre-auth submit ── */
  const resetForm = () => { setFormStep("patient"); setPatientQ(""); setFormPatientId(""); setFProvider(""); setFPolicy(""); setFProcedure("OPD Consultation"); setFDiagnosis(""); setFCost(""); setFDoc(""); setFNotes(""); };
  const openNewForm = () => { resetForm(); setShowNewForm(true); setActiveTab("preauths"); };
  const cancelForm = () => { setShowNewForm(false); resetForm(); };

  const selectFormPatient = (pid: string) => {
    setFormPatientId(pid);
    const p = patients.find((x) => x.id === pid);
    setFProvider(p?.insurance?.provider || "");
    setFPolicy(p?.insurance?.policyId || "");
    setFormStep("form");
  };

  const handleSavePA = (status: "draft" | "submitted") => {
    if (!formPatientId) return toast.error("Select a patient");
    if (!fProvider || !fPolicy) return toast.error("Provider and Policy ID required");
    if (!fDiagnosis) return toast.error("Diagnosis required");
    if (!fCost || Number(fCost) <= 0) return toast.error("Enter a valid estimated cost");
    const np = addPreAuth({ patientId: formPatientId, provider: fProvider, policyId: fPolicy, procedureType: fProcedure, diagnosis: fDiagnosis, estimatedCost: Number(fCost), notes: fNotes, documentName: fDoc || undefined, status, submittedAt: status === "submitted" ? tsNow() : undefined });
    toast.success(status === "submitted" ? `${np.id} submitted!` : `${np.id} saved as draft`);
    setSelectedPAId(np.id);
    setShowNewForm(false);
    resetForm();
  };

  /* ── KPIs ── */
  const kpis = activeTab === "claims"
    ? [
        { label: "Open", val: claims.filter((c) => ["pending", "submitted"].includes(c.status)).length, color: "text-mustard" },
        { label: "Approved", val: claims.filter((c) => ["approved", "partial"].includes(c.status)).length, color: "text-money" },
        { label: "Rejected", val: claims.filter((c) => c.status === "rejected").length, color: "text-clay" },
        { label: "Pending Amt", val: fmt(claims.filter((c) => ["pending", "submitted"].includes(c.status)).reduce((s, c) => s + (c.requestedAmount || 0), 0)), color: "text-teal" },
      ]
    : [
        { label: "Open", val: preAuths.filter((p) => ["draft", "submitted"].includes(p.status)).length, color: "text-mustard" },
        { label: "Approved", val: preAuths.filter((p) => p.status === "approved").length, color: "text-money" },
        { label: "Rejected", val: preAuths.filter((p) => ["rejected", "expired"].includes(p.status)).length, color: "text-clay" },
        { label: "Pending Amt", val: fmt(preAuths.filter((p) => p.status === "submitted").reduce((s, p) => s + p.estimatedCost, 0)), color: "text-teal" },
      ];

  const claimStep = !claim ? 0 : ({ pending: 0, submitted: 1, approved: 2, partial: 2, rejected: 2, "not-required": 2 } as any)[claim.status] ?? 0;
  const paStep = !pa ? 0 : ({ draft: 0, submitted: 1, approved: 2, rejected: 2, expired: 2 } as any)[pa.status] ?? 0;
  const claimStepLabels = [
    "Pending",
    "Submitted",
    claim && ["approved", "partial", "rejected", "not-required"].includes(claim.status)
      ? (STATUS_META[claim.status]?.label || "Decision")
      : "Decision"
  ];
  const paStepLabels = [
    "Draft",
    "Submitted",
    pa && ["approved", "rejected", "expired"].includes(pa.status)
      ? (PA_META[pa.status]?.label || "Decision")
      : "Decision"
  ];

  const claimFilters = ["All", ...CLAIM_STATUSES.map((s) => s.label)];
  const paFilters = ["All", "Draft", "Submitted", "Approved", "Rejected", "Expired"];
  const activeList = activeTab === "claims" ? filteredClaims : filteredPAs;

  return (
    <div data-testid="insurance-page" className="flex flex-col h-full gap-0">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-ink-400">Front Desk</div>
          <h1 className="text-[22px] font-heading font-bold text-ink-900 leading-tight">Insurance &amp; Pre-Auth</h1>
        </div>
        <button
          data-testid="request-preauth-btn"
          onClick={openNewForm}
          className="btn-primary h-9 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Pre-auth Request
        </button>
      </div>

      {/* ── Tabs + Stats ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-ink-200 mb-5">
        <div className="flex">
          {[{ id: "claims", label: "Claims & Settlements" }, { id: "preauths", label: "Pre-authorizations" }].map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => {
                setActiveTab(t.id as any);
                setFilter("All");
                setSortBy("date");
                setSortOrder("desc");
                setQ("");
                setShowNewForm(false);
                setShowPopover(false);
              }}
              className={`px-5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id ? "border-sage text-sage font-semibold" : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-8 pr-1 pb-2.5">
          {kpis.map((k) => (
            <div key={k.label} className="text-right">
              <div className={`text-[20px] font-heading font-bold tabular-nums leading-none ${k.color}`}>{k.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-400 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-panel ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">

        {/* ── LEFT: list ───────────────────────────────────────────── */}
        <div className="col-span-4 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-ink-200 bg-white" style={{ height: "calc(100vh - 268px)" }}>
          <div className="p-3 border-b border-ink-200 space-y-2.5 shrink-0 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                data-testid="insurance-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={activeTab === "claims" ? "Claim, patient, provider…" : "Request, patient, service…"}
                className="w-full h-9 pl-9 pr-8 text-[12.5px] bg-bone rounded-lg border border-ink-200 focus:outline-none focus:border-sage"
              />
              <button
                type="button"
                onClick={() => {
                  if (!showPopover) {
                    setTempFilter(filter);
                    setTempSortBy(sortBy);
                    setTempSortOrder(sortOrder);
                  }
                  setShowPopover(!showPopover);
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded transition-colors ${
                  showPopover || filter !== "All" || sortBy !== "date" || sortOrder !== "desc"
                    ? "text-sage bg-sage-soft"
                    : "text-ink-400 hover:text-ink-900 hover:bg-ink-100"
                }`}
                title="Filter & Sort"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Floating Filter Popover Card */}
            {showPopover && (
              <div className="absolute left-3 right-3 top-12 z-50 bg-white border border-ink-200 rounded-xl shadow-xl p-4 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                  <span className="text-[13px] font-semibold text-ink-900">Filter &amp; Sort</span>
                  <button
                    type="button"
                    onClick={() => setShowPopover(false)}
                    className="text-ink-400 hover:text-ink-600 text-[11px] font-mono"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Filter Section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 font-semibold">Filter by Status</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(activeTab === "claims" ? claimFilters : paFilters).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTempFilter(f)}
                        className={`h-6 px-2.5 rounded-full text-[11px] font-medium border transition-colors ${
                          tempFilter === f
                            ? "bg-sage text-white border-sage"
                            : "text-ink-500 border-ink-200 hover:text-ink-900 hover:bg-bone"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By Section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 font-semibold">Sort By</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "date", label: "Date" },
                      { id: "name", label: "Patient Name" },
                      { id: "amount", label: activeTab === "claims" ? "Claim Amt" : "Est. Cost" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTempSortBy(item.id as any)}
                        className={`h-7 rounded-lg text-[11px] font-medium border transition-colors ${
                          tempSortBy === item.id
                            ? "bg-sage text-white border-sage"
                            : "text-ink-500 border-ink-200 hover:text-ink-900 hover:bg-bone"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Direction Section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 font-semibold">Direction</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "asc", label: tempSortBy === "name" ? "A → Z" : tempSortBy === "amount" ? "Lowest First" : "Oldest First" },
                      { id: "desc", label: tempSortBy === "name" ? "Z → A" : tempSortBy === "amount" ? "Highest First" : "Newest First" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTempSortOrder(item.id as any)}
                        className={`h-7 rounded-lg text-[11px] font-medium border transition-colors ${
                          tempSortOrder === item.id
                            ? "bg-sage text-white border-sage"
                            : "text-ink-500 border-ink-200 hover:text-ink-900 hover:bg-bone"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempFilter("All");
                      setTempSortBy("date");
                      setTempSortOrder("desc");
                    }}
                    className="text-[11px] text-ink-400 hover:text-ink-900 transition-colors underline"
                  >
                    Reset Defaults
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPopover(false)}
                      className="h-8 px-3 rounded-lg text-[11px] border border-ink-200 hover:bg-bone text-ink-600 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter(tempFilter);
                        setSortBy(tempSortBy);
                        setSortOrder(tempSortOrder);
                        setShowPopover(false);
                      }}
                      className="btn-primary h-8 px-4 text-[11px] rounded-lg"
                    >
                      Apply &amp; Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters / Sorting Summary Banner */}
            {(filter !== "All" || sortBy !== "date" || sortOrder !== "desc") && (
              <div className="flex items-center justify-between bg-sage-soft/30 border border-sage-soft/70 px-2.5 py-1.5 rounded-lg animate-fadeIn">
                <span className="text-[11px] text-sage font-medium truncate">
                  {filter !== "All" && `Status: ${filter}`}
                  {(sortBy !== "date" || sortOrder !== "desc") && (
                    <>
                      {filter !== "All" && " · "}
                      {`Sorted: ${sortBy === "date" ? "Date" : sortBy === "name" ? "Name" : "Amount"} (${sortOrder === "asc" ? "Asc" : "Desc"})`}
                    </>
                  )}
                </span>
                <button
                  onClick={() => {
                    setFilter("All");
                    setSortBy("date");
                    setSortOrder("desc");
                  }}
                  className="text-[10px] text-clay hover:underline font-semibold ml-2 shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <ul className="overflow-y-auto flex-1 divide-y divide-ink-100">
            {activeTab === "claims"
              ? filteredClaims.map((c) => {
                  const p = patients.find((x) => x.id === c.patientId);
                  const meta = STATUS_META[c.status];
                  const active = !showNewForm && claim?.id === c.id;
                  const ini = p?.name.split(" ").map((s) => s[0]).slice(0, 2).join("") ?? "?";
                  return (
                    <li key={c.id}>
                      <button data-testid={`claim-row-${c.id}`} onClick={() => { setSelectedClaimId(c.id); setShowNewForm(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${active ? "bg-sage-soft/60" : "hover:bg-bone/50"}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${active ? "bg-sage text-white" : "bg-ink-100 text-ink-600"}`}>{ini}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-ink-900 truncate">{p?.name}</div>
                          <div className="text-[11px] text-ink-400 font-mono truncate">{c.id} · {c.provider}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12.5px] font-mono font-semibold text-ink-900">{fmt(c.requestedAmount)}</div>
                          <span className={`${meta?.chip || "chip-ink"} inline-flex items-center gap-1 mt-0.5`}>
                            <span className={CLAIM_DOT[c.status]} />{meta?.label}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })
              : filteredPAs.map((x) => {
                  const p = patients.find((pt) => pt.id === x.patientId);
                  const meta = PA_META[x.status];
                  const active = !showNewForm && pa?.id === x.id;
                  const ini = p?.name.split(" ").map((s) => s[0]).slice(0, 2).join("") ?? "?";
                  return (
                    <li key={x.id}>
                      <button data-testid={`preauth-row-${x.id}`} onClick={() => { setSelectedPAId(x.id); setShowNewForm(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${active ? "bg-sage-soft/60" : "hover:bg-bone/50"}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${active ? "bg-sage text-white" : "bg-ink-100 text-ink-600"}`}>{ini}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-ink-900 truncate">{p?.name}</div>
                          <div className="text-[11px] text-ink-400 font-mono truncate">{x.id} · {x.provider}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12.5px] font-mono font-semibold text-ink-900">{fmt(x.estimatedCost)}</div>
                          <span className={`${meta?.chip || "chip-ink"} inline-flex items-center gap-1 mt-0.5`}>
                            <span className={PA_DOT[x.status]} />{meta?.label}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            {activeList.length === 0 && (
              <li className="p-10 text-center text-[12.5px] text-ink-400">No records found.</li>
            )}
          </ul>
        </div>

        {/* ── RIGHT panel ──────────────────────────────────────────── */}
        <div className="col-span-8 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-ink-200 bg-white" style={{ height: "calc(100vh - 268px)" }}>

          {/* ════════════ NEW PRE-AUTH INLINE FORM ════════════ */}
          {showNewForm && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-ink-200 shrink-0 flex items-center gap-3">
                <button onClick={cancelForm} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-4 h-4 text-ink-500" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400">
                    {formStep === "patient" ? "Step 1 of 2" : "Step 2 of 2"}
                  </div>
                  <h2 className="text-[18px] font-heading font-bold text-ink-900 leading-tight">
                    {formStep === "patient" ? "Select Patient" : `New Pre-auth · ${formPatient?.name}`}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${formStep === "patient" ? "bg-sage" : "bg-ink-200"}`} />
                  <div className={`w-2 h-2 rounded-full ${formStep === "form" ? "bg-sage" : "bg-ink-200"}`} />
                </div>
              </div>

              {formStep === "patient" ? (
                /* ── Patient picker ── */
                <>
                  <div className="px-6 pt-5 pb-3 shrink-0 border-b border-ink-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input
                        autoFocus
                        value={patientQ}
                        onChange={(e) => setPatientQ(e.target.value)}
                        placeholder="Search by name, MRN, or phone…"
                        className="w-full h-10 pl-10 pr-4 text-[13px] border border-ink-200 rounded-xl bg-bone focus:outline-none focus:border-sage"
                      />
                    </div>
                  </div>
                  <ul className="overflow-y-auto flex-1 divide-y divide-ink-100">
                    {filteredPatients.map((p) => {
                      const ini = p.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => selectFormPatient(p.id)}
                            className="w-full text-left px-6 py-3.5 flex items-center gap-4 hover:bg-bone/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full bg-sage-soft text-sage flex items-center justify-center text-[13px] font-bold shrink-0 group-hover:bg-sage group-hover:text-white transition-colors">
                              {ini}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-semibold text-ink-900">{p.name}</div>
                              <div className="text-[12px] text-ink-400 font-mono mt-0.5">{p.id} · {p.phone}</div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {p.insurance?.provider
                                ? <span className="chip-teal text-[11px]">{p.insurance.provider}</span>
                                : <span className="text-[11px] text-ink-400 italic">No insurance</span>
                              }
                              <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-sage group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                    {filteredPatients.length === 0 && (
                      <li className="p-12 text-center text-[12.5px] text-ink-400">No patients found.</li>
                    )}
                  </ul>
                </>
              ) : (
                /* ── Form ── */
                <>
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 divide-x divide-ink-100">

                      {/* Left column */}
                      <div className="px-6 py-5">
                        <SectionHead icon={Hospital} title="Insurance Details" />
                        <div className="mt-2 space-y-0">
                          <FormRow label="Insurance Provider" required>
                            <input value={fProvider} onChange={(e) => setFProvider(e.target.value)} className={inputCls} placeholder="e.g. Star Health" />
                          </FormRow>
                          <FormRow label="Policy / Member ID" required>
                            <input value={fPolicy} onChange={(e) => setFPolicy(e.target.value)} className={inputCls} placeholder="e.g. SH-882-3341" />
                          </FormRow>
                        </div>

                        <div className="mt-6">
                          <SectionHead icon={Stethoscope} title="Clinical Details" />
                          <div className="mt-2 space-y-0">
                            <FormRow label="Procedure Type" required>
                              <select value={fProcedure} onChange={(e) => setFProcedure(e.target.value)} className={selectCls}>
                                <option>OPD Consultation</option>
                                <option>Inpatient Procedure</option>
                                <option>Diagnostic Scan</option>
                                <option>Daycare Surgery</option>
                                <option>Emergency Admission</option>
                              </select>
                            </FormRow>
                            <FormRow label="Diagnosis & ICD-10" required>
                              <input value={fDiagnosis} onChange={(e) => setFDiagnosis(e.target.value)} className={inputCls} placeholder="e.g. Lumbar radiculopathy (ICD M54.16)" />
                            </FormRow>
                          </div>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="px-6 py-5">
                        <SectionHead icon={IndianRupee} title="Financial" />
                        <div className="mt-2 space-y-0">
                          <FormRow label="Estimated Cost (₹)" required>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-400 font-mono">₹</span>
                              <input type="number" value={fCost} onChange={(e) => setFCost(e.target.value)} className={`${inputCls} pl-7`} placeholder="0" />
                            </div>
                          </FormRow>
                        </div>

                        <div className="mt-6">
                          <SectionHead icon={FileText} title="Supporting Documents" />
                          <div className="mt-2 space-y-0">
                            <FormRow label="Document Filename">
                              <input value={fDoc} onChange={(e) => setFDoc(e.target.value)} className={inputCls} placeholder="e.g. prescription_scan.pdf" />
                            </FormRow>
                          </div>
                        </div>

                        <div className="mt-6">
                          <SectionHead icon={FileText} title="Receptionist Note" />
                          <div className="mt-3">
                            <textarea
                              value={fNotes}
                              onChange={(e) => setFNotes(e.target.value)}
                              className="w-full px-3 py-2.5 text-[13px] border border-ink-200 rounded-lg bg-white focus:outline-none focus:border-sage resize-none h-24"
                              placeholder="Emergency details, TPA history, past requests…"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form footer */}
                  <div className="px-6 py-3.5 border-t border-ink-200 flex items-center gap-2 shrink-0">
                    <button onClick={cancelForm} className="h-9 px-4 text-[12.5px] text-ink-500 hover:bg-ink-100 rounded-lg transition font-medium">
                      Cancel
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => handleSavePA("draft")} className="btn-outline h-9 flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Save as Draft
                      </button>
                      <button onClick={() => handleSavePA("submitted")} className="btn-primary h-9 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Submit to TPA
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ════════════ CLAIMS DETAIL ════════════ */}
          {!showNewForm && activeTab === "claims" && (
            !claim ? (
              <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center">
                <div className="w-12 h-12 rounded-2xl bg-ink-100 grid place-items-center">
                  <ShieldCheck className="w-5 h-5 text-ink-400" />
                </div>
                <div className="text-[13px] text-ink-400">Select a claim to view details</div>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-ink-200 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400">{claim.id}</div>
                      <h2 className="text-[20px] font-heading font-bold text-ink-900 mt-0.5 leading-tight">{cPatient?.name}</h2>
                      <div className="text-[12px] text-ink-500 font-mono mt-0.5">{cPatient?.id} · {cDoctor?.name}</div>
                    </div>
                    <span className={`${STATUS_META[claim.status]?.chip || "chip-ink"} flex items-center gap-1.5 shrink-0`}>
                      <span className={CLAIM_DOT[claim.status]} />
                      {STATUS_META[claim.status]?.label}
                    </span>
                  </div>
                  <div className="mt-4 flex">
                    <StepFlow steps={claimStepLabels} current={claimStep} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 divide-x divide-ink-100">
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <SectionHead icon={Hospital} title="Insurance Provider" />
                        <Field label="Provider">{claim.provider}</Field>
                        <Field label="Policy ID" mono>{claim.policyId}</Field>
                      </div>
                      <div>
                        <SectionHead icon={Stethoscope} title="Diagnosis & Service" />
                        <Field label="Diagnosis">{claim.diagnosis}</Field>
                        <Field label="Service type">{claim.serviceType}</Field>
                      </div>
                      <div>
                        <SectionHead icon={Calendar} title="Timeline" />
                        <Field label="Created" mono>{claim.createdAt?.slice(0, 10) ?? "—"}</Field>
                        <Field label="Submitted" mono>{claim.submittedAt ? claim.submittedAt.slice(0, 16).replace("T", " ") : "—"}</Field>
                        {claim.decisionAt && <Field label="Decision" mono>{claim.decisionAt.slice(0, 16).replace("T", " ")}</Field>}
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <SectionHead icon={IndianRupee} title="Financial Settlement" />
                        <Field label="Estimated cost" mono>{fmt(claim.estimatedCost)}</Field>
                        <Field label="Requested claim" mono>{fmt(claim.requestedAmount)}</Field>
                        <div className="flex items-baseline gap-3 pt-3 mt-1">
                          <span className="w-36 shrink-0 text-[11.5px] font-semibold text-ink-900">Approved Payout</span>
                          <span className={`text-[24px] font-heading font-bold tabular-nums ${claim.approvedAmount == null ? "text-ink-400" : claim.approvedAmount === 0 ? "text-clay" : claim.approvedAmount < claim.requestedAmount ? "text-plum" : "text-money"}`}>
                            {claim.approvedAmount == null ? "—" : fmt(claim.approvedAmount)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <SectionHead icon={FileText} title="Documents" action={
                          <button onClick={doUpload} className="text-[11px] flex items-center gap-1 text-sage hover:underline font-medium">
                            <Upload className="w-3 h-3" /> Attach
                          </button>
                        } />
                        {claim.documents.length === 0
                          ? <div className="text-[12px] text-ink-400 italic pt-1">No documents attached.</div>
                          : <ul className="space-y-2 pt-1">{claim.documents.map((d: any, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-[12.5px]">
                                <Paperclip className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                                <span className="flex-1 truncate text-ink-900">{d.name}</span>
                                <span className="text-[11px] text-ink-400 font-mono shrink-0">{d.size}</span>
                              </li>
                            ))}</ul>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 border-t border-ink-200 flex items-center gap-2 shrink-0">
                  {claim.status === "pending" && <button data-testid="claim-submit" onClick={doSubmitClaim} className="btn-teal h-9 flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Submit to TPA</button>}
                  {claim.status === "submitted" && <>
                    <button data-testid="claim-approve" onClick={doApproveClaim} className="btn-money h-9 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approve Full</button>
                    <button data-testid="claim-partial" onClick={doPartialClaim} className="btn-plum h-9 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Partial Approval</button>
                    <button data-testid="claim-reject" onClick={doRejectClaim} className="btn-clay h-9 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </>}
                </div>
              </>
            )
          )}

          {/* ════════════ PRE-AUTH DETAIL ════════════ */}
          {!showNewForm && activeTab === "preauths" && (
            !pa ? (
              <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center">
                <div className="w-12 h-12 rounded-2xl bg-ink-100 grid place-items-center">
                  <Shield className="w-5 h-5 text-ink-400" />
                </div>
                <div className="text-[13px] text-ink-400">Select a pre-authorization to review</div>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-ink-200 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400">{pa.id}</div>
                      <h2 className="text-[20px] font-heading font-bold text-ink-900 mt-0.5 leading-tight">{paPatient?.name}</h2>
                      <div className="text-[12px] text-ink-500 font-mono mt-0.5">{paPatient?.id} · {paPatient?.phone}</div>
                    </div>
                    <span className={`${PA_META[pa.status]?.chip || "chip-ink"} flex items-center gap-1.5 shrink-0`}>
                      <span className={PA_DOT[pa.status]} />
                      {PA_META[pa.status]?.label}
                    </span>
                  </div>
                  <div className="mt-4 flex">
                    <StepFlow steps={paStepLabels} current={paStep} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 divide-x divide-ink-100">
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <SectionHead icon={Hospital} title="Insurance Provider" />
                        <Field label="Provider">{pa.provider}</Field>
                        <Field label="Policy ID" mono>{pa.policyId}</Field>
                      </div>
                      <div>
                        <SectionHead icon={Stethoscope} title="Diagnosis & Procedure" />
                        <Field label="Diagnosis">{pa.diagnosis}</Field>
                        <Field label="Procedure type">{pa.procedureType}</Field>
                      </div>
                      <div>
                        <SectionHead icon={Calendar} title="Timeline" />
                        <Field label="Created" mono>{pa.createdAt.slice(0, 10)}</Field>
                        {pa.submittedAt && <Field label="Submitted" mono>{pa.submittedAt.slice(0, 10)}</Field>}
                        {pa.decisionAt && <Field label="Decision" mono>
                          <span className={pa.status === "approved" ? "text-money" : pa.status === "rejected" ? "text-clay" : ""}>{pa.decisionAt.slice(0, 10)}</span>
                        </Field>}
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <SectionHead icon={IndianRupee} title="Financial Assessment" />
                        <Field label="Estimated cost" mono>{fmt(pa.estimatedCost)}</Field>
                        <div className="flex items-baseline gap-3 pt-3 mt-1">
                          <span className="w-36 shrink-0 text-[11.5px] font-semibold text-ink-900">Approved Limit</span>
                          <span className={`text-[24px] font-heading font-bold tabular-nums ${pa.approvedAmount === undefined ? "text-ink-400" : pa.approvedAmount === 0 ? "text-clay" : "text-money"}`}>
                            {pa.approvedAmount === undefined ? "—" : fmt(pa.approvedAmount)}
                          </span>
                        </div>
                      </div>
                      {pa.documentName && (
                        <div>
                          <SectionHead icon={FileText} title="Supporting Document" />
                          <div className="flex items-center gap-2 pt-1">
                            <Paperclip className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                            <span className="text-[12.5px] text-ink-900 truncate">{pa.documentName}</span>
                          </div>
                        </div>
                      )}
                      {pa.notes && (
                        <div>
                          <SectionHead icon={FileText} title="Receptionist Note" />
                          <p className="text-[12.5px] text-ink-700 leading-relaxed pt-1">{pa.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 border-t border-ink-200 flex items-center gap-2 shrink-0">
                  {pa.status === "draft" && <button data-testid="preauth-submit" onClick={doSubmitPA} className="btn-teal h-9 flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Submit to TPA</button>}
                  {pa.status === "submitted" && <>
                    <input type="number" placeholder="Approved ₹" value={approvedInput} onChange={(e) => setApprovedInput(e.target.value)} className="h-9 w-36 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] focus:outline-none focus:border-sage" />
                    <button data-testid="preauth-approve" onClick={doApprovePA} className="btn-money h-9 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Approve</button>
                    <button data-testid="preauth-reject" onClick={doRejectPA} className="btn-clay h-9 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </>}
                  {pa.status === "approved" && <button data-testid="preauth-convert" onClick={doConvert} className="btn-primary h-9 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Convert to Claim</button>}
                  <div className="ml-auto" />
                  <span className="text-[11px] text-ink-400 font-mono flex items-center gap-1.5"><Clock className="w-3 h-3" />{pa.createdAt.slice(0, 10)}</span>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
