import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Clock4,
  Info,
  PackagePlus,
  RefreshCcw,
} from "lucide-react";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { cn } from "@/lib/utils";

export function MedicationDetailPage({ medId }: { medId: string }) {
  const { meds, toggle } = usePatientMedications();
  const med = meds.find((m) => m.id === medId);
  const taken = med?.taken ?? false;

  const toggleTaken = () => toggle(medId);

  if (!med) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p>Medication not found.</p>
          <Link to="/medications" className="mt-4 inline-block text-clay">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const tag = med.instructionTag ?? med.reason;
  const clinical = med.clinicalReason ?? med.reason;
  const supplyLow = (med.pillsRemaining ?? 99) <= 7;
  const supplyPct = med.pillsRemaining && med.totalPills
    ? Math.round((med.pillsRemaining / med.totalPills) * 100)
    : 0;

  return (
    <div className="relative -mx-5 w-[calc(100%+2.5rem)] bg-[#FDFBF9] sm:mx-0 sm:w-full lg:mx-0">
      <div className="relative mx-auto w-full lg:grid lg:grid-cols-[minmax(280px,42%)_1fr] lg:gap-0 xl:grid-cols-[minmax(320px,38%)_1fr]">
        <div className="relative h-[320px] overflow-hidden sm:h-[380px] lg:h-auto lg:min-h-[520px]">
          <img
            src="/med-abstract.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <Link
            to="/medications"
            className="absolute left-5 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-full bg-white/70 shadow-sm backdrop-blur-sm lg:left-8"
          >
            <ChevronLeft className="h-6 w-6 text-[#1E3A32]" strokeWidth={2.5} />
          </Link>
        </div>

      <div className="relative z-10 -mt-10 rounded-t-[36px] bg-[#FDFBF9] px-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-8 lg:mt-0 lg:rounded-none lg:px-10 lg:pb-12 lg:pt-12">
        <div className="flex flex-wrap gap-2.5">
          <Tag tone="clay">{med.frequency}</Tag>
          <Tag tone="ink">{med.time}</Tag>
          <Tag tone="green">{tag.toUpperCase()}</Tag>
        </div>

        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-ink">
          {med.name}
        </h1>
        <p className="mt-1.5 text-lg text-ink-muted/80">{med.dosage}</p>

        <div className="my-8 h-px w-full bg-[#EDEAE6]" />

        <Section title="Why it's prescribed">
          <div className="flex gap-4 rounded-3xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/15">
              <Info className="h-5 w-5 text-clay" />
            </span>
            <div>
              <p className="font-semibold text-ink">{clinical}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted/80">
                Prescribed by {med.prescribedBy} to actively manage and stabilize your
                condition over the long term.
              </p>
            </div>
          </div>
        </Section>

        {med.bestWayToTake ? (
          <Section title="Best practices">
            <div className="flex gap-4 rounded-3xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              </span>
              <p className="text-sm leading-relaxed text-ink-muted/85">{med.bestWayToTake}</p>
            </div>
          </Section>
        ) : null}

        {(med.interactions?.length || med.sideEffects?.length) ? (
          <Section title="Precautions">
            <div className="rounded-3xl border border-[#E5A059]/40 bg-[#FFFBF5] p-5">
              {med.interactions?.length ? (
                <PrecautionBlock
                  icon={AlertTriangle}
                  title="Do not combine with"
                  items={med.interactions}
                />
              ) : null}
              {med.interactions?.length && med.sideEffects?.length ? (
                <div className="my-3.5 h-px bg-[#EDEAE6]" />
              ) : null}
              {med.sideEffects?.length ? (
                <PrecautionBlock icon={Activity} title="Possible side effects" items={med.sideEffects} />
              ) : null}
            </div>
          </Section>
        ) : null}

        {med.alternatives?.length ? (
          <Section title="Common alternatives">
            <div className="flex flex-wrap gap-2.5">
              {med.alternatives.map((alt) => (
                <span
                  key={alt}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-2.5 text-[13px] font-medium text-ink-muted shadow-sm"
                >
                  <RefreshCcw className="h-3.5 w-3.5 text-clay" />
                  {alt}
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Your adherence">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_16px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-ink" />
              <span className="font-serif text-[32px] text-ink">0%</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              You have taken this medication 0 out of the last 30 days.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#EDEAE6]">
              <div className="h-full w-0 rounded-full bg-[#EDEAE6]" />
            </div>
          </div>
        </Section>

        {med.pillsRemaining != null && med.totalPills != null ? (
          <Section title="Current supply">
            <div
              className={cn(
                "rounded-3xl bg-white p-5 shadow-[0_6px_14px_rgba(0,0,0,0.03)]",
                supplyLow && "border-[1.5px] border-[#D35E50]",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-ink">
                  Current supply
                </span>
                <span
                  className={cn(
                    "shrink-0 font-serif text-lg",
                    supplyLow ? "text-[#D35E50]" : "text-ink",
                  )}
                >
                  {med.pillsRemaining} tablets left
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDEAE6]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.max(supplyPct, supplyLow ? 8 : 4)}%`,
                    backgroundColor: supplyLow ? "#D35E50" : "#B8735D",
                  }}
                />
              </div>
              {supplyLow ? (
                <Link
                  to="/medications/$medId/refill"
                  params={{ medId: med.id }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D35E50] py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-95"
                >
                  <PackagePlus className="h-[18px] w-[18px]" />
                  Request Refill from Clinic
                </Link>
              ) : null}
            </div>
          </Section>
        ) : null}

        <div className="hidden lg:block">
          <MarkTakenButton taken={taken} onToggle={toggleTaken} />
        </div>
      </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EDEAE6] bg-[#FDFBF9]/95 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <MarkTakenButton taken={taken} onToggle={toggleTaken} />
      </div>
    </div>
  );
}

function MarkTakenButton({
  taken,
  onToggle,
}: {
  taken: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-[20px] py-[18px] text-base font-semibold transition-colors",
        taken
          ? "border border-[#EDEAE6] bg-[#F5F1EB] text-ink-muted shadow-none"
          : "bg-ink text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
      )}
    >
      {taken ? (
        <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
      ) : (
        <Clock4 className="h-5 w-5" strokeWidth={1.75} />
      )}
      {taken ? "Already taken today (Tap to Undo)" : "Mark as Taken"}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 font-serif text-lg tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "clay" | "ink" | "green";
}) {
  const styles = {
    clay: "bg-clay/10 text-clay",
    ink: "bg-ink/10 text-ink",
    green: "bg-emerald-500/15 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "rounded-[14px] px-4 py-2 text-[13px] font-semibold uppercase tracking-wide",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

function PrecautionBlock({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof AlertTriangle;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#E5A059]" />
        <p className="font-semibold text-ink">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-ink-muted">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
