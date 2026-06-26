import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFilter?: () => void;
  onSort?: () => void;
};

export function SearchFilterBar({
  value,
  onChange,
  placeholder = "Search by name or condition...",
  className,
  onFilter,
  onSort,
}: SearchFilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border-0 bg-[#E0E7EB] py-2.5 pl-11 pr-4 text-sm text-[#1e293b] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F06D]/40"
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onFilter}
          className="inline-flex items-center gap-2 rounded-full bg-[#E0E7EB] px-4 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#d5dde1]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-2 rounded-full bg-[#E0E7EB] px-4 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#d5dde1]"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort By</span>
        </button>
      </div>
    </div>
  );
}
