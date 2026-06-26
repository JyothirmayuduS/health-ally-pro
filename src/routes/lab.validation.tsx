import { createFileRoute } from "@tanstack/react-router";
import Validation from "@/components/lab-desk/pages/Validation";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/validation")({
  beforeLoad: () => requireLabSupervisor(),
  component: Validation,
});
