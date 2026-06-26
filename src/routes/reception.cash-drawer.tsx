import { createFileRoute } from "@tanstack/react-router";
import CashDrawer from "@/components/reception-desk/pages/CashDrawer";

export const Route = createFileRoute("/reception/cash-drawer")({
  component: CashDrawer,
});
