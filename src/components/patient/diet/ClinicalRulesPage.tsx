import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Info,
  ShieldCheck,
} from "lucide-react";
import { ABSORPTION_GUARD_PLAN, getDietMeal } from "@/lib/diet-mock-data";

type ClinicalRulesPageProps = {
  /** When set, shows meal-specific rules. When omitted, shows plan-level protocol. */
  mealId?: string;
};

export function ClinicalRulesPage({ mealId }: ClinicalRulesPageProps) {
  const meal = mealId ? getDietMeal(mealId) : null;
  const isPlanLevel = !mealId || !meal;

  if (mealId && !meal) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Clinical protocol not found.</p>
        <Link to="/diet" className="mt-4 inline-block text-clay">
          Back
        </Link>
      </div>
    );
  }

  const gap = meal?.protocol?.medGap ?? ABSORPTION_GUARD_PLAN.medGap;
  const barriers = meal?.protocol?.caution ?? ABSORPTION_GUARD_PLAN.barriers;
  const subtitle = isPlanLevel
    ? "Clinical guidelines for your personalized diet plan while on thyroid medication."
    : `Clinical guidelines for consuming ${meal!.name} while on thyroid medication.`;

  return (
    <div className="mx-auto w-full max-w-lg pb-12 lg:max-w-2xl">
      <header className="mb-8 flex items-center gap-3">
        {isPlanLevel ? (
          <Link
            to="/diet"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            aria-label="Back to diet"
          >
            <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
          </Link>
        ) : (
          <Link
            to="/diet/$mealId"
            params={{ mealId: mealId! }}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            aria-label="Back to meal"
          >
            <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.5} />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-ink">
          Clinical Rules
        </h1>
        <span className="w-11 shrink-0" aria-hidden />
      </header>

      <div className="mb-10 text-center">
        <span className="mx-auto mb-4 grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-clay/15">
          <ShieldCheck className="h-9 w-9 text-clay" strokeWidth={1.5} />
        </span>
        <h2 className="font-serif text-[26px] leading-tight tracking-tight text-ink sm:text-[28px]">
          Absorption Guard Protocol
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
          {subtitle}
        </p>
      </div>

      <section className="mb-8">
        <SectionLabel icon={Clock} iconClassName="text-clay">
          Timing Strategy
        </SectionLabel>
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <div className="mb-5 rounded-2xl bg-clay/10 px-4 py-5 text-center">
            <p className="font-serif text-[32px] leading-none text-clay">{gap}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-clay">
              Minimum Gap Required
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            Levothyroxine requires a high-acid, low-interference environment for peak
            absorption. Wait at least {gap} after taking your medication before consuming
            {isPlanLevel ? " meals in your clinical diet plan." : " this meal."}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <SectionLabel icon={AlertCircle} iconClassName="text-[#E55B46]">
          Absorption Barriers
        </SectionLabel>
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3">
            {barriers.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-[#E55B46]/[0.06] px-4 py-3.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#E55B46]/10">
                  <Info className="h-4 w-4 text-[#E55B46]" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-medium leading-snug text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionLabel icon={CheckCircle2} iconClassName="text-emerald-600">
          Optimization Strategy
        </SectionLabel>
        <div className="rounded-[24px] border border-[#EDEAE6] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <p className="font-serif text-[18px] leading-snug text-ink">
            Maximizing Bioavailability
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {isPlanLevel
              ? ABSORPTION_GUARD_PLAN.optimization
              : "To ensure nutrients like Selenium and Iodine in this meal reach your thyroid follicular cells efficiently, avoid concurrent intake of calcium or iron supplements, which compete for transport pathways."}
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  iconClassName,
  children,
}: {
  icon: typeof Clock;
  iconClassName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <Icon className={`h-[18px] w-[18px] ${iconClassName}`} strokeWidth={1.75} />
      <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-ink">
        {children}
      </h3>
    </div>
  );
}
