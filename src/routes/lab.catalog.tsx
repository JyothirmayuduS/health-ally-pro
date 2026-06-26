import { createFileRoute } from "@tanstack/react-router";
import Catalog from "@/components/lab-desk/pages/Catalog";

export const Route = createFileRoute("/lab/catalog")({
  component: Catalog,
});
