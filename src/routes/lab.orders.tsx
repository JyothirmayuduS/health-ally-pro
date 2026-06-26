import { createFileRoute } from "@tanstack/react-router";
import Orders from "@/components/lab-desk/pages/Orders";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/orders")({
  beforeLoad: () => requireLabSupervisor(),
  component: Orders,
});
