import { createFileRoute } from "@tanstack/react-router";
import { DoctorScheduleCalendarScreen } from "@/components/doctor/DoctorScheduleCalendarScreen";

type ScheduleSearch = {
  date?: string;
};

export const Route = createFileRoute("/doctor/schedule")({
  validateSearch: (search: Record<string, unknown>): ScheduleSearch => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  component: DoctorSchedulePage,
  head: () => ({ meta: [{ title: "Schedule — Medora Doctor" }] }),
});

function DoctorSchedulePage() {
  const { date } = Route.useSearch();
  return <DoctorScheduleCalendarScreen selectedDateKey={date} />;
}
