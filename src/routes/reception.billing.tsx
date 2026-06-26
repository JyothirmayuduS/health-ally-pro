import { createFileRoute } from "@tanstack/react-router";
import Billing from "@/components/reception-desk/pages/Billing";

export const Route = createFileRoute("/reception/billing")({
  component: Billing,
});
