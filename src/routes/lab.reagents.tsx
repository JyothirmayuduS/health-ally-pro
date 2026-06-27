import { createFileRoute } from "@tanstack/react-router";
import ReagentInventory from "@/components/lab-desk/pages/ReagentInventory";

export const Route = createFileRoute("/lab/reagents")({
  component: ReagentInventory,
});
