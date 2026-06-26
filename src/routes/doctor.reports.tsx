import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DoctorInboxWorkspace } from "@/components/doctor/DoctorInboxWorkspace";

type InboxSearch = {
  id?: string;
  tab?: "messages" | "referrals" | "tasks" | "results";
};

export const Route = createFileRoute("/doctor/reports")({
  validateSearch: (search: Record<string, unknown>): InboxSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
    tab:
      search.tab === "messages" ||
      search.tab === "referrals" ||
      search.tab === "tasks" ||
      search.tab === "results"
        ? search.tab
        : undefined,
  }),
  head: () => ({
    meta: [{ title: "Inbox — Medora Doctor" }],
  }),
  component: DoctorReports,
});

function DoctorReports() {
  const { id, tab } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === "messages") navigate({ to: "/doctor/messaging", replace: true });
    if (tab === "referrals") navigate({ to: "/doctor/settings/referrals", replace: true });
    if (tab === "tasks") navigate({ to: "/doctor/patients/tasks", replace: true });
  }, [tab, navigate]);

  return <DoctorInboxWorkspace selectedResultId={id} />;
}
