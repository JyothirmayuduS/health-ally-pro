import { createFileRoute } from "@tanstack/react-router";
import TechnicianDashboard from "@/components/lab-desk/pages/TechnicianDashboard";
import SupervisorDashboard from "@/components/lab-desk/pages/SupervisorDashboard";
import { getAuthSession } from "@/lib/supabase/auth";
import { isLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/")({
  loader: async () => {
    const session = await getAuthSession();
    return { isSupervisor: session ? isLabSupervisor(session.roles) : false };
  },
  component: LabHome,
});

function LabHome() {
  const { isSupervisor } = Route.useLoaderData();
  return isSupervisor ? <SupervisorDashboard /> : <TechnicianDashboard />;
}
