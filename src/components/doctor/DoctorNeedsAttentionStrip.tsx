import { Link } from "@tanstack/react-router";
import { profileAttentionItems } from "@/lib/doctor-profile-store";
import { cn } from "@/lib/utils";

export function DoctorNeedsAttentionStrip() {
  const items = profileAttentionItems();
  if (items.length === 0) return null;

  return (
    <section aria-label="Needs attention">
      <h2 className="mb-2 text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">NEEDS ATTENTION</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:flex-wrap lg:overflow-visible">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={cn(
              "flex min-h-[44px] min-w-[200px] shrink-0 items-center gap-3 rounded-[18px] border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md lg:min-w-0 lg:flex-1",
              item.tone === "urgent" && "border-[#FECACA]",
              item.tone === "warn" && "border-[#F5E6B8]",
              item.tone === "info" && "border-[#E8E4DF]",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                item.tone === "urgent" && "bg-[#C45C4A]",
                item.tone === "warn" && "bg-[#E9A820]",
                item.tone === "info" && "bg-[#8A8F8C]",
              )}
            >
              {item.count > 9 ? "9+" : item.count}
            </span>
            <span className="min-w-0 text-sm font-semibold text-[#1B3B2E]">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
