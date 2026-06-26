import { createFileRoute } from "@tanstack/react-router";
import Inventory from "@/components/pharmacy-desk/pages/Inventory";

export const Route = createFileRoute("/pharmacy/inventory")({
  component: Inventory,
});
