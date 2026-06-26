import { createFileRoute } from "@tanstack/react-router";
import { DoctorHomeDashboard } from "@/components/doctor/DoctorHomeDashboard";
import { DoctorHomeHeader } from "@/components/doctor/DoctorHomeHeader";

export const Route = createFileRoute("/doctor/")({
  component: DoctorHome,
});

function DoctorHome() {
  return (
    <div className="relative mx-auto w-full max-w-[1400px] space-y-6 pb-4 lg:pb-8">
      <DoctorHomeHeader />
      <DoctorHomeDashboard />
    </div>
  );
}
