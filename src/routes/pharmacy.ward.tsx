import { createFileRoute } from "@tanstack/react-router";
import WardOrders from "@/components/pharmacy-desk/pages/WardOrders";

export const Route = createFileRoute("/pharmacy/ward")({
  component: WardOrders,
});
