import { createFileRoute } from "@tanstack/react-router";
import Insurance from "@/components/reception-desk/pages/Insurance";

export const Route = createFileRoute("/reception/insurance")({
  component: Insurance,
});
