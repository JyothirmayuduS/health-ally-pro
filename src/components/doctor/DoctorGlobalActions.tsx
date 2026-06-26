import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { openDoctorCommandPalette } from "@/components/doctor/DoctorCommandPalette";
import { navBadgeClass } from "@/lib/doctor-alert-tiers";
import { unreadNotificationCount } from "@/lib/doctor-profile-store";
import { cn } from "@/lib/utils";

type Props = {
  layout?: "inline" | "sidebar";
  hideNotifications?: boolean;
  className?: string;
};

/** Minimal global actions — no profile avatar (nav handles identity) */
export function DoctorGlobalActions({
  layout = "inline",
  hideNotifications = false,
  className,
}: Props) {
  const { pathname } = useLocation();
  const notificationBadge = unreadNotificationCount();
  const onNotificationsPage = pathname.startsWith("/doctor/settings/notifications");
  const showNotifications = !hideNotifications && !onNotificationsPage;
  const sidebar = layout === "sidebar";

  if (sidebar) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <button
          type="button"
          onClick={openDoctorCommandPalette}
          className="flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#8A8F8C] transition-colors hover:bg-[#FAF9F7] hover:text-[#1B3B2E]"
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded-md bg-[#F5F2ED] px-1.5 py-0.5 text-[10px] font-medium text-[#ADADAD]">⌘K</kbd>
        </button>
        {showNotifications && (
          <Link
            to="/doctor/settings/notifications"
            className="flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#8A8F8C] transition-colors hover:bg-[#FAF9F7] hover:text-[#1B3B2E]"
          >
            <Bell className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="flex-1">Notifications</span>
            {notificationBadge > 0 && (
              <span
                className={cn(
                  "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold",
                  navBadgeClass(notificationBadge > 2),
                )}
              >
                {notificationBadge > 9 ? "9+" : notificationBadge}
              </span>
            )}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={openDoctorCommandPalette}
        className="grid h-9 w-9 place-items-center rounded-full text-[#8A8F8C] transition-colors hover:bg-[#EDEAE6]/80 hover:text-[#1B3B2E]"
        aria-label="Search (Cmd+K)"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
      {showNotifications && (
        <Link
          to="/doctor/settings/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full text-[#8A8F8C] transition-colors hover:bg-[#EDEAE6]/80 hover:text-[#1B3B2E]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {notificationBadge > 0 && (
            <span
              className={cn(
                "absolute right-0.5 top-0.5 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-4",
                navBadgeClass(notificationBadge > 2),
              )}
            >
              {notificationBadge > 9 ? "9+" : notificationBadge}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
