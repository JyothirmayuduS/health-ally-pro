import { Link, useLocation } from "@tanstack/react-router";
import { Bell, MessageSquare } from "lucide-react";
import { DOCTOR_PRIMARY_NAV } from "@/lib/doctor-portal-nav";
import { apkDoctor } from "@/lib/doctor-apk-data";
import { cn } from "@/lib/utils";

function MedoraLogo() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#B8735D] shadow-[0_2px_8px_rgba(212,240,100,0.35)]">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M16 6c-1.2 0-2.2.5-3 1.3-.8-.8-1.8-1.3-3-1.3-2.5 0-4.5 2.2-4.5 4.8 0 3.2 2.8 5.8 7.5 10.2 4.7-4.4 7.5-7 7.5-10.2C20.5 8.2 18.5 6 16 6z"
          fill="#1B3B2E"
        />
      </svg>
    </span>
  );
}

export function DoctorTopNav() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-[#F7F5F2]/95 pb-2 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <Link to="/doctor" className="shrink-0" aria-label="Medora Doctor Portal">
          <MedoraLogo />
        </Link>

        <nav
          className="mx-auto hidden items-center gap-0.5 rounded-full bg-[#E8E4DF] p-1 md:flex"
          aria-label="Doctor portal"
        >
          {DOCTOR_PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all",
                  active
                    ? "bg-[#1B3B2E] text-white shadow-sm"
                    : "text-[#8A8F8C] hover:text-[#1B3B2E]",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#8A8F8C] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <Link
            to="/doctor/messaging"
            aria-label="Messages"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#8A8F8C] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <div className="ml-1 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1B3B2E] text-sm font-semibold text-white ring-2 ring-white">
              {apkDoctor.initials}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-[#1B3B2E]">{apkDoctor.shortName}</p>
              <p className="text-[11px] font-medium text-[#8A8F8C]">{apkDoctor.specialty}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
