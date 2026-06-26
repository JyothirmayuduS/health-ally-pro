import { createFileRoute } from "@tanstack/react-router";
import { BookHubPage } from "@/components/patient/book/BookHubPage";

function BookIndexPage() {
  return <BookHubPage />;
}

export const Route = createFileRoute("/book/")({
  head: () => ({ meta: [{ title: "Find a Doctor — Medora" }] }),
  component: BookIndexPage,
});
