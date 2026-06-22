// Doctor home — shows their patients + their orders + result quick view
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLab, formatRelative, getPatient, flagValue } from "@/lab/store";
import { useAuth } from "@/lab/auth";
import { SectionLabel, KpiCard, PriorityPill, StatusPill, FlagBadge, EmptyState } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardPlus, ClipboardList, Stethoscope, Search } from "lucide-react";
import LabReport from "@/lab/components/LabReport";

export default function DoctorHome() {
  const { user } = useAuth();
  const { orders, patients, findCatalog, hospital } = useLab();
  const [q, setQ] = useState("");
  const [printOrderId, setPrintOrderId] = useState(null);

  const myOrders = useMemo(() => orders.filter((o) => o.doctor_user_id === user?.user_id), [orders, user]);

  const filtered = useMemo(() => {
    if (!q) return myOrders;
    const ql = q.toLowerCase();
    return myOrders.filter((o) => {
      const p = getPatient(o, patients);
      return o.id.toLowerCase().includes(ql) || o.test_code.toLowerCase().includes(ql) || p?.name?.toLowerCase().includes(ql) || p?.mrn?.toLowerCase().includes(ql);
    });
  }, [myOrders, q, patients]);

  const stats = {
    total: myOrders.length,
    pending: myOrders.filter((o) => !["validated", "cancelled"].includes(o.status)).length,
    released: myOrders.filter((o) => o.status === "validated").length,
  };

  const printOrder = orders.find((o) => o.id === printOrderId);

  return (
    <div className="space-y-6" data-testid="doctor-home">
      <SectionLabel action={
        <Button asChild className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="place-order-btn">
          <Link to="/doctor/new-order"><ClipboardPlus className="h-4 w-4 mr-1.5" /> Place lab order</Link>
        </Button>
      }>
        Good morning, Dr. {user?.name?.split(" ").pop()}.
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Orders placed" value={stats.total} hint="All time" accent="sage" />
        <KpiCard label="Pending results" value={stats.pending} hint="In workflow" accent="amber" />
        <KpiCard label="Released" value={stats.released} hint="Ready to review" accent="emerald" />
        <KpiCard label="Patients" value={new Set(myOrders.map((o) => o.patient_id)).size} hint="Distinct" accent="sky" />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my patients, MRN, order…" className="pl-9 bg-white border-stone-200" data-testid="doctor-search" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No orders yet" hint="Place your first lab order from the button above." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-stone-500">
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Test</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Ordered</th>
                <th className="text-left px-4 py-3">Flags</th>
                <th className="text-right px-4 py-3">Report</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const p = getPatient(o, patients);
                const cat = findCatalog(o.test_code);
                const flags = cat?.parameters.map((pp) => flagValue(pp, o.results?.[pp.key])).filter((f) => f.level !== "normal" && f.level !== "empty");
                return (
                  <tr key={o.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`doc-order-${o.id}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-[11px] font-mono text-stone-500">{p?.mrn} · {p?.age}{p?.sex}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.test_code}</div>
                      <div className="text-[11px] text-stone-500">{o.test_name}</div>
                    </td>
                    <td className="px-4 py-3"><PriorityPill priority={o.priority} /></td>
                    <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-4 py-3 text-stone-600">{formatRelative(o.ordered_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {(flags?.length ?? 0) === 0 ? <span className="text-xs text-stone-400">—</span> :
                          flags.slice(0, 3).map((f, i) => <FlagBadge key={i} {...f} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === "validated" && (
                        <Button size="sm" variant="outline" className="border-stone-200" onClick={() => setPrintOrderId(o.id)} data-testid={`open-report-${o.id}`}>
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {printOrder && (
        <LabReport order={printOrder} patient={getPatient(printOrder, patients)}
          catalog={findCatalog(printOrder.test_code)} hospital={hospital} onClose={() => setPrintOrderId(null)} />
      )}
    </div>
  );
}
