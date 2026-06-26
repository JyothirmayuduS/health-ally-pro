import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  UserCheck,
} from "lucide-react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { StaffTopNav } from "@/components/medora-ui/StaffTopNav";
import { ReceptionProvider } from "@/lib/reception-store";
import { receptionist } from "@/lib/reception-mock-data";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/reception", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/reception/patients", label: "Patients", icon: Users },
  { to: "/reception/appointments", label: "Schedule", icon: CalendarDays },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered },
  { to: "/reception/check-in", label: "Check-in", icon: UserCheck },
] as const;

type ReceptionShellProps = {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  greeting?: string;
  showCta?: boolean;
  ctaLabel?: string;
  ctaTo?: string;
  className?: string;
};

export function ReceptionShell({
  children,
  title,
  subtitle,
  greeting,
  showCta = false,
  ctaLabel = "Register New Patient",
  ctaTo = "/reception/register",
  className,
}: ReceptionShellProps) {
  const { pathname } = useLocation();
  const isFullscreen = pathname === "/reception/token-display";

  if (isFullscreen) {
    return (
      <ReceptionProvider>
        <div className="reception-portal min-h-dvh bg-[#F5F7F8] font-sans antialiased text-[#1C2A2E]">
          {children ?? <Outlet />}
        </div>
      </ReceptionProvider>
    );
  }

  return (
    <ReceptionProvider>
      <div className="reception-portal min-h-dvh bg-[#F5F7F8] font-sans antialiased text-[#1C2A2E]">
        <StaffTopNav
          homeTo="/reception"
          items={navItems}
          user={{
            name: receptionist.name,
            role: receptionist.role,
            photoUrl:
              "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
          }}
        />
        <main className={cn("mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10", className)}>
          {(title || greeting) && (
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                {greeting && (
                  <p className="text-sm font-semibold text-[#94A3B8]">{greeting}</p>
                )}
                {title && (
                  <h1 className="text-[2rem] font-bold tracking-tight text-[#1C2A2E] md:text-[2.25rem]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="max-w-xl text-sm font-medium text-[#64748B]">{subtitle}</p>
                )}
              </div>
              {showCta && (
                <Link
                  to={ctaTo}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4F064] px-6 py-3.5 text-sm font-bold text-[#1C2A2E] shadow-[0_4px_16px_rgba(212,240,100,0.4)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  {ctaLabel}
                </Link>
              )}
            </header>
          )}
          {children ?? <Outlet />}
        </main>
      </div>
    </ReceptionProvider>
  );
}
