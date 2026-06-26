import { Link } from "@tanstack/react-router";
import { ClipboardList, MessageSquare, Send } from "lucide-react";
import { referralsAwaitingCount } from "@/lib/doctor-profile-store";
import { PANEL_TASKS } from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";

const MESSAGE_UNREAD = 1;

/** Secondary destinations — not competing tabs on the results inbox */
export function InboxQuickLinks({ className }: { className?: string }) {
  const pendingReferrals = referralsAwaitingCount();
  const openTasks = PANEL_TASKS.filter((t) => !t.done).length;

  const links = [
    {
      to: "/doctor/messaging" as const,
      label: "Messages",
      icon: MessageSquare,
      badge: MESSAGE_UNREAD,
    },
    {
      to: "/doctor/settings/referrals" as const,
      label: "Referrals",
      icon: Send,
      badge: pendingReferrals,
    },
    {
      to: "/doctor/patients/tasks" as const,
      label: "Tasks",
      icon: ClipboardList,
      badge: openTasks,
    },
  ];

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {links.map(({ to, label, icon: Icon, badge }) => (
        <Link
          key={to}
          to={to}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#1B3B2E] hover:bg-[#FAFAF8]"
        >
          <Icon className="h-3.5 w-3.5 text-[#8A8F8C]" strokeWidth={1.75} />
          {label}
          {badge > 0 ? (
            <span className="rounded-full bg-[#C45C4A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
