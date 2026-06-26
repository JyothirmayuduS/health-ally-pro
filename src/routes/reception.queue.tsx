import { createFileRoute } from "@tanstack/react-router";
import Queue from "@/components/reception-desk/pages/Queue";

export const Route = createFileRoute("/reception/queue")({
  component: Queue,
});
