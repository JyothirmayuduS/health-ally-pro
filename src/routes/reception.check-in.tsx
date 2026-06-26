import { createFileRoute } from "@tanstack/react-router";
import CheckIn from "@/components/reception-desk/pages/CheckIn";

export const Route = createFileRoute("/reception/check-in")({
  component: CheckIn,
});
