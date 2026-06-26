import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { CLAIM_STATUSES, STATUS_META } from "@/lib/reception-desk/opsData";
import { toast } from "sonner";
import {
  Search,
  ShieldCheck,
  Paperclip,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  ClipboardList,
  Hospital,
  IndianRupee,
  Stethoscope,
  Calendar,
} from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_DOT = {
  pending: "dot-mustard",
  submitted: "dot-teal",
  approved: "dot-money",
  partial: "dot-plum",
  rejected: "dot-clay",
  "not-required": "w-1.5 h-1.5 rounded-full bg-ink-400",
};

function StatusFlow({ status }) {
  const steps = [
    { id: "pending", label: "Pending" },
    { id: "submitted", label: "Submitted" },
    { id: "decision", label: "Decision" },
  ];
  // map decision states to step indices
  const idx =
    status === "pending"
      ? 0
      : status === "submitted"
        ? 1
        : status === "not-required"
          ? -1
          : 2;
  const decided = ["approved", "partial", "rejected"].includes(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, i) => {
        const active = i <= idx;
        const isDecision = i === 2;
        const tint = isDecision
          ? status === "approved"
            ? "bg-money text-white"
            : status === "partial"
              ? "bg-plum text-white"
              : status === "rejected"
                ? "bg-clay text-white"
                : "bg-ink-200 text-ink-400"
          : active
            ? "bg-sage text-white"
            : "bg-ink-200 text-ink-400";
        return (
          <React.Fragment key={s.id}>
            <div
              className={`px-3 h-7 rounded-full text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5 ${tint}`}
            >
              {isDecision && decided ? (
                status === "approved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : status === "rejected" ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )
              ) : null}
              {isDecision && decided ? STATUS_META[status]?.label : s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 ${i < idx ? "bg-sage" : "bg-ink-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Insurance() {
  const { claims, patients, doctors, updateClaim } = useStore();
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(claims[0]?.id);

  const filtered = useMemo(() => {
    let list = claims;
    if (filter !== "All")
      list = list.filter((c) => STATUS_META[c.status]?.label === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((c) => {
        const p = patients.find((x) => x.id === c.patientId);
        return (
          c.id.toLowerCase().includes(s) ||
          c.provider.toLowerCase().includes(s) ||
          p?.name.toLowerCase().includes(s) ||
          p?.id.toLowerCase().includes(s)
        );
      });
    }
    return list;
  }, [claims, filter, q, patients]);

  const selected = claims.find((c) => c.id === selectedId) || filtered[0];
  const selPatient = selected && patients.find((p) => p.id === selected.patientId);
  const selDoctor = selected && doctors.find((d) => d.id === selected.doctorId);

  const tsNow = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const submit = () => {
    updateClaim(selected.id, { status: "submitted", submittedAt: tsNow() });
    toast.success(`${selected.id} submitted to ${selected.provider}`);
  };
  const approve = () => {
    updateClaim(selected.id, {
      status: "approved",
      approvedAmount: selected.requestedAmount,
      decisionAt: tsNow(),
    });
    toast.success(`Approved ${fmt(selected.requestedAmount)}`);
  };
  const partial = () => {
    const amt = Math.round(selected.requestedAmount * 0.75);
    updateClaim(selected.id, {
      status: "partial",
      approvedAmount: amt,
      decisionAt: tsNow(),
    });
    toast(`Partial approval ${fmt(amt)}`);
  };
  const reject = () => {
    updateClaim(selected.id, {
      status: "rejected",
      approvedAmount: 0,
      decisionAt: tsNow(),
    });
    toast.error(`${selected.id} rejected`);
  };
  const uploadDoc = () => {
    updateClaim(selected.id, {
      documents: [
        ...selected.documents,
        {
          name: `Attachment-${selected.documents.length + 1}.pdf`,
          size: `${Math.floor(Math.random() * 900) + 200} KB`,
        },
      ],
    });
    toast.success("Document attached");
  };

  // KPI strip
  const total = claims.length;
  const byStatus = (id) => claims.filter((c) => c.status === id).length;
  const approvedAmount = claims
    .filter((c) => c.status === "approved" || c.status === "partial")
    .reduce((s, c) => s + (c.approvedAmount || 0), 0);
  const pendingAmount = claims
    .filter((c) => ["pending", "submitted"].includes(c.status))
    .reduce((s, c) => s + (c.requestedAmount || 0), 0);

  const KPI = ({ tint, label, value, sub, icon: Icon, testId }) => (
    <div
      data-testid={testId}
      className={`rounded-xl border p-4 ${tint.border} ${tint.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium ${tint.label}`}>
          {label}
        </div>
        <div className={`w-7 h-7 rounded-full grid place-items-center ${tint.iconBg}`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="text-[26px] font-heading font-semibold tabular-nums mt-2 text-ink-900">
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-600 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div data-testid="insurance-page" className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          testId="kpi-claims-open"
          tint={{
            border: "border-mustard/30",
            bg: "bg-mustard-soft/50",
            label: "text-mustard",
            iconBg: "bg-mustard",
          }}
          icon={ClipboardList}
          label="Open claims"
          value={byStatus("pending") + byStatus("submitted")}
          sub={`${byStatus("pending")} pending · ${byStatus("submitted")} submitted`}
        />
        <KPI
          testId="kpi-claims-approved"
          tint={{
            border: "border-money/30",
            bg: "bg-money-soft/50",
            label: "text-money",
            iconBg: "bg-money",
          }}
          icon={CheckCircle2}
          label="Approved"
          value={byStatus("approved") + byStatus("partial")}
          sub={fmt(approvedAmount)}
        />
        <KPI
          testId="kpi-claims-rejected"
          tint={{
            border: "border-clay/30",
            bg: "bg-clay-soft/50",
            label: "text-clay",
            iconBg: "bg-clay",
          }}
          icon={XCircle}
          label="Rejected"
          value={byStatus("rejected")}
          sub="needs review"
        />
        <KPI
          testId="kpi-claims-due"
          tint={{
            border: "border-teal/30",
            bg: "bg-teal-soft/50",
            label: "text-teal",
            iconBg: "bg-teal",
          }}
          icon={IndianRupee}
          label="Pending amount"
          value={fmt(pendingAmount)}
          sub={`across ${total} total claims`}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Claim list */}
        <section className="col-span-12 lg:col-span-5 surface flex flex-col h-[calc(100vh-260px)]">
          <div className="p-3 border-b border-ink-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                data-testid="insurance-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search claim, patient, provider…"
                className="w-full h-9 pl-9 pr-3 text-[13px] bg-bone border border-ink-200 rounded-md focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["All", ...CLAIM_STATUSES.map((s) => s.label)].map((f) => (
                <button
                  key={f}
                  data-testid={`insurance-filter-${f.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setFilter(f)}
                  className={`h-7 px-3 text-[12px] rounded-full font-medium border ${
                    filter === f
                      ? "bg-ink-900 text-white border-ink-900"
                      : "text-ink-600 hover:text-ink-900 hover:bg-bone border-ink-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="overflow-y-auto divide-y divide-ink-200">
            {filtered.map((c) => {
              const p = patients.find((x) => x.id === c.patientId);
              const meta = STATUS_META[c.status];
              const active = selected?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    data-testid={`claim-row-${c.id}`}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3 row-hover flex items-center gap-3 ${
                      active ? "bg-sage-soft/40" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-soft text-teal grid place-items-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-medium text-ink-900 truncate">
                          {p?.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {c.id} · {c.provider}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-mono font-semibold text-ink-900 tabular-nums">
                        {fmt(c.requestedAmount)}
                      </div>
                      <div className="mt-1">
                        <span className={meta?.chip || "chip-ink"}>
                          <span className={STATUS_DOT[c.status]} />
                          {meta?.label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-8 text-center text-[13px] text-ink-400">
                No claims match.
              </li>
            )}
          </ul>
        </section>

        {/* Claim detail */}
        <section className="col-span-12 lg:col-span-7 surface">
          {!selected ? (
            <div className="p-12 text-center text-ink-400 text-[13px]">
              Select a claim
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-ink-200 flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-teal-soft text-teal grid place-items-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                    Pre-authorization · {selected.id}
                  </div>
                  <div className="text-[20px] font-heading font-semibold text-ink-900 mt-0.5">
                    {selPatient?.name}
                  </div>
                  <div className="text-[12px] text-ink-600 mt-1">
                    {selPatient?.id} · {selDoctor?.name}
                  </div>
                </div>
                <span className={STATUS_META[selected.status]?.chip || "chip-ink"}>
                  <span className={STATUS_DOT[selected.status]} />
                  {STATUS_META[selected.status]?.label}
                </span>
              </div>

              <div className="px-6 pt-4 pb-2 border-b border-ink-200">
                <StatusFlow status={selected.status} />
              </div>

              <div className="px-6 py-5 grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono mb-2 flex items-center gap-1.5">
                      <Hospital className="w-3 h-3 text-teal" />
                      Insurance
                    </div>
                    <div className="text-[14px] font-medium text-ink-900">
                      {selected.provider}
                    </div>
                    <div className="text-[12px] text-ink-400 font-mono mt-0.5">
                      Policy {selected.policyId}
                    </div>
                  </div>
                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono mb-2 flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3 text-plum" />
                      Diagnosis & service
                    </div>
                    <div className="text-[13px] text-ink-900">{selected.diagnosis}</div>
                    <div className="text-[11.5px] text-ink-400 mt-1">
                      {selected.serviceType}
                    </div>
                  </div>
                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-mustard" />
                      Timeline
                    </div>
                    <ul className="text-[12px] text-ink-600 space-y-1 font-mono">
                      <li>
                        Submitted ·{" "}
                        {selected.submittedAt
                          ? selected.submittedAt.slice(11, 16)
                          : "—"}
                      </li>
                      <li>
                        Decision ·{" "}
                        {selected.decisionAt
                          ? selected.decisionAt.slice(11, 16)
                          : "—"}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono mb-3">
                      Amounts
                    </div>
                    <div className="text-[13px] text-ink-600 flex justify-between">
                      <span>Estimated cost</span>
                      <span className="font-mono text-ink-900">
                        {fmt(selected.estimatedCost)}
                      </span>
                    </div>
                    <div className="text-[13px] text-ink-600 flex justify-between mt-1">
                      <span>Requested</span>
                      <span className="font-mono text-ink-900">
                        {fmt(selected.requestedAmount)}
                      </span>
                    </div>
                    <div className="text-[14px] flex justify-between mt-3 pt-3 border-t border-ink-200">
                      <span className="font-medium text-ink-900">Approved</span>
                      <span
                        className={`font-mono font-semibold text-[18px] ${
                          selected.approvedAmount === null
                            ? "text-ink-400"
                            : selected.approvedAmount === 0
                              ? "text-clay"
                              : selected.approvedAmount < selected.requestedAmount
                                ? "text-plum"
                                : "text-money"
                        }`}
                      >
                        {selected.approvedAmount === null
                          ? "—"
                          : fmt(selected.approvedAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-ink-200 p-4">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono mb-2 flex items-center justify-between">
                      <span>Documents</span>
                      <button
                        data-testid="claim-upload"
                        onClick={uploadDoc}
                        className="text-[11px] inline-flex items-center gap-1 text-sage hover:text-sage-hover font-medium"
                      >
                        <Upload className="w-3 h-3" />
                        Attach
                      </button>
                    </div>
                    {selected.documents.length === 0 ? (
                      <div className="text-[12px] text-ink-400 italic">
                        No documents yet.
                      </div>
                    ) : (
                      <ul className="space-y-1.5 text-[12.5px]">
                        {selected.documents.map((d, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-ink-900"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-ink-400" />
                            <span className="flex-1 truncate">{d.name}</span>
                            <span className="text-[11px] text-ink-400 font-mono">
                              {d.size}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selected.note && (
                    <div className="rounded-lg border border-mustard/30 bg-mustard-soft p-3 text-[12px] text-ink-900">
                      <span className="font-medium">Note: </span>
                      {selected.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-ink-200 flex flex-wrap gap-2">
                {selected.status === "pending" && (
                  <button
                    data-testid="claim-submit"
                    onClick={submit}
                    className="btn-teal btn-lg"
                  >
                    <Send className="w-4 h-4" />
                    Submit pre-auth
                  </button>
                )}
                {selected.status === "submitted" && (
                  <>
                    <button
                      data-testid="claim-approve"
                      onClick={approve}
                      className="btn-money"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark approved
                    </button>
                    <button
                      data-testid="claim-partial"
                      onClick={partial}
                      className="btn-plum"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Partial approval
                    </button>
                    <button
                      data-testid="claim-reject"
                      onClick={reject}
                      className="btn-clay"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <div className="ml-auto" />
                <button className="btn-outline">
                  <Paperclip className="w-4 h-4" />
                  Forward to TPA
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
