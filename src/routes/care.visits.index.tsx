import { createFileRoute } from "@tanstack/react-router";
import { PastVisitsPage } from "@/components/patient/care/PastVisitsPage";

type VisitsSearch = {
  doctor?: string;
};

export const Route = createFileRoute("/care/visits/")({
  validateSearch: (search: Record<string, unknown>): VisitsSearch => ({
    doctor: typeof search.doctor === "string" ? search.doctor : undefined,
  }),
  head: () => ({
    meta: [{ title: "Past Visits — Medora" }],
  }),
  component: function CareVisitsIndexRoute() {
    const { doctor } = Route.useSearch();
    return <PastVisitsPage doctorFilter={doctor} />;
  },
});
