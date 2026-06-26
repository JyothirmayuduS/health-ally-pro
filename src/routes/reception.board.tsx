import { createFileRoute } from "@tanstack/react-router";
import DoctorBoard from "@/components/reception-desk/pages/DoctorBoard";

export const Route = createFileRoute("/reception/board")({
  component: DoctorBoard,
});
