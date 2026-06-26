import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DoctorProfileSubpage,
  ProfileEmptyState,
} from "./DoctorProfileSubpage";
import {
  acceptReferral,
  declineReferral,
  markAllNotificationsRead,
  markNotificationRead,
  respondToCoverageRequest,
  restoreNotificationsRead,
  unreadNotificationCount,
} from "@/lib/doctor-profile-store";
import {
  useProfileStore,
} from "@/lib/doctor-profile-store-context";
import type { NotificationCategory, ProfileNotification } from "@/lib/doctor-profile-store";
import { cn } from "@/lib/utils";

type FilterCategory = "all" | NotificationCategory;

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "coverage", label: "Coverage" },
  { id: "referral", label: "Referrals" },
  { id: "results", label: "Results" },
  { id: "system", label: "System" },
];

function groupLabel(group?: string) {
  if (group === "today") return "Today";
  if (group === "week") return "This week";
  return "Earlier";
}

function NotificationCard({
  item,
  onNavigate,
  compact,
}: {
  item: ProfileNotification;
  onNavigate: (item: ProfileNotification) => void;
  compact?: boolean;
}) {
  const isCoverageRequest = item.kind === "request";
  const referralId = item.actionParams?.referralId;
  const isReferralAction = item.kind === "referral" && item.unread && referralId;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        item.unread && "border-l-4 border-l-[#B8735D]",
        compact && item.unread && "ring-1 ring-[#B8735D]/20",
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate(item)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40 rounded-lg"
      >
        <p className="font-semibold text-[#1B3B2E]">{item.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#8A8F8C]">{item.body}</p>
        <p className="mt-2 text-xs text-[#ADADAD]">{item.relativeTime}</p>
      </button>
      {isCoverageRequest && item.unread && (
        <div className="mt-3 flex gap-2 border-t border-[#F0EDE8] pt-3">
          <button
            type="button"
            onClick={() => {
              respondToCoverageRequest(item.id, false);
              toast.message("Coverage declined");
            }}
            className="flex-1 rounded-xl border border-[#E8E4DF] py-2 text-xs font-semibold text-[#8A8F8C]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              respondToCoverageRequest(item.id, true);
              toast.success("Coverage accepted");
            }}
            className="flex-1 rounded-xl bg-[#1B3B2E] py-2 text-xs font-semibold text-white"
          >
            Accept
          </button>
        </div>
      )}
      {isReferralAction && referralId && (
        <div className="mt-3 flex gap-2 border-t border-[#F0EDE8] pt-3">
          <button
            type="button"
            onClick={() => {
              declineReferral(referralId);
              markNotificationRead(item.id);
              toast.message("Referral rejected");
            }}
            className="flex-1 rounded-xl border border-[#E8E4DF] py-2 text-xs font-semibold text-[#8A8F8C]"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              acceptReferral(referralId);
              markNotificationRead(item.id);
              toast.success("Referral accepted");
            }}
            className="flex-1 rounded-xl bg-[#1B3B2E] py-2 text-xs font-semibold text-white"
          >
            Accept
          </button>
        </div>
      )}
    </article>
  );
}

export function DoctorNotificationsScreen({ selectedId }: { selectedId?: string }) {
  const store = useProfileStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? store.notifications
        : store.notifications.filter((n) => n.category === filter);
    return list;
  }, [store.notifications, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ProfileNotification[]> = {};
    for (const item of filtered) {
      const key = groupLabel(item.group);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filtered]);

  const unread = unreadNotificationCount();
  const selected = selectedId
    ? store.notifications.find((n) => n.id === selectedId)
    : undefined;

  const handleNavigate = (item: ProfileNotification) => {
    markNotificationRead(item.id);
    if (item.actionTo?.includes("$referralId") && item.actionParams?.referralId) {
      navigate({
        to: "/doctor/settings/referrals",
        search: { id: item.actionParams.referralId },
      });
      return;
    }
    if (item.actionTo === "/doctor/settings/emergency") {
      navigate({ to: "/doctor/settings/emergency" });
      return;
    }
    if (item.actionTo === "/doctor/reports") {
      navigate({ to: "/doctor/reports" });
      return;
    }
    if (item.actionTo === "/doctor/settings/schedule" || item.actionTo === "/doctor/schedule") {
      navigate({ to: "/doctor/schedule" });
      return;
    }
    if (item.actionTo === "/doctor/settings/notifications") {
      navigate({ to: "/doctor/settings/notifications" });
    }
  };

  const handleMarkAllRead = () => {
    const prev = markAllNotificationsRead();
    toast.success("All notifications marked read", {
      action: {
        label: "Undo",
        onClick: () => restoreNotificationsRead(prev.map((n) => n.id)),
      },
    });
  };

  const showMasterDetail = Boolean(selectedId);

  return (
    <DoctorProfileSubpage
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Notifications" },
      ]}
      action={
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-sm font-semibold text-[#B8735D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40"
        >
          Mark all read
        </button>
      }
      contentClassName={
        showMasterDetail
          ? "lg:grid lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start lg:gap-6 lg:space-y-0"
          : undefined
      }
    >
      <div
        className={cn(
          showMasterDetail &&
            "lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1",
        )}
      >
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                filter === f.id
                  ? "bg-[#1B3B2E] text-white"
                  : "border border-[#E8E4DF] bg-white text-[#8A8F8C]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <ProfileEmptyState
            title="No notifications"
            description="Alerts about coverage, referrals, and results will appear here."
          />
        ) : (
          <div className="mt-3 space-y-5">
            {Object.entries(grouped).map(([label, items]) => (
              <section key={label}>
                <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">
                  {label.toUpperCase()}
                </p>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id}>
                      <NotificationCard
                        item={item}
                        onNavigate={handleNavigate}
                        compact={showMasterDetail}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {showMasterDetail && selected && (
        <div className="hidden lg:block">
          <div className="rounded-[22px] border border-[#EDEAE6] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold tracking-wide text-[#8A8F8C]">
              {selected.category.toUpperCase()}
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-[#1B3B2E]">{selected.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#1B3B2E]">{selected.body}</p>
            <p className="mt-3 text-xs text-[#ADADAD]">{selected.relativeTime}</p>
            {selected.actionTo && (
              <Link
                to={
                  selected.actionTo.includes("$referralId")
                    ? "/doctor/settings/referrals"
                    : (selected.actionTo as "/doctor/reports")
                }
                search={
                  selected.actionParams?.referralId
                    ? { id: selected.actionParams.referralId }
                    : undefined
                }
                onClick={() => markNotificationRead(selected.id)}
                className="mt-4 inline-flex rounded-xl bg-[#1B3B2E] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open related item
              </Link>
            )}
          </div>
        </div>
      )}
    </DoctorProfileSubpage>
  );
}
