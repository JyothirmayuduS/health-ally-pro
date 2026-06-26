import { createFileRoute } from "@tanstack/react-router";
import OperationTheatrePage from "@/components/admin-desk/pages/OperationTheatre";

export const Route = createFileRoute("/admin/ot")({
  head: () => ({ meta: [{ title: "Operation Theatre — Admin" }] }),
  component: OperationTheatrePage,
});
