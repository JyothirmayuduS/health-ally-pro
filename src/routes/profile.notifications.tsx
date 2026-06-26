import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileSubpageLayout } from "@/components/patient/profile/ProfileSubpageLayout";
import {
  listPatientNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type PatientNotification,
} from "@/lib/patient-notifications-store";

export const Route = createFileRoute("/profile/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Medora" }] }),
  component: function ProfileNotificationsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<PatientNotification[]>([]);

    const refresh = () => setItems(listPatientNotifications());

    useEffect(() => {
      refresh();
      const onChange = () => refresh();
      window.addEventListener("medora-notifications-changed", onChange);
      return () => window.removeEventListener("medora-notifications-changed", onChange);
    }, []);

    const unread = items.filter((n) => n.unread).length;

    const handleOpen = (n: PatientNotification) => {
      markNotificationRead(n.id);
      refresh();
      navigate({ to: n.to, params: n.params });
    };

    return (
      <ProfileSubpageLayout
        title="Notifications"
        subtitle="Reminders, shares, and care updates."
      >
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead();
              refresh();
            }}
            className="mb-4 text-sm font-semibold text-clay"
          >
            Mark all as read
          </button>
        ) : null}

        <ul className="overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white divide-y divide-[#EDEAE6]">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleOpen(n)}
                className="flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F9F7F2]/60 sm:px-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
                  <Bell className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{n.title}</p>
                    {n.unread ? (
                      <span className="h-2 w-2 rounded-full bg-clay" aria-label="Unread" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-muted/80">{n.at}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Tap a notification to open the related screen.
        </p>
      </ProfileSubpageLayout>
    );
  },
});
