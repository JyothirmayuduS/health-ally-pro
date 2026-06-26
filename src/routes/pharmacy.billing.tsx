import { createFileRoute } from "@tanstack/react-router";
import Billing from "@/components/pharmacy-desk/pages/Billing";

export const Route = createFileRoute("/pharmacy/billing")({
  component: Billing,
});
