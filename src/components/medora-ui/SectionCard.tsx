import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "white" | "lime" | "panel";
  className?: string;
  showArrow?: boolean;
  onArrowClick?: () => void;
};

const variants = {
  white: "bg-white shadow-[0_8px_32px_rgba(28,42,46,0.06)]",
  lime: "bg-[#E8F5C8] shadow-[0_8px_32px_rgba(28,42,46,0.04)]",
  panel: "bg-[#EEF6D4] shadow-[0_8px_32px_rgba(28,42,46,0.05)]",
};

export function SectionCard({
  title,
  subtitle,
  children,
  variant = "white",
  className,
  showArrow = true,
}: Props) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-[32px] p-6 lg:p-7",
        variants[variant],
        className,
      )}
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-bold tracking-tight text-[#1C2A2E]">{title}</h2>
          {subtitle && (
            <p className="max-w-sm text-xs leading-relaxed text-[#64748B]">{subtitle}</p>
          )}
        </div>
        {showArrow && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/90 text-[#64748B] shadow-[0_2px_8px_rgba(28,42,46,0.06)]">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </span>
        )}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}
