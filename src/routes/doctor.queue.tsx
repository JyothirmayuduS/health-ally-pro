import { createFileRoute } from "@tanstack/react-router";
import { LiveQueueScreen } from "@/components/doctor/LiveQueueScreen";

export const Route = createFileRoute("/doctor/queue")({
  component: DoctorQueue,
});

function DoctorQueue() {
  return <LiveQueueScreen />;
}
