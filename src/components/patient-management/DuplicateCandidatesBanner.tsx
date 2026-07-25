import { AlertTriangle } from "lucide-react";
import type { ManagedPatient } from "@/lib/patient-management/schemas";
import type { SharedPatient } from "@/lib/shared/patients";

export type DuplicateCandidate = ManagedPatient | SharedPatient;

function label(p: DuplicateCandidate) {
  if ("fullName" in p && typeof p.fullName === "string" && p.fullName) {
    return { name: p.fullName, id: p.mrn || p.id, phone: p.phone ?? "—" };
  }
  const sp = p as import("@/lib/shared/patients").SharedPatient;
  return { name: sp.name, id: sp.id, phone: sp.phone };
}

export function DuplicateCandidatesBanner({
  candidates,
  onOpenExisting,
  onContinueAnyway,
}: {
  candidates: DuplicateCandidate[];
  onOpenExisting: (id: string) => void;
  onContinueAnyway: () => void;
}) {
  if (candidates.length === 0) return null;
  return (
    <section
      data-testid="duplicate-candidates-banner"
      className="border border-status-waitBorder bg-status-waitBg/60 rounded-sm p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-status-waitText shrink-0" />
        <div>
          <div className="text-[12.5px] font-medium text-status-waitText">
            Possible duplicate{candidates.length > 1 ? "s" : ""} found
          </div>
          <div className="text-[11px] text-ink-400 mt-1">
            Review before creating a new hospital record.
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {candidates.map((c) => {
          const { name, id, phone } = label(c);
          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-white/80 border border-ink-200 px-3 py-2"
            >
              <div className="text-[12px] text-ink-900">
                <span className="font-medium">{name}</span>
                <span className="text-ink-400 font-mono ml-2">
                  {id} · {phone}
                </span>
              </div>
              <button
                type="button"
                data-testid={`duplicate-open-${id}`}
                onClick={() => onOpenExisting(id)}
                className="text-[12px] font-medium text-sage hover:text-sage-hover"
              >
                Open existing
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        data-testid="duplicate-continue-anyway"
        onClick={onContinueAnyway}
        className="text-[12px] font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900"
      >
        Continue anyway and create new record
      </button>
    </section>
  );
}
