import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pharmacy/reports")({
  beforeLoad: () => {
    throw redirect({ to: "/pharmacy/operations" });
  },
});
