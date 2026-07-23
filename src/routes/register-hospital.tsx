import { createFileRoute } from "@tanstack/react-router";
import RegisterHospitalPage from "@/components/marketing/RegisterHospitalPage";

type RegisterHospitalSearch = { plan?: string };

export const Route = createFileRoute("/register-hospital")({
  validateSearch: (s: Record<string, unknown>): RegisterHospitalSearch => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({ meta: [{ title: "Register hospital — Medora" }] }),
  component: function RegisterHospitalRoute() {
    const { plan } = Route.useSearch();
    return <RegisterHospitalPage initialPlan={plan} />;
  },
});
