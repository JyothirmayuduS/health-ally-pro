import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/results")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/doctor/reports",
      search: typeof search === "object" && search && "id" in search ? { id: String(search.id) } : {},
    });
  },
  component: () => null,
});
