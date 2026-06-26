import { createFileRoute } from "@tanstack/react-router";
import { MedicationDetailPage } from "@/components/patient/medications/MedicationDetailPage";

export const Route = createFileRoute("/medications/$medId")({
  component: function MedDetailRoute() {
    const { medId } = Route.useParams();
    return <MedicationDetailPage medId={medId} />;
  },
});
