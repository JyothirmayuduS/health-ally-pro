import { Link } from "@tanstack/react-router";
import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { openPatientMenu } from "@/lib/patient-shell-events";
import { openPatientSearch } from "@/lib/patient-search";
import { unreadNotificationCount } from "@/lib/patient-notifications-store";

type Props = {
  className?: string;
};

/** Top bar for patient hub pages on mobile — menu, search, notifications (safe-area aware). */
export function PatientHubMobileBar({ className }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(unreadNotificationCount());
    const onNotif = () => setUnreadCount(unreadNotificationCount());
    window.addEventListener("medora-notifications-changed", onNotif);
    return () => window.removeEventListener("medora-notifications-changed", onNotif);
  }, []);

  return (
    <div
      className={[
        "mb-4 flex items-center gap-2 lg:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        onClick={() => openPatientMenu()}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#EDEAE6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => openPatientSearch()}
        className="relative flex min-w-0 flex-1 items-center rounded-2xl border border-[#EDEAE6] bg-white py-2.5 pl-10 pr-3 text-left text-sm text-ink-muted shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        aria-label="Search"
      >
        <Search className="absolute left-3 h-4 w-4 text-ink-muted" strokeWidth={1.75} />
        Search doctors, reports, meds…
      </button>
      <Link
        to="/profile/notifications"
        aria-label="Notifications"
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#EDEAE6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <Bell className="h-5 w-5 text-ink" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-clay" />
        ) : null}
      </Link>
    </div>
  );
}
