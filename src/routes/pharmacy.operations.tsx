import { createFileRoute } from "@tanstack/react-router";
import Operations from "@/components/pharmacy-desk/pages/Operations";

export const Route = createFileRoute("/pharmacy/operations")({
  component: Operations,
});
