import { createFileRoute } from "@tanstack/react-router";
import { BookDoctorPage } from "@/components/patient/book/BookDoctorPage";

export const Route = createFileRoute("/book/$doctorId")({
  component: function BookDoctorRoute() {
    const { doctorId } = Route.useParams();
    return <BookDoctorPage doctorId={doctorId} />;
  },
});
