// Reception walk-in dashboard
import { Link } from "react-router-dom";
import { useLab, formatRelative, getPatient } from "@/lab/store";
import { useAuth } from "@/lab/auth";
import { SectionLabel, KpiCard, PriorityPill, StatusPill, EmptyState } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { ClipboardPlus, ClipboardList, Stethoscope } from "lucide-react";

export default function ReceptionHome() {
  const { user } = useAuth();
  const { orders, patients } = useLab();

  const today = new Date().toDateString();
  const walkIns = orders.filter((o) => o.source === "reception");
  const todayWalkIns = walkIns.filter((o) => new Date(o.ordered_at).toDateString() === today);
  const activeWalkIns = walkIns.filter((o) => !["validated", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6" data-testid="reception-home">
      <SectionLabel action={
        <Button asChild className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="new-walkin-btn">
          <Link to="/reception/walkin"><ClipboardPlus className="h-4 w-4 mr-1.5" /> New walk-in</Link>
        </Button>
      }>
        Welcome, {user?.name?.split(" ")[0]}.
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Walk-ins today" value={todayWalkIns.length} hint="Since midnight" accent="sage" />
        <KpiCard label="Active" value={activeWalkIns.length} hint="In workflow" accent="amber" />
        <KpiCard label="Total walk-ins" value={walkIns.length} hint="All time" accent="sky" />
        <KpiCard label="Released" value={walkIns.filter((o) => o.status === "validated").length} hint="Reports out" accent="emerald" />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {walkIns.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No walk-ins yet" hint="Use 'New walk-in' to register a patient and order labs in one go." />
        ) : (
          <table className="w-full text-sm" data-testid="walkin-table">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-stone-500">
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Test</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Registered</th>
                <th className="text-left px-4 py-3">Charge</th>
              </tr>
            </thead>
            <tbody>
              {walkIns.sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at)).map((o) => {
                const p = getPatient(o, patients);
                return (
                  <tr key={o.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`reception-row-${o.id}`}>
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
                    <td className="px-4 py-3 font-mono text-stone-700">—</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
