import { createFileRoute } from "@tanstack/react-router";
import MySubmissions from "@/components/lab-desk/pages/MySubmissions";
import { requireLabTechnician } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/my-submissions")({
  beforeLoad: () => requireLabTechnician(),
  component: MySubmissions,
});
