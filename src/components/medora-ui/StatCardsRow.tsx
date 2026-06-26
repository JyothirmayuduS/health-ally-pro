import type { LucideIcon } from "lucide-react";

export type StatItem = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

type Props = {
  items: StatItem[];
};

export function StatCardsRow({ items }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key metrics">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="flex items-center gap-3.5 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_4px_16px_rgba(28,42,46,0.05)]"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: item.iconBg }}
            >
              <Icon className="h-5 w-5" style={{ color: item.iconColor }} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                {item.label}
              </p>
              <p className="text-xl font-bold leading-tight text-[#1C2A2E]">{item.value}</p>
              {item.hint && (
                <p className="truncate text-[11px] font-medium text-[#64748B]">{item.hint}</p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
