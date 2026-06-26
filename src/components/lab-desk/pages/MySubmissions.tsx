import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useLabStore, formatRelative, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import { useTechnicianOrders } from "@/lib/lab-desk/technician";
import { isSubmittedToSupervisor } from "@/lib/lab-desk/specimen";
import { SectionLabel, StatusPill, PriorityPill } from "@/components/lab-desk/Pills";
import { Send, CheckCircle, Clock } from "lucide-react";

export default function MySubmissions() {
  const { patients } = useLabStore();
  const mine = useTechnicianOrders();

  const submissions = useMemo(
    () => mine.filter(isSubmittedToSupervisor).sort((a, b) => {
      const ta = a.completed_at ?? a.validated_at ?? "";
      const tb = b.completed_at ?? b.validated_at ?? "";
      return new Date(tb).getTime() - new Date(a).getTime();
    }),
    [mine],
  );

  const awaiting = submissions.filter((o) => o.status === "validation");
  const released = submissions.filter((o) => o.status === "validated");

  return (
    <div className="space-y-6" data-testid="my-submissions">
      <div className="border-l-4 border-sage bg-sage-soft/40 px-4 py-3 text-[13px] text-ink-700">
        <strong className="text-sage">Result submissions</strong> — only tests you entered and sent
        to the supervisor. Physical tubes are tracked in{" "}
        <Link to="/lab/samples" className="font-medium text-teal hover:underline">My samples</Link>.
        Active draws stay in{" "}
        <Link to="/lab/collection" className="font-medium text-plum hover:underline">Collection</Link>.
      </div>

      <SectionLabel>My submissions</SectionLabel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="surface p-4">
          <div className="flex items-center gap-2 text-clay">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Awaiting sign-off</span>
          </div>
          <div className="mt-1 font-heading text-2xl font-semibold">{awaiting.length}</div>
        </div>
        <div className="surface p-4">
          <div className="flex items-center gap-2 text-sage">
            <CheckCircle className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Released</span>
          </div>
          <div className="mt-1 font-heading text-2xl font-semibold">{released.length}</div>
        </div>
        <div className="surface p-4">
          <div className="flex items-center gap-2 text-ink-500">
            <Send className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Total submitted</span>
          </div>
          <div className="mt-1 font-heading text-2xl font-semibold">{submissions.length}</div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-200 bg-clay-soft/30 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-clay">
          Awaiting supervisor sign-off ({awaiting.length})
        </div>
        {awaiting.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-400">
            No results pending. Complete processing and tap Submit to send here.
          </p>
        ) : (
          <div className="divide-y divide-ink-200">
            {awaiting.map((o) => {
              const p = getPatient(o, patients);
              return (
                <div key={o.id} className="row-hover flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="font-mono text-[12px]">{o.accession}</div>
                  <div className="min-w-[140px] flex-1">
                    <div className="font-medium">{p?.name}</div>
                    <div className="text-[11px] text-ink-400">{o.test_code} · {o.test_name}</div>
                  </div>
                  <PriorityPill priority={o.priority} />
                  <StatusPill status={o.status} />
                  <span className="font-mono text-[11px] text-ink-400">
                    Submitted {formatRelative(o.completed_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-200 bg-sage-soft/50 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-sage">
          Released to clinicians ({released.length})
        </div>
        {released.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-400">No released reports yet.</p>
        ) : (
          <div className="divide-y divide-ink-200">
            {released.map((o) => {
              const p = getPatient(o, patients);
              return (
                <div key={o.id} className="row-hover flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="font-mono text-[12px]">{o.accession}</div>
                  <div className="min-w-[140px] flex-1">
                    <div className="font-medium">{p?.name}</div>
                    <div className="text-[11px] text-ink-400">{o.test_code}</div>
                  </div>
                  <PriorityPill priority={o.priority} />
                  <div className="text-right text-[11px]">
                    <div className="text-sage">{o.validated_by}</div>
                    <div className="font-mono text-ink-400">{formatDateTime(o.released_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
