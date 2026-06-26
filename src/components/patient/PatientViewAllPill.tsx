import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  to: string;
  className?: string;
  params?: Record<string, string>;
};

/** Capsule “View all ›” control from patient UI spec. */
export function PatientViewAllPill({ to, className, params }: Props) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#E8E4DF] bg-white",
        "px-4 py-2 text-[13px] font-medium leading-none text-[#5C5C5C]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        "transition-colors hover:border-[#D5D0CA] hover:bg-[#FDFBF9]",
        className,
      )}
    >
      View all
      <ChevronRight className="h-3.5 w-3.5 stroke-[1.75] text-[#5C5C5C]" aria-hidden />
    </Link>
  );
}
