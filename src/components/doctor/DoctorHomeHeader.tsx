import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { apkDoctor } from "@/lib/doctor-apk-data";
import { navBadgeClass } from "@/lib/doctor-alert-tiers";
import { unreadNotificationCount } from "@/lib/doctor-profile-store";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function formatDate() {
  return new Date()
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();
}

export function DoctorHomeHeader({ className }: { className?: string }) {
  const notificationBadge = unreadNotificationCount();

  return (
    <header className={cn("w-full", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">{greeting()}</p>
          <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
            {apkDoctor.shortName}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[#B8735D]">{apkDoctor.specialty}</p>
          <p className="mt-2 text-[10px] font-medium tracking-[0.1em] text-[#8A8F8C]">{formatDate()}</p>
        </div>
        <Link
          to="/doctor/settings/notifications"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] bg-white text-[#8A8F8C] transition-colors hover:bg-[#FAFAF8] hover:text-[#1B3B2E]"
          aria-label={
            notificationBadge > 0
              ? `Notifications, ${notificationBadge} unread`
              : "Notifications"
          }
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {notificationBadge > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-4",
                navBadgeClass(notificationBadge > 2),
              )}
            >
              {notificationBadge > 9 ? "9+" : notificationBadge}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
