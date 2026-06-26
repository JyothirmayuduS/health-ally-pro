import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; to?: string };

export function DoctorProfileBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-3 hidden lg:block">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#8A8F8C]">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#D4D0CB]">›</span>}
            {item.to ? (
              <Link to={item.to} className="font-medium hover:text-[#B8735D] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#1B3B2E]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function DoctorProfileSubpage({
  title,
  subtitle,
  backTo = "/doctor/settings",
  backLabel = "Back to profile",
  action,
  children,
  className,
  contentClassName,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl pb-6 lg:max-w-5xl", className)}>
      <DoctorProfileBreadcrumbs
        items={breadcrumbs ?? [{ label: "Profile", to: "/doctor/settings" }, { label: title }]}
      />
      <div className="mb-5 flex items-start gap-3">
        <Link
          to={backTo}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-white text-[#1B3B2E] shadow-sm transition-colors hover:bg-[#FAF9F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40"
          aria-label={backLabel}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="font-serif text-[1.5rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-[#8A8F8C]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("space-y-5", contentClassName)}>{children}</div>
    </div>
  );
}

export function ProfileSectionCard({
  title,
  hint,
  children,
  className,
  id,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("space-y-2", className)}>
      {title && (
        <div className="px-1">
          <h2 className="text-sm font-semibold text-[#1B3B2E]">{title}</h2>
          {hint && <p className="text-xs text-[#8A8F8C]">{hint}</p>}
        </div>
      )}
      <div className="rounded-[22px] border border-[#EDEAE6] bg-white p-4 shadow-[0_2px_14px_rgba(27,59,46,0.04)] sm:p-5">
        {children}
      </div>
    </section>
  );
}

export function ProfileEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#E8E4DF] bg-white px-6 py-12 text-center">
      <p className="font-semibold text-[#1B3B2E]">{title}</p>
      <p className="mt-1 text-sm text-[#8A8F8C]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
