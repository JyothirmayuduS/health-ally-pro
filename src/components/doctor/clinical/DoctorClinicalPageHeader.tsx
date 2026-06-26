import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  steps?: string[];
  compact?: boolean;
  className?: string;
};

export function DoctorClinicalPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  steps,
  compact = false,
  className,
}: Props) {
  return (
    <header className={cn(compact ? "space-y-2 lg:space-y-4" : "space-y-4", className)}>
      <div className="flex items-center gap-2.5 lg:items-start lg:gap-3">
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl bg-[#E8EFE6] text-[#1B3B2E] lg:rounded-2xl",
            compact ? "h-9 w-9 lg:h-12 lg:w-12" : "h-12 w-12",
          )}
        >
          <Icon className={cn(compact ? "h-4 w-4 lg:h-6 lg:w-6" : "h-6 w-6")} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-semibold tracking-[0.14em] text-[#8A8F8C]",
              compact ? "text-[9px] lg:text-[10px]" : "text-[10px]",
            )}
          >
            {eyebrow}
          </p>
          <h1
            className={cn(
              "font-serif font-semibold leading-tight text-[#1B3B2E]",
              compact
                ? "text-lg lg:text-[1.75rem]"
                : "text-[1.5rem] sm:text-[1.75rem]",
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "leading-relaxed text-[#8A8F8C]",
              compact ? "mt-0.5 hidden text-xs lg:block lg:text-sm" : "mt-1 text-sm",
            )}
          >
            {description}
          </p>
        </div>
      </div>
      {steps && steps.length > 0 ? (
        <ol className={cn("flex flex-wrap gap-1.5 lg:gap-2", compact && "hidden lg:flex")}>
          {steps.map((step, i) => (
            <li
              key={step}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-3 py-1.5 text-xs font-medium text-[#1B3B2E]"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1B3B2E] text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </header>
  );
}
