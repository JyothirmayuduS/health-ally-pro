import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  name: string;
  appointmentCount?: number;
  subtitle?: string;
  showSearch?: boolean;
};

export function DoctorDashboardHeader({
  search,
  onSearchChange,
  name,
  appointmentCount = 1,
  subtitle,
  showSearch = true,
}: Props) {
  const apptLabel = appointmentCount === 1 ? "appointment" : "appointments";
  const line =
    subtitle ?? `You have ${appointmentCount} ${apptLabel} today`;

  return (
    <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="shrink-0">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-[#1B3B2E] md:text-[2.35rem]">
          Hello, {name}
        </h1>
        <p className="mt-1.5 text-[15px] text-[#8A8F8C]">{line}</p>
      </div>

      {showSearch && (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[720px] lg:flex-1 lg:justify-end">
          <div className="relative min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="h-[52px] w-full rounded-full border-0 bg-[#E8E4DF] pl-6 pr-14 text-sm text-[#1B3B2E] placeholder:text-[#8A8F8C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B8735D]/40"
            />
            <Search className="pointer-events-none absolute right-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A8F8C]" />
          </div>
          <div className="flex shrink-0 gap-2.5">
            <button
              type="button"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#8A8F8C] shadow-[0_2px_10px_rgba(28,42,46,0.06)]"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
              Filter
            </button>
            <button
              type="button"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#8A8F8C] shadow-[0_2px_10px_rgba(28,42,46,0.06)]"
            >
              <ArrowUpDown className="h-4 w-4" strokeWidth={1.75} />
              Sort By
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
