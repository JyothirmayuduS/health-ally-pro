import { SearchFilterBar } from "./SearchFilterBar";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  subtitle: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
  hideGreeting?: boolean;
};

export function DashboardHeader({
  name,
  subtitle,
  search = "",
  onSearchChange,
  showSearch = true,
  hideGreeting = false,
}: Props) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
      {!hideGreeting && (
        <div className="shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] md:text-[2rem]">
            Hello, {name}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
        </div>
      )}
      {showSearch && onSearchChange && (
        <SearchFilterBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search patients, doctors..."
          className={cn("w-full", hideGreeting ? "lg:ml-0" : "lg:max-w-xl")}
        />
      )}
    </header>
  );
}
