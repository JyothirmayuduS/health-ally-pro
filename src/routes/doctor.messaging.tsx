import { createFileRoute, redirect } from "@tanstack/react-router";

type DoctorMessagingSearch = { patientId?: string };


export const Route = createFileRoute("/doctor/messaging")({
  validateSearch: (search: Record<string, unknown>): DoctorMessagingSearch => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  beforeLoad: () => {
    throw redirect({ to: "/doctor/reports", search: { tab: "messages" } });
  },
  component: () => null,
});
