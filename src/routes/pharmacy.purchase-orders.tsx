import { createFileRoute } from "@tanstack/react-router";
import PurchaseOrders from "@/components/pharmacy-desk/pages/PurchaseOrders";

export const Route = createFileRoute("/pharmacy/purchase-orders")({
  component: PurchaseOrders,
});
