import { Link, useLocation } from "@tanstack/react-router";
import { Bell, MessageSquare } from "lucide-react";
import { MedoraLogo } from "./MedoraLogo";
import { cn } from "@/lib/utils";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
};

type Props = {
  homeTo: string;
  items: NavItem[];
  user: { name: string; role: string; photoUrl: string };
};

export function StaffTopNav({ homeTo, items, user }: Props) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8ECED]/80 bg-[#F5F7F8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-6 px-5 lg:px-10">
        <Link to={homeTo} aria-label="Home" className="shrink-0 transition-opacity hover:opacity-90">
          <MedoraLogo />
        </Link>

        <nav
          className="mx-auto hidden items-center gap-1 rounded-full bg-[#E0E7EB]/90 p-1.5 md:flex"
          aria-label="Main"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200",
                  active
                    ? "bg-[#1C2A2E] text-white shadow-[0_4px_12px_rgba(28,42,46,0.25)]"
                    : "text-[#64748B] hover:bg-white/60 hover:text-[#1C2A2E]",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <IconCircle label="Notifications">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </IconCircle>
          <IconCircle label="Messages">
            <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </IconCircle>
          <div className="ml-2 flex items-center gap-3 border-l border-[#E2E8F0] pl-4">
            <img
              src={user.photoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold leading-tight text-[#1C2A2E]">
                {user.name}
              </p>
              <p className="text-[11px] font-medium text-[#94A3B8]">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconCircle({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#64748B] shadow-[0_2px_8px_rgba(28,42,46,0.05)] transition-all hover:text-[#1C2A2E] hover:shadow-[0_4px_12px_rgba(28,42,46,0.08)]"
    >
      {children}
    </button>
  );
}
