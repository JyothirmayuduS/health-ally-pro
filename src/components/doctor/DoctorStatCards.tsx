import type { LucideIcon } from "lucide-react";

export type DoctorStatItem = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export function DoctorStatCards({ items }: { items: DoctorStatItem[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="flex items-center gap-3.5 rounded-[22px] bg-white px-4 py-4 shadow-[0_4px_20px_rgba(28,42,46,0.06)]"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: item.iconBg }}
            >
              <Icon className="h-5 w-5" style={{ color: item.iconColor }} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8F8C]">
                {item.label}
              </p>
              <p className="text-xl font-bold text-[#1B3B2E]">{item.value}</p>
              {item.hint && <p className="truncate text-[11px] text-[#8A8F8C]">{item.hint}</p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
