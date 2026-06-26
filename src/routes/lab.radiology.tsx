import { createFileRoute } from "@tanstack/react-router";
import RadiologyPage from "@/components/lab-desk/pages/Radiology";

export const Route = createFileRoute("/lab/radiology")({
  head: () => ({ meta: [{ title: "Radiology — Laboratory" }] }),
  component: RadiologyPage,
});
