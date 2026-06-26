import { Bell, Search } from "lucide-react";
import { receptionist } from "@/lib/reception-mock-data";

type Props = {
  search?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
};

export function DeskTopBar({ search = "", onSearchChange, showSearch = true }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-zinc-200/80 bg-white/80 px-6 backdrop-blur-xl">
      <p className="hidden text-sm text-zinc-500 lg:block">{today}</p>

      {showSearch && onSearchChange && (
        <div className="relative ml-auto max-w-md flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patients, appointments…"
            className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      )}

      <button
        type="button"
        aria-label="Notifications"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <Bell className="h-4 w-4" />
      </button>

      <div className="flex shrink-0 items-center gap-3 border-l border-zinc-200 pl-4">
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face"
          alt=""
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
        />
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-zinc-900">{receptionist.name}</p>
          <p className="text-[11px] text-zinc-500">{receptionist.role}</p>
        </div>
      </div>
    </header>
  );
}
