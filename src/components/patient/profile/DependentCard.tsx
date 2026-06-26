import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Pill,
  Stethoscope,
} from "lucide-react";
import {
  DependentPersonaAvatar,
  dependentAccent,
} from "@/components/patient/profile/DependentPersonaAvatar";
import type { Dependent } from "@/lib/patient-profile-data";
import { relationTag } from "@/lib/patient-profile-data";
import { cn } from "@/lib/utils";

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-[#F9F7F2] px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">{label}</p>
      <p
        className="mt-0.5 truncate text-sm font-semibold text-ink"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

export function DependentPreviewCard({ dep }: { dep: Dependent }) {
  return (
    <Link
      to="/profile/dependents/$dependentId"
      params={{ dependentId: dep.id }}
      className="block rounded-[20px] border border-[#EDEAE6] bg-white p-4 transition-colors hover:border-[#E0DBD4] active:bg-[#F9F7F2] sm:rounded-[22px] sm:p-4"
    >
      <div className="flex items-center gap-3">
        <DependentPersonaAvatar dep={dep} size="sm" showAdherence />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">{dep.name}</p>
            <span className="shrink-0 rounded-full bg-[#F3F1EC] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-muted">
              {relationTag(dep)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{dep.carePlan}</p>
          <p className="mt-1.5 text-[11px] font-medium text-[#A67C66]">
            Next · {dep.nextConsultation.split("·")[0]?.trim()}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
      </div>
    </Link>
  );
}

export function DependentFullCard({ dep }: { dep: Dependent }) {
  const { stroke } = dependentAccent(dep);
  const medProgress = `${dep.medsTakenToday}/${dep.medsTotalToday}`;

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white transition-shadow hover:shadow-sm sm:rounded-[22px]">
      <Link
        to="/profile/dependents/$dependentId"
        params={{ dependentId: dep.id }}
        className="block p-4 sm:p-5"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <DependentPersonaAvatar dep={dep} size="md" showAdherence />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-serif text-lg text-ink sm:text-xl">{dep.name}</h2>
              <span className="rounded-full bg-[#F3F1EC] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                {relationTag(dep)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {dep.age} years · {dep.bloodGroup} · Proxy access active
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink">{dep.carePlan}</p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted" />
        </div>

        <div className="mt-4 flex gap-2">
          <StatChip label="Adherence" value={`${dep.adherence}%`} accent={stroke} />
          <StatChip label="Meds today" value={dep.medsTotalToday ? medProgress : "—"} />
          <StatChip
            label="Next visit"
            value={dep.nextConsultation.split("·")[0]?.trim() ?? "—"}
          />
        </div>
      </Link>

      <div className="grid grid-cols-1 divide-y divide-[#EDEAE6] border-t border-[#EDEAE6] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { icon: Stethoscope, text: dep.primaryDoctor },
          { icon: CalendarClock, text: dep.nextConsultation },
          { icon: Pill, text: dep.medicationsToday },
        ].map(({ icon: Icon, text }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-4 py-3 text-xs text-ink-muted sm:px-4 sm:py-3.5"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="line-clamp-2">{text}</span>
          </div>
        ))}
      </div>

      {dep.allergies.length > 0 ? (
        <div className="flex items-center gap-2 border-t border-[#EDEAE6] bg-[#FDF6F5] px-4 py-2.5 text-xs text-[#B5534A] sm:px-5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="line-clamp-1">Allergies: {dep.allergies.join(", ")}</span>
        </div>
      ) : null}
    </article>
  );
}

export function DependentEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#D8D4CE] bg-white px-6 py-10 text-center">
      <p className="font-serif text-xl text-ink">No dependents yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        Add a child, parent, or spouse to manage appointments, medications, and reports on
        their behalf.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "mt-5 inline-flex items-center justify-center rounded-2xl bg-ink px-5 py-3",
          "text-sm font-semibold text-white transition-opacity hover:opacity-90",
        )}
      >
        Add first dependent
      </button>
    </div>
  );
}
