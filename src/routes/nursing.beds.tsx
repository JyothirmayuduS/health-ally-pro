import { createFileRoute } from "@tanstack/react-router";
import NursingBedsPage from "@/components/nursing-desk/pages/Beds";

export const Route = createFileRoute("/nursing/beds")({
  head: () => ({ meta: [{ title: "IPD & Beds — Nursing" }] }),
  component: NursingBedsPage,
});
