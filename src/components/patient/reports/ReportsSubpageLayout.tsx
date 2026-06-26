import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ReportsSubpageLayout({
  title,
  subtitle,
  backTo = "/reports",
  children,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-12",
        footer && "pb-28 lg:pb-12",
        className,
      )}
    >
      <header className="mb-5 flex items-center gap-3 sm:mb-6">
        <Link
          to={backTo}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2.25} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[26px] leading-tight text-ink sm:text-[32px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      </header>

      {children}

      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EDEAE6] bg-[#F9F7F2]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Mobile: card. Desktop (lg+): flat divided row inside parent list. */
export function reportsListItemClass(active = false) {
  return cn(
    "block w-full rounded-[20px] border border-[#EDEAE6] bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors",
    "lg:rounded-none lg:border-0 lg:border-b lg:border-[#EDEAE6] lg:bg-transparent lg:p-0 lg:py-4 lg:shadow-none",
    active && "lg:bg-white/60",
    !active && "hover:border-clay/25 lg:hover:bg-white/50",
  );
}

export function reportsListWrapClass() {
  return "flex flex-col gap-3 lg:gap-0 lg:divide-y lg:divide-[#EDEAE6] lg:border-y lg:border-[#EDEAE6]";
}
