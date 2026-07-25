import { createFileRoute } from "@tanstack/react-router";
import {
  DoctorImmunizationWorkspace,
  type ImmView,
} from "@/components/doctor/immunizations/DoctorImmunizationWorkspace";

type ImmSearch = {
  patientId?: string;
  view?: ImmView;
  doseId?: string;
};

const VIEWS: ImmView[] = [
  "due",
  "schedule",
  "administer",
  "history",
  "reminders",
  "aefi",
  "catchup",
  "certificate",
];

export const Route = createFileRoute("/doctor/immunizations")({
  validateSearch: (search: Record<string, unknown>): ImmSearch => {
    const view = search.view;
    const validView = VIEWS.includes(view as ImmView) ? (view as ImmView) : "due";
    return {
      patientId: typeof search.patientId === "string" ? search.patientId : undefined,
      view: validView,
      doseId: typeof search.doseId === "string" ? search.doseId : undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Vaccinations — Medora Doctor" }],
  }),
  component: DoctorImmunizationsPage,
});

function DoctorImmunizationsPage() {
  const { patientId, view, doseId } = Route.useSearch();
  return (
    <DoctorImmunizationWorkspace
      view={view ?? "due"}
      initialPatientId={patientId}
      doseId={doseId}
    />
  );
}
