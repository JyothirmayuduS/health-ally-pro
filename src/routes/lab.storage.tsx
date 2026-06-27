import { createFileRoute } from "@tanstack/react-router";
import SampleStorage from "@/components/lab-desk/pages/SampleStorage";

export const Route = createFileRoute("/lab/storage")({
  component: SampleStorage,
});
