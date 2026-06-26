import { createFileRoute } from "@tanstack/react-router";
import Register from "@/components/reception-desk/pages/Register";

export const Route = createFileRoute("/reception/register")({
  component: Register,
});
