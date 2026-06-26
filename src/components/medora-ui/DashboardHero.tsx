import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type Props = {
  name: string;
  subtitle: string;
  search: string;
  onSearchChange: (v: string) => void;
};

export function DashboardHero({ name, subtitle, search, onSearchChange }: Props) {
  return (
    <section className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-[#1C2A2E] md:text-[2.5rem]">
          Hello, {name}
        </h1>
        <p className="text-[15px] font-medium text-[#64748B]">{subtitle}</p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[520px] lg:max-w-[640px] lg:flex-1 lg:justify-end">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="h-[52px] w-full rounded-full border border-transparent bg-[#E0E7EB] pl-6 pr-14 text-sm font-medium text-[#1C2A2E] placeholder:font-normal placeholder:text-[#94A3B8] transition-all focus:border-[#D4F064]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D4F064]/15"
          />
          <Search
            className="pointer-events-none absolute right-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94A3B8]"
            strokeWidth={1.75}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <ToolbarButton icon={SlidersHorizontal} label="Filter" />
          <ToolbarButton icon={ArrowUpDown} label="Sort By" />
        </div>
      </div>
    </section>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-[52px] items-center gap-2 rounded-full border border-[#E8ECED] bg-white px-5 text-sm font-semibold text-[#64748B] shadow-[0_2px_8px_rgba(28,42,46,0.04)] transition-all hover:border-[#D4F064]/40 hover:text-[#1C2A2E]"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
