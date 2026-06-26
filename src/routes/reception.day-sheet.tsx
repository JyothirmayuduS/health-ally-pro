import { createFileRoute } from "@tanstack/react-router";
import DaySheet from "@/components/reception-desk/pages/DaySheet";

export const Route = createFileRoute("/reception/day-sheet")({
  component: DaySheet,
});
