import { Link } from "@tanstack/react-router";
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Moon,
  Package,
  Pill,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { PatientMedShell } from "@/components/patient/medications/PatientMedShell";
import { OverallAdherenceCard } from "@/components/patient/medications/OverallAdherenceCard";
import { doseProgressPercent } from "@/components/patient/medications/patient-med-utils";
import type { PatientMedication } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function InstructionTag({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const Icon = lower.includes("food") ? UtensilsCrossed : lower.includes("bed") ? Moon : Pill;
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#B8735D]/10 px-2 py-1 text-[11px] font-medium text-[#B8735D]">
      <Icon className="h-3 w-3" strokeWidth={2} />
      {label}
    </span>
  );
}

function DoseRow({
  med,
  onToggle,
}: {
  med: PatientMedication;
  onToggle: (id: string) => void;
}) {
  const tag = med.instructionTag ?? med.reason;
  const takenLabel = med.taken ? `Mark ${med.name} as not taken` : `Mark ${med.name} as taken`;

  return (
    <div className="flex items-stretch gap-1 rounded-[20px] border border-[#EDEAE6] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onToggle(med.id)}
        aria-label={takenLabel}
        aria-pressed={med.taken}
        className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center self-stretch rounded-l-[20px] px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      >
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-full border-2 transition-colors",
            med.taken ? "border-clay bg-clay text-white" : "border-[#E5E1DC] bg-white",
          )}
        >
          {med.taken ? <span className="text-[10px] font-bold">✓</span> : null}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(med.id)}
        aria-label={takenLabel}
        className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 py-3 pr-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0DDD6]/60">
          <Pill className="h-4 w-4 text-clay" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-base font-semibold",
              med.taken ? "text-ink-muted line-through opacity-65" : "text-ink",
            )}
          >
            {med.name}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            <span className={cn(med.taken && "line-through opacity-60")}>
              Take at {med.time} · {med.dosage}
            </span>
          </p>
          <InstructionTag label={tag} />
        </div>
      </button>
      <Link
        to="/medications/$medId"
        params={{ medId: med.id }}
        aria-label={`Open ${med.name} details`}
        className="grid min-h-[48px] min-w-[48px] shrink-0 place-items-center self-stretch rounded-r-[20px] pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      >
        <ChevronRight className="h-[18px] w-[18px] text-ink-muted" />
      </Link>
    </div>
  );
}

export function MedicationsHubPage() {
  const [tab, setTab] = useState<"today" | "timetable">("today");
  const { meds, toggle } = usePatientMedications();
  const today = new Date();
  const taken = meds.filter((m) => m.taken).length;
  const pct = doseProgressPercent(meds);

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, i) => addDays(start, i));
  }, [today]);

  const sorted = useMemo(
    () =>
      [...meds].sort((a, b) => {
        const pa = Number.parseInt(a.time, 10) || 0;
        const pb = Number.parseInt(b.time, 10) || 0;
        return pa - pb;
      }),
    [meds],
  );

  const toggleMed = toggle;

  return (
    <PatientMedShell>
      <header className="mb-5 flex items-start gap-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:pt-0">
        <Link
          to="/health"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full lg:hidden"
          aria-label="Back to Health"
        >
          <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[28px] leading-tight tracking-tight text-ink lg:text-[32px]">
            Medications
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {format(today, "EEEE, d MMMM")}
          </p>
        </div>
        <span className="mt-1 rounded-[10px] bg-[#F0DDD6] px-2.5 py-1.5 text-[13px] font-semibold text-clay">
          {pct}%
        </span>
      </header>

      <div className="mb-5 flex max-w-xl rounded-[14px] border border-[#EDEAE6] bg-white p-1 lg:max-w-md">
        {(
          [
            { id: "today" as const, label: "Today", icon: List },
            { id: "timetable" as const, label: "Timetable", icon: CalendarDays },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold transition-colors",
              tab === id ? "bg-ink text-white" : "text-ink-muted",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={tab === id ? 2 : 1.75} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/medications/refill-history"
          className="flex items-center gap-3 rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D35E50]/10">
            <Package className="h-[18px] w-[18px] text-[#D35E50]" strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-base font-semibold text-ink">Refill Requests</span>
          <ChevronRight className="h-[18px] w-[18px] text-ink-muted" />
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-h-[132px] flex-col rounded-[20px] border border-[#EDEAE6] bg-white p-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
            <p className="text-[17px] font-semibold leading-snug text-ink">
              {taken} of {meds.length} doses taken
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Tap a dose for instructions, interactions, and refill info.
            </p>
            <div className="mt-auto pt-3.5">
              <div className="h-1 overflow-hidden rounded-full bg-[#EDEAE6]">
                <div
                  className="h-full rounded-full bg-clay transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          <OverallAdherenceCard pct={0} />
        </div>

        {tab === "timetable" ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              This week
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:overflow-visible">
              {weekDays.map((day) => {
                const active = isSameDay(day, today);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex w-[52px] shrink-0 flex-col items-center rounded-[14px] border py-2.5 lg:w-auto lg:min-w-[72px] lg:flex-1",
                      active ? "border-ink bg-ink text-white" : "border-[#EDEAE6] bg-white text-ink",
                    )}
                  >
                    <span className="text-[10px] font-semibold">{format(day, "EEE").toUpperCase()}</span>
                    <span className="mt-0.5 text-lg font-semibold">{format(day, "d")}</span>
                    {active ? <span className="mt-1.5 h-1 w-1 rounded-full bg-white" /> : null}
                  </div>
                );
              })}
            </div>

            <h2 className="font-serif text-xl text-ink">Schedule · Today</h2>
            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-1">
              {sorted.map((med, i) => (
                <div key={med.id} className="flex gap-2 lg:gap-3">
                  <div className="hidden w-14 shrink-0 pt-4 text-right text-xs font-semibold text-clay lg:block lg:w-16">
                    {med.time}
                  </div>
                  <div className="relative hidden w-4 shrink-0 justify-center pt-5 lg:flex">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-[#EDEAE6] bg-white" />
                    {i < sorted.length - 1 ? (
                      <span className="absolute top-7 bottom-0 w-px bg-[#EDEAE6]" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <DoseRow med={med} onToggle={toggleMed} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-xl text-ink">Today&apos;s doses</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {meds.map((med) => (
                <DoseRow key={med.id} med={med} onToggle={toggleMed} />
              ))}
            </div>
          </>
        )}
      </div>
    </PatientMedShell>
  );
}
