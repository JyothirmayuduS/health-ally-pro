import { createFileRoute } from "@tanstack/react-router";
import AdminHRPerformance from "@/components/admin-desk/pages/HRPerformance";

export const Route = createFileRoute("/admin/hr")({
  component: AdminHRPage,
  head: () => ({ meta: [{ title: "HR & Performance — Admin" }] }),
});

function AdminHRPage() {
  return <AdminHRPerformance />;
}
